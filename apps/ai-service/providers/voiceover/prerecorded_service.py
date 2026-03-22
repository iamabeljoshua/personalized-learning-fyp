"""
PrerecordedService for manim-voiceover.

A custom SpeechService that returns pre-generated audio files
instead of calling a TTS API during render. Audio files are
generated beforehand by Chatterbox TTS and placed in a shared
directory keyed by section index.

Usage in Manim scene:
    from prerecorded_service import PrerecordedService
    self.set_speech_service(PrerecordedService("/media/audio/sections/node-id"))
"""

import os
import shutil
from pathlib import Path
from manim_voiceover.services.base import SpeechService


class PrerecordedService(SpeechService):

    def __init__(self, audio_dir: str, **kwargs):
        self.audio_dir = audio_dir
        self._call_index = 0
        super().__init__(**kwargs)

    def generate_from_text(self, text: str, cache_dir: str = None, path: str = None, **kwargs) -> dict:
        src_file = os.path.join(self.audio_dir, f"sec{self._call_index}.mp3")
        self._call_index += 1

        if not os.path.exists(src_file):
            raise FileNotFoundError(f"Pre-recorded audio not found: {src_file}")

        # manim-voiceover expects original_audio as a path RELATIVE to cache_dir
        # Copy the audio file into the cache directory
        cache_path = Path(cache_dir) if cache_dir else Path(self.cache_dir)
        cache_path.mkdir(parents=True, exist_ok=True)

        dest_filename = f"prerecorded_{self._call_index - 1}.mp3"
        dest_path = cache_path / dest_filename
        shutil.copy2(src_file, dest_path)

        return {
            "input_text": text,
            "input_data": {"text": text},
            "original_audio": dest_filename,
        }
