import os
import uuid
import openai
from config import settings
import httpx


class ImageProvider:
    """OpenAI-compatible image generation. Works with DALL-E, Nano Banana, and any provider
    that exposes the OpenAI images API."""

    def __init__(self):
        self.enabled = bool(settings.IMAGE_API_KEY and settings.IMAGE_PROVIDER)
        if self.enabled:
            kwargs = {"api_key": settings.IMAGE_API_KEY}
            if settings.IMAGE_BASE_URL:
                kwargs["base_url"] = settings.IMAGE_BASE_URL
            self.client = openai.AsyncOpenAI(**kwargs)
            self.model = settings.IMAGE_MODEL or "dall-e-3"

    async def generate(self, description: str) -> str | None:
        """Generate an image from a description. Returns the file path or None if disabled/failed."""
        if not self.enabled:
            return None

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

            # Download and save locally
            async with httpx.AsyncClient() as client:
                img_response = await client.get(image_url)
                img_response.raise_for_status()

            filename = f"{uuid.uuid4()}.png"
            filepath = os.path.join(settings.MEDIA_STORAGE_PATH, "images", filename)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)

            with open(filepath, "wb") as f:
                f.write(img_response.content)

            return f"/media/images/{filename}"
        except Exception:
            return None


def get_image_provider() -> ImageProvider:
    return ImageProvider()
