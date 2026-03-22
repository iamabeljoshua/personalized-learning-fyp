import os
import logging
import httpx
from config import settings

logger = logging.getLogger(__name__)


# calls the offline chatterbox tts to generate the audio from text (tts)
class TTSProvider:
    def __init__(self):
        self.base_url = settings.TTS_URL

    async def generate(self, text: str, node_id: str) -> str | None:
        try:
            async with httpx.AsyncClient(timeout=600.0) as client:
                response = await client.post(
                    f"{self.base_url}/tts",
                    json={
                        "text": text,
                        "voice_mode": "predefined",
                        "predefined_voice_id": "travisvn-default.mp3",
                        "split_text": True,
                        "chunk_size": 250,
                        "output_format": "wav",
                    },
                )
                response.raise_for_status()

            filename = f"{node_id}.wav"
            filepath = os.path.join(settings.MEDIA_STORAGE_PATH, "audio", filename)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)

            with open(filepath, "wb") as f:
                f.write(response.content)

            logger.info(f"Audio saved: {filepath} ({len(response.content)} bytes)")
            return f"/media/audio/{filename}"
        except Exception as e:
            logger.error(f"TTS generation failed: {type(e).__name__}: {e}")
            return None


def get_tts_provider() -> TTSProvider:
    return TTSProvider()
