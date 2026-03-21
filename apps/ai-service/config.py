import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    INTERNAL_API_KEY: str = os.getenv("INTERNAL_API_KEY", "")
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama")  # "ollama" | "openai"
    LLM_MODEL: str = os.getenv("LLM_MODEL", "llama3.2")

    # Image generation (optional)
    IMAGE_PROVIDER: str = os.getenv("IMAGE_PROVIDER", "")  # "openai" | "" (disabled)
    IMAGE_API_KEY: str = os.getenv("IMAGE_API_KEY", "")
    IMAGE_MODEL: str = os.getenv("IMAGE_MODEL", "")  # e.g. "dall-e-3"
    IMAGE_BASE_URL: str = os.getenv("IMAGE_BASE_URL", "")  # custom base URL for OpenAI-compatible APIs

    # Storage
    MEDIA_STORAGE_PATH: str = os.getenv("MEDIA_STORAGE_PATH", "./media")


settings = Settings()
