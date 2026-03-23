import os
import uuid
import base64
import logging
import openai
import httpx
from config import settings

logger = logging.getLogger(__name__)


class ImageProvider:
    def __init__(self):
        self.enabled = bool(settings.IMAGE_API_KEY and settings.IMAGE_PROVIDER)
        self.provider = settings.IMAGE_PROVIDER

        if self.enabled and self.provider == "openai":
            kwargs = {"api_key": settings.IMAGE_API_KEY}
            if settings.IMAGE_BASE_URL:
                kwargs["base_url"] = settings.IMAGE_BASE_URL
            self.client = openai.AsyncOpenAI(**kwargs)
            self.model = settings.IMAGE_MODEL or "dall-e-3"

    async def generate(self, description: str) -> str | None:
        if not self.enabled:
            return None

        if self.provider == "google":
            return await self._generate_google(description)
        else:
            return await self._generate_openai(description)

    async def _generate_google(self, description: str) -> str | None:
        try:
            model = settings.IMAGE_MODEL or "imagen-3.0-generate-002"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:predict"

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    url,
                    headers={"x-goog-api-key": settings.IMAGE_API_KEY},
                    json={
                        "instances": [{"prompt": description}],
                        "parameters": {"sampleCount": 1},
                    },
                )
                response.raise_for_status()
                data = response.json()

            # Extract base64 image from predictions
            predictions = data.get("predictions") or []
            if not predictions:
                logger.warning("Google Imagen returned no predictions")
                return None

            image_bytes_b64 = predictions[0].get("bytesBase64Encoded")
            if not image_bytes_b64:
                logger.warning("Google Imagen response missing bytesBase64Encoded")
                return None

            image_data = base64.b64decode(image_bytes_b64)

            filename = f"{uuid.uuid4()}.png"
            filepath = os.path.join(settings.MEDIA_STORAGE_PATH, "images", filename)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)

            with open(filepath, "wb") as f:
                f.write(image_data)

            logger.info(f"Image saved: {filepath} ({len(image_data)} bytes)")
            return f"/media/images/{filename}"

        except Exception as e:
            logger.error(f"Google Imagen generation failed: {e}")
            return None

    async def _generate_openai(self, description: str) -> str | None:
        try:
            response = await self.client.images.generate(
                model=self.model,
                prompt=description,
                n=1,
                size="1024x1024",
            )
            image_url = response.data[0].url
            if not image_url:
                return None

            async with httpx.AsyncClient() as client:
                img_response = await client.get(image_url)
                img_response.raise_for_status()

            filename = f"{uuid.uuid4()}.png"
            filepath = os.path.join(settings.MEDIA_STORAGE_PATH, "images", filename)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)

            with open(filepath, "wb") as f:
                f.write(img_response.content)

            logger.info(f"Image saved: {filepath} ({len(img_response.content)} bytes)")
            return f"/media/images/{filename}"

        except Exception as e:
            logger.error(f"OpenAI image generation failed: {e}")
            return None


def get_image_provider() -> ImageProvider:
    return ImageProvider()
