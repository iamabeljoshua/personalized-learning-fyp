import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    INTERNAL_API_KEY: str = os.getenv("INTERNAL_API_KEY", "")
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "llama3.2")

    # Image generation (optional, provide this to have the text content enriched with generated visual imagery)
    IMAGE_PROVIDER: str = os.getenv("IMAGE_PROVIDER", "")
    IMAGE_API_KEY: str = os.getenv("IMAGE_API_KEY", "")
    IMAGE_MODEL: str = os.getenv("IMAGE_MODEL", "")
    IMAGE_BASE_URL: str = os.getenv("IMAGE_BASE_URL", "")

    # TTS (Chatterbox running natively)
    TTS_URL: str = os.getenv("TTS_URL", "http://localhost:8004")

    # Video LLM (this is what generates the manim code for video rendering, ollama performs poorly for this, so a cloud model is better for good video quality)
    VIDEO_LLM_BASE_URL: str = os.getenv("VIDEO_LLM_BASE_URL", "http://localhost:11434/v1")
    VIDEO_LLM_API_KEY: str = os.getenv("VIDEO_LLM_API_KEY", "ollama")
    VIDEO_LLM_MODEL: str = os.getenv("VIDEO_LLM_MODEL", "llama3.2")

    # Manim
    MANIM_CONTAINER_NAME: str = os.getenv("MANIM_CONTAINER_NAME", "manim")

    # Storage (a local file path for file storage, this does not use a cloud storage)
    MEDIA_STORAGE_PATH: str = os.getenv("MEDIA_STORAGE_PATH", "./media")


settings = Settings()
