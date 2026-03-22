import json
from abc import ABC, abstractmethod
from typing import Any
import httpx
from config import settings


class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, system: str = "") -> str:
        pass

    @abstractmethod
    async def generate_structured(self, prompt: str, schema: dict[str, Any], system: str = "") -> dict:
        pass


class OllamaProvider(LLMProvider):
    def __init__(self):
        self.base_url = settings.OLLAMA_URL
        self.model = settings.LLM_MODEL

    async def generate(self, prompt: str, system: str = "") -> str:
        return await self._chat(prompt, system)

    async def generate_structured(self, prompt: str, schema: dict[str, Any], system: str = "") -> dict:
        raw = await self._chat(prompt, system, format_schema=schema)
        return json.loads(raw)

    async def _chat(self, prompt: str, system: str = "", format_schema: dict | None = None) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        body: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "stream": False,
        }
        if format_schema:
            body["format"] = format_schema

        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json=body,
            )
            response.raise_for_status()
            return response.json()["message"]["content"]


class VideoLLMProvider:
    """OpenAI-compatible LLM client for video generation.
    Works with any provider: OpenAI, Groq, Together, local Ollama /v1, etc.
    Configured via VIDEO_LLM_BASE_URL, VIDEO_LLM_API_KEY, VIDEO_LLM_MODEL."""

    def __init__(self):
        self.base_url = settings.VIDEO_LLM_BASE_URL.rstrip("/")
        self.api_key = settings.VIDEO_LLM_API_KEY
        self.model = settings.VIDEO_LLM_MODEL

    async def generate(self, prompt: str, system: str = "") -> str:
        return await self._call(prompt, system)

    async def generate_json(self, prompt: str, system: str = "") -> dict:
        """Generate a JSON response. Works with Ollama /v1, Gemini, OpenAI, Groq, etc."""
        raw = await self._call(prompt, system, json_mode=True)
        return json.loads(raw)

    async def _call(self, prompt: str, system: str = "", json_mode: bool = False) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        body: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
        }
        if json_mode:
            body["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=body,
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]


def get_llm_provider() -> LLMProvider:
    return OllamaProvider()


def get_video_llm_provider() -> VideoLLMProvider:
    return VideoLLMProvider()
