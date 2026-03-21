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
    IMAGE_MODEL: str = os.getenv("IMAGE_MODEL", "")
    IMAGE_BASE_URL: str = os.getenv("IMAGE_BASE_URL", "")

    # TTS
    TTS_URL: str = os.getenv("TTS_URL", "http://localhost:4123")
    TTS_EXAGGERATION: float = float(os.getenv("TTS_EXAGGERATION", "0.5"))

    # Storage
    MEDIA_STORAGE_PATH: str = os.getenv("MEDIA_STORAGE_PATH", "./media")


settings = Settings()
