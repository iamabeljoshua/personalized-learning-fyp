import os
import re
import ast
import json
import logging
import wave
import shutil
import subprocess

import whisper

from providers.llm import VideoLLMProvider
from providers.tts import TTSProvider
from providers.manim_runner import ManimRunner
from schemas.content import GenerateVideoRequest, GenerateVideoResponse, ScenePlan, SceneSection
from schemas.common import StudentContext
from processors.prompts import build_system_prompt
from processors.video_prompts import (
    SCENE_PLAN_PROMPT,
    MANIM_VOICEOVER_PROMPT,
    FEW_SHOT_EXAMPLE,
    SAFE_FALLBACK_TEMPLATE,
)
from config import settings

logger = logging.getLogger(__name__)

MAX_CODE_RETRIES = 2
WORDS_PER_SUBTITLE = 14

_whisper_model = None


def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        logger.info("Loading Whisper model (tiny)...")
        _whisper_model = whisper.load_model("tiny")
        logger.info("Whisper model loaded.")
    return _whisper_model


class VideoProcessor:
    def __init__(self, llm: VideoLLMProvider, tts: TTSProvider, manim: ManimRunner):
        self.llm = llm
        self.tts = tts
        self.manim = manim

    async def generate_video(self, request: GenerateVideoRequest) -> GenerateVideoResponse:
        video_dir = os.path.join(settings.MEDIA_STORAGE_PATH, "video")
        sections_audio_dir = os.path.join(settings.MEDIA_STORAGE_PATH, "audio", "sections", request.node_id)
        os.makedirs(video_dir, exist_ok=True)
        os.makedirs(sections_audio_dir, exist_ok=True)

        try:
            # the very first thing is to have a plan for how the scenes, so we generate that first
            # this also gets the student context injected for personalization.
            logger.info(f"[{request.node_id}] Generating scene plan...")
            plan = await self._generate_scene_plan(
                request.full_text, request.node_title, request.student_context
            )
            if not plan or not plan.sections:
                logger.error("Scene plan generation failed")
                return GenerateVideoResponse(video_url=None)
            logger.info(f"[{request.node_id}] Scene plan: {len(plan.sections)} sections")

            # once we have a plan, we generate the voice over based on the narration for the scenes
            logger.info(f"[{request.node_id}] Generating full narration audio (single TTS call)...")

            # Concatenate all section narrations with a pause marker
            section_texts = [self._sanitize_for_speech(s.narration_text) for s in plan.sections]
            full_narration = " ... ".join(section_texts)  # ellipsis creates natural pause

            full_audio_path = await self._generate_section_audio(full_narration, f"{request.node_id}_full")
            if not full_audio_path:
                logger.error("TTS generation failed")
                return GenerateVideoResponse(video_url=None)
            logger.info(f"[{request.node_id}] Full narration audio generated")

            # Use Whisper to find section boundaries in the audio
            logger.info(f"[{request.node_id}] Splitting audio into sections via Whisper...")
            section_boundaries = self._find_section_boundaries(full_audio_path, section_texts)

            # Split the full WAV into per-section MP3 files, trimming 0.05s from edges for clean cuts
            for i, (start, end) in enumerate(section_boundaries):
                mp3_dest = os.path.join(sections_audio_dir, f"sec{i}.mp3")
                trim_start = start + 0.05 if i > 0 else start  # don't trim start of first section
                trim_end = end - 0.05 if i < len(section_boundaries) - 1 else end  # don't trim end of last
                try:
                    subprocess.run(
                        ["ffmpeg", "-y", "-i", full_audio_path,
                         "-ss", str(trim_start), "-to", str(trim_end),
                         "-codec:a", "libmp3lame", "-qscale:a", "2", mp3_dest],
                        capture_output=True, check=True, timeout=30,
                    )
                    logger.info(f"  Section {i}: {trim_start:.1f}s - {trim_end:.1f}s ({trim_end-trim_start:.1f}s)")
                except Exception as e:
                    # while testing, sometimes (rare cases), this can fail, when it does, we don't want the entire pipeline to fail
                    # so we generate a silent placeholder audio for it (@todo: review how we can make this much better)
                    logger.warning(f"  Section {i}: split failed ({e}), creating silent placeholder")
                    self._create_silent_mp3(mp3_dest, duration=plan.sections[i].estimated_seconds)

            self._deploy_prerecorded_service()

            container_audio_dir = f"/media/audio/sections/{request.node_id}"
            logger.info(f"[{request.node_id}] Generating VoiceoverScene code...")
            scene_code = await self._generate_scene_code(
                request.node_title, plan, request.student_context, container_audio_dir
            )
            logger.info(f"[{request.node_id}] Scene code: {len(scene_code)} chars")

            # now we generate and render the manim into a video file, we call the configured video llm to generate the manim code
            logger.info(f"[{request.node_id}] Rendering with manim-voiceover...")
            video_path = await self.manim.render_scene(scene_code, request.node_id)
            # if it fails (which ollama running locally usually does), we try with failure context
            if not video_path:
                logger.warning("First render failed, retrying with error context...")
                render_error = await self.manim.get_last_error()
                scene_code = await self._generate_scene_code(
                    request.node_title, plan, request.student_context,
                    container_audio_dir, previous_error=render_error,
                )
                video_path = await self.manim.render_scene(scene_code, request.node_id)
            #if it fails again, we use a very simple fallback template (this is why we need a cloud llm to be configured for this part)
            if not video_path:
                # Safe fallback
                logger.warning("Second render failed, using safe fallback")
                fallback_narration = plan.sections[0].narration_text if plan.sections else "Visual explanation"
                fallback = SAFE_FALLBACK_TEMPLATE.format(
                    audio_dir=container_audio_dir,
                    narration=fallback_narration.replace('"', '\\"').replace('\n', ' '),
                    node_title=request.node_title.replace('"', '\\"'),
                )
                video_path = await self.manim.render_scene(fallback, request.node_id)
            if not video_path:
                logger.error("All render attempts failed")
                return GenerateVideoResponse(video_url=None)

            # now lets get fancy and generate sub-titles
            subtitle_path = None
            if full_audio_path:
                logger.info(f"[{request.node_id}] Generating subtitles...")
                subtitle_path = self._generate_subtitles(full_audio_path, request.node_id)

            # then add the subtitles in with ffmpeg
            if subtitle_path:
                final_path = os.path.join(video_dir, f"{request.node_id}.mp4")
                logger.info(f"[{request.node_id}] Burning in subtitles...")
                burned = await self.manim.burn_subtitles(video_path, subtitle_path, final_path)
                if burned:
                    self._cleanup(request.node_id, video_dir, sections_audio_dir, len(plan.sections))
                    return GenerateVideoResponse(video_url=f"/media/video/{request.node_id}.mp4")

            # No subtitles or burn failed, return the voiceover video as-is (already has audio)
            self._cleanup(request.node_id, video_dir, sections_audio_dir, len(plan.sections))
            # Move rendered video to final location
            final_path = os.path.join(video_dir, f"{request.node_id}.mp4")
            if video_path != final_path and os.path.exists(video_path):
                shutil.move(video_path, final_path)
            return GenerateVideoResponse(video_url=f"/media/video/{request.node_id}.mp4")

        except Exception as e:
            logger.error(f"Video generation failed: {e}", exc_info=True)
            return GenerateVideoResponse(video_url=None)

    async def _generate_scene_plan(
        self, lesson_text: str, node_title: str, student_context: StudentContext
    ) -> ScenePlan | None:
        system = build_system_prompt(student_context)
        prompt = SCENE_PLAN_PROMPT.format(
            node_title=node_title,
            lesson_text=lesson_text,
            duration="1 to 3 minutes",
        )
        for attempt in range(1, 3): # try three times to generate the scene plan
            try:
                data = await self.llm.generate_json(prompt, system=system)
                plan = ScenePlan(**data)
                if plan.sections:
                    logger.info(f"Scene plan validated on attempt {attempt}")
                    return plan
            except Exception as e:
                logger.warning(f"Scene plan attempt {attempt} failed: {e}")
                prompt += "\n\nThe previous JSON was invalid. Return valid JSON with ALL fields: title, visual_description, narration_text, estimated_seconds for EVERY section."
        return None

    # calls the tts to generate the naration audio
    async def _generate_section_audio(self, text: str, section_id: str) -> str | None:
        try:
            audio_url = await self.tts.generate(text, section_id)
            if audio_url:
                return os.path.join(
                    settings.MEDIA_STORAGE_PATH, audio_url.lstrip("/").replace("media/", "", 1)
                )
            return None
        except Exception as e:
            logger.error(f"Section TTS error: {e}", exc_info=True)
            return None

    def _deploy_prerecorded_service(self):
        """Copy PrerecordedService to the media volume so manim container can import it."""
        src = os.path.join(os.path.dirname(__file__), "..", "providers", "voiceover", "prerecorded_service.py")
        dest = os.path.join(settings.MEDIA_STORAGE_PATH, "video", "prerecorded_service.py")
        shutil.copy2(os.path.abspath(src), dest)

    async def _generate_scene_code(
        self, node_title: str, plan: ScenePlan, student_context: StudentContext,
        audio_dir: str, previous_error: str | None = None,
    ) -> str:
        plan_lines = []
        for i, s in enumerate(plan.sections, 1):
            plan_lines.append(
                f"Section {i}: \"{s.title}\"\n"
                f"  Visual: {s.visual_description}\n"
                f"  Narration (use EXACTLY this text): \"{s.narration_text}\""
            )
        scene_plan_formatted = "\n\n".join(plan_lines)
        student_profile = build_system_prompt(student_context)

        prompt = MANIM_VOICEOVER_PROMPT.format(
            scene_plan_formatted=scene_plan_formatted,
            student_profile=student_profile,
            audio_dir=audio_dir,
            few_shot_example=FEW_SHOT_EXAMPLE,
        )

        last_error = previous_error
        for attempt in range(1, MAX_CODE_RETRIES + 1):
            try:
                if last_error:
                    prompt += f"\n\nThe previous code had this runtime error:\n{last_error}\nFix it and regenerate the complete code."

                raw = await self.llm.generate(prompt)
                code = self._extract_code(raw)
                ast.parse(code)

                if "class GeneratedScene" not in code:
                    last_error = "Missing 'class GeneratedScene' definition"
                    continue
                if "VoiceoverScene" not in code:
                    last_error = "Must extend VoiceoverScene, not Scene"
                    continue

                # Fix imports: ensure prerecorded_service is importable
                code = self._fix_imports(code)

                logger.info(f"Scene code validated on attempt {attempt}")
                return code

            except SyntaxError as e:
                last_error = f"SyntaxError at line {e.lineno}: {e.msg}"
                logger.warning(f"Attempt {attempt}: {last_error}")
            except Exception as e:
                last_error = str(e)
                logger.warning(f"Attempt {attempt}: {last_error}")

        logger.warning("All code gen attempts failed, using safe fallback")
        narration = plan.sections[0].narration_text if plan.sections else "Visual explanation"
        return SAFE_FALLBACK_TEMPLATE.format(
            audio_dir=audio_dir,
            narration=narration.replace('"', '\\"').replace('\n', ' '),
            node_title=node_title.replace('"', '\\"'),
        )

    #merges individual video files together to form the full video (made from sections)
    def _concatenate_wav(self, wav_paths: list[str], output_path: str):
        params = None
        all_frames = b""
        for path in wav_paths:
            with wave.open(path, "rb") as w:
                if params is None:
                    params = w.getparams()
                all_frames += w.readframes(w.getnframes())
        if params:
            with wave.open(output_path, "wb") as out:
                out.setparams(params)
                out.writeframes(all_frames)


    # generates a .ass subtitle as it's better for placements and styling compared to a .srt file
    def _generate_subtitles(self, audio_path: str, node_id: str) -> str | None:
        try:
            model = _get_whisper_model()
            result = model.transcribe(audio_path, word_timestamps=True)

            words = []
            for segment in result.get("segments", []):
                for w in segment.get("words", []):
                    words.append({
                        "text": w["word"].strip(),
                        "start": w["start"],
                        "end": w["end"],
                    })

            if not words:
                logger.warning("Whisper returned no words")
                return None

            groups = []
            for i in range(0, len(words), WORDS_PER_SUBTITLE):
                chunk = words[i:i + WORDS_PER_SUBTITLE]
                text = " ".join(w["text"] for w in chunk)
                groups.append({
                    "start": chunk[0]["start"],
                    "end": chunk[-1]["end"],
                    "text": text,
                })

            ass_content = self._build_ass(groups)
            ass_path = os.path.join(settings.MEDIA_STORAGE_PATH, "video", f"{node_id}.ass")
            with open(ass_path, "w") as f:
                f.write(ass_content)

            logger.info(f"Subtitles: {len(groups)} groups from {len(words)} words")
            return ass_path

        except Exception as e:
            logger.error(f"Subtitle generation error: {e}", exc_info=True)
            return None

    def _build_ass(self, groups: list[dict]) -> str:
        header = "[Script Info]\n"
        header += "Title: Narration Subtitles\n"
        header += "ScriptType: v4.00+\n"
        header += "PlayResX: 1280\n"
        header += "PlayResY: 720\n"
        header += "WrapStyle: 0\n\n"
        header += "[V4+ Styles]\n"
        header += "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
        header += "Style: Default,Arial,22,&H00FFFFFF,&H000000FF,&H00000000,&H96000000,0,0,0,0,100,100,0,0,3,1,0,2,20,20,30,1\n\n"
        header += "[Events]\n"
        header += "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"

        lines = []
        for g in groups:
            start = self._format_ass_time(g["start"])
            end = self._format_ass_time(g["end"])
            text = g["text"].replace("\n", "\\N")
            lines.append(f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}")

        return header + "\n".join(lines) + "\n"

    def _format_ass_time(self, seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        cs = int((seconds % 1) * 100)
        return f"{h}:{m:02}:{s:02}.{cs:02}"


    # a naive attempt to fix the pronounciation of the tts (this needs to use a much better word bank or something to fix this fully)
    def _sanitize_for_speech(self, text: str) -> str:
        replacements = [
            (r'\bF\s*=\s*ma\b', 'F equals m times a'),
            (r'\bE\s*=\s*mc²\b', 'E equals m c squared'),
            (r'\bE\s*=\s*mc\^2\b', 'E equals m c squared'),
            (r'\bv\s*=\s*d/t\b', 'velocity equals distance divided by time'),
            (r'\ba\s*=\s*F/m\b', 'acceleration equals force divided by mass'),
            (r'(\w)\s*=\s*(\w)\s*\*\s*(\w)', r'\1 equals \2 times \3'),
            (r'(\w)\s*=\s*(\w)\s*/\s*(\w)', r'\1 equals \2 divided by \3'),
            (r'(\w)\s*=\s*(\w)\s*\+\s*(\w)', r'\1 equals \2 plus \3'),
            (r'(\w)\s*=\s*(\w)\s*-\s*(\w)', r'\1 equals \2 minus \3'),
            (r'²', ' squared'), (r'³', ' cubed'),
            (r'Δ', 'delta '), (r'≥', 'greater than or equal to'),
            (r'≤', 'less than or equal to'), (r'≠', 'not equal to'),
            (r'→', 'leads to'), (r'∞', 'infinity'), (r'π', 'pi'), (r'θ', 'theta'),
            (r'\*{1,3}(.+?)\*{1,3}', r'\1'),
            (r'#{1,6}\s+', ''),
            (r'`([^`]+)`', r'\1'),
        ]
        for pattern, replacement in replacements:
            text = re.sub(pattern, replacement, text)
        return text

    def _find_section_boundaries(self, audio_path: str, section_texts: list[str]) -> list[tuple[float, float]]:
        """Use Whisper to transcribe, then find where each section's text starts/ends."""
        try:
            model = _get_whisper_model()
            result = model.transcribe(audio_path, word_timestamps=True)

            # Get all words with timestamps
            words = []
            for segment in result.get("segments", []):
                for w in segment.get("words", []):
                    words.append({
                        "text": w["word"].strip().lower(),
                        "start": w["start"],
                        "end": w["end"],
                    })

            if not words:
                # Fallback: split evenly
                total_dur = self._get_wav_duration(audio_path) or 60.0
                sec_dur = total_dur / len(section_texts)
                return [(i * sec_dur, (i + 1) * sec_dur) for i in range(len(section_texts))]

            total_duration = words[-1]["end"]

            # Strategy: find the first few words of each section in the transcript
            # and use that as the boundary
            boundaries = []
            search_start_idx = 0

            for i, section_text in enumerate(section_texts):
                # Get first 3-4 words of this section for matching
                section_words = section_text.lower().split()[:4]

                # Find where these words appear in the transcript after the previous section
                found_idx = self._fuzzy_find_words(words, section_words, search_start_idx)

                if found_idx is not None:
                    start_time = words[found_idx]["start"]
                else:
                    # Couldn't find — estimate proportionally
                    char_offset = sum(len(t) for t in section_texts[:i])
                    total_chars = sum(len(t) for t in section_texts)
                    start_time = (char_offset / total_chars) * total_duration if total_chars > 0 else 0

                boundaries.append(start_time)
                if found_idx is not None:
                    search_start_idx = found_idx + 1

            # Convert start times to (start, end) tuples
            result_boundaries = []
            for i in range(len(boundaries)):
                start = max(0, boundaries[i] - 0.1)  # slight padding
                end = boundaries[i + 1] - 0.1 if i + 1 < len(boundaries) else total_duration
                result_boundaries.append((start, end))

            return result_boundaries

        except Exception as e:
            logger.error(f"Section boundary detection failed: {e}", exc_info=True)
            # Fallback: split evenly
            total_dur = self._get_wav_duration(audio_path) or 60.0
            sec_dur = total_dur / len(section_texts)
            return [(i * sec_dur, (i + 1) * sec_dur) for i in range(len(section_texts))]

    def _fuzzy_find_words(self, words: list[dict], target: list[str], start_idx: int) -> int | None:
        """Find the position where target words approximately appear in the transcript."""
        for i in range(start_idx, len(words) - len(target) + 1):
            matches = 0
            for j, tw in enumerate(target):
                if i + j < len(words):
                    # Fuzzy: check if first 4 chars match (handles minor transcription differences)
                    w = words[i + j]["text"]
                    if w[:4] == tw[:4] or w == tw:
                        matches += 1
            if matches >= len(target) * 0.6:  # 60% match threshold
                return i
        return None

    def _create_silent_mp3(self, mp3_path: str, duration: float = 5.0):
        """Create a silent MP3 file as a placeholder for failed TTS."""
        try:
            subprocess.run(
                ["ffmpeg", "-y", "-f", "lavfi", "-i", f"anullsrc=r=24000:cl=mono",
                 "-t", str(duration), "-codec:a", "libmp3lame", "-qscale:a", "9", mp3_path],
                capture_output=True, check=True, timeout=10,
            )
        except Exception as e:
            logger.error(f"Silent MP3 creation failed: {e}")

    def _wav_to_mp3(self, wav_path: str, mp3_path: str):
        """Convert WAV to MP3 using ffmpeg (required for manim-voiceover's mutagen.mp3)."""
        try:
            subprocess.run(
                ["ffmpeg", "-y", "-i", wav_path, "-codec:a", "libmp3lame", "-qscale:a", "2", mp3_path],
                capture_output=True, check=True, timeout=30,
            )
        except Exception as e:
            logger.error(f"WAV to MP3 conversion failed: {e}")
            # Fallback: just copy the WAV with .mp3 extension (won't work with mutagen but better than nothing)
            shutil.copy2(wav_path, mp3_path)

    def _fix_imports(self, code: str) -> str:
        # Fix any wrong import path for PrerecordedService
        code = re.sub(
            r'from\s+manim_voiceover\.services\.prerecorded_service\s+import',
            'from prerecorded_service import',
            code,
        )
        # Add sys.path if not present
        preamble = 'import sys\nsys.path.insert(0, "/media/video")\n'
        if 'sys.path' not in code:
            code = preamble + code

        # Post-process: add .scale_to_fit_width(11) only to Text() with long strings (>30 chars)
        def _maybe_add_scale(m):
            full = m.group(1)
            if 'scale_to_fit_width' in full:
                return m.group(0)
            # Extract the text content to check length
            text_match = re.search(r'Text\(["\'](.+?)["\']', full)
            if text_match and len(text_match.group(1)) > 30:
                return full + '.scale_to_fit_width(11)' + m.group(2)
            return m.group(0)

        code = re.sub(
            r'(Text\([^)]+\)(?:\.[a-z_]+\([^)]*\))*?)(\s*\n)',
            _maybe_add_scale,
            code,
        )
        return code

    def _extract_code(self, raw: str) -> str:
        match = re.search(r'```(?:python)?\s*\n(.*?)```', raw, re.DOTALL)
        if match:
            return match.group(1).strip()
        return raw.strip()

    def _extract_json(self, raw: str) -> str:
        match = re.search(r'```(?:json)?\s*\n(.*?)```', raw, re.DOTALL)
        if match:
            return match.group(1).strip()
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            return match.group(0)
        return raw.strip()

    def _cleanup(self, node_id: str, video_dir: str, sections_dir: str, num_sections: int):
        temp_files = [
            os.path.join(video_dir, f"{node_id}_scene.py"),
            os.path.join(video_dir, f"{node_id}_silent.mp4"),
            os.path.join(video_dir, f"{node_id}.ass"),
            os.path.join(video_dir, "prerecorded_service.py"),
            os.path.join(settings.MEDIA_STORAGE_PATH, "audio", f"{node_id}_full.wav"),
        ]

        for path in temp_files:
            if os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    pass
        # Remove sections directory
        if os.path.exists(sections_dir):
            shutil.rmtree(sections_dir, ignore_errors=True)
