import re
import logging
from providers.llm import LLMProvider
from providers.tts import TTSProvider
from schemas.content import GenerateAudioRequest, GenerateAudioResponse

logger = logging.getLogger(__name__)


class AudioProcessor:
    def __init__(self, llm: LLMProvider, tts: TTSProvider):
        self.llm = llm
        self.tts = tts

    async def generate_audio(self, request: GenerateAudioRequest) -> GenerateAudioResponse:
        try:
            # Step 1: Rewrite lesson text as a spoken script
            logger.info("Generating spoken script from lesson text...")
            script = await self._generate_script(request.text)
            logger.info(f"Script generated: {len(script)} chars")

            # Step 2: Generate audio from the script
            logger.info("Generating audio from script...")
            audio_url = await self.tts.generate(script, request.node_id)
            logger.info(f"Audio result: {audio_url}")

            return GenerateAudioResponse(audio_url=audio_url)
        except Exception as e:
            logger.error(f"Audio generation failed: {e}", exc_info=True)
            return GenerateAudioResponse(audio_url=None)

    async def _generate_script(self, lesson_text: str) -> str:
        clean_text = self._strip_markdown(lesson_text)

        prompt = "\n".join([
            "Rewrite the following lesson as a natural spoken explanation.",
            "Write as if you are a friendly tutor talking directly to the student.",
            "Use conversational transitions like 'Now, let us think about...', 'Here is the interesting part...'",
            "Keep it concise - aim for 2-3 minutes of speaking time.",
            "Do NOT include any markdown, headers, bullet points, or formatting.",
            "Just write natural flowing speech.",
            "",
            "Lesson text:",
            clean_text,
        ])

        return await self.llm.generate(prompt)

    def _strip_markdown(self, text: str) -> str:
        text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
        text = re.sub(r'\*{1,3}(.+?)\*{1,3}', r'\1', text)
        text = re.sub(r'!\[.*?\]\(.*?\)', '', text)
        text = re.sub(r'>\s*\*Diagram:.*?\*', '', text)
        text = re.sub(r'^[-=]{3,}$', '', text, flags=re.MULTILINE)
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()
