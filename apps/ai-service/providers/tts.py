import os
import logging
import httpx
from config import settings

logger = logging.getLogger(__name__)


class TTSProvider:
    """Chatterbox TTS provider. Calls the Chatterbox REST API to generate speech."""

    def __init__(self):
        self.base_url = settings.TTS_URL
        self.exaggeration = settings.TTS_EXAGGERATION

    async def generate(self, text: str, node_id: str) -> str | None:
        """Generate speech audio from text.

        Args:
            text: The text to convert to speech.
            node_id: Used for the output filename.

        Returns:
            The media-relative file path, or None on failure.
        """
        try:
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    f"{self.base_url}/v1/audio/speech",
                    json={
                        "input": text[:3000],  # API max length
                        "exaggeration": self.exaggeration,
                    },
                )
                response.raise_for_status()

            filename = f"{node_id}.wav"
            filepath = os.path.join(settings.MEDIA_STORAGE_PATH, "audio", filename)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)

            with open(filepath, "wb") as f:
                f.write(response.content)

            return f"/media/audio/{filename}"
        except Exception as e:
            logger.error(f"TTS generation failed: {type(e).__name__}: {e}", exc_info=True)
            return None


def get_tts_provider() -> TTSProvider:
    return TTSProvider()
