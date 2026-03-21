import json
from abc import ABC, abstractmethod
from typing import Any
import httpx
import openai
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


class OpenAIProvider(LLMProvider):
    def __init__(self):
        self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.LLM_MODEL if settings.LLM_PROVIDER == "openai" else "gpt-4o-mini"

    async def generate(self, prompt: str, system: str = "") -> str:
        messages = self._build_messages(prompt, system)
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
        )
        return response.choices[0].message.content or ""

    async def generate_structured(self, prompt: str, schema: dict[str, Any], system: str = "") -> dict:
        messages = self._build_messages(prompt, system)
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "structured_output",
                    "schema": schema,
                    "strict": True,
                },
            },
        )
        return json.loads(response.choices[0].message.content or "{}")

    def _build_messages(self, prompt: str, system: str = ""):
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        return messages


def get_llm_provider() -> LLMProvider:
    if settings.LLM_PROVIDER == "openai":
        return OpenAIProvider()
    return OllamaProvider()
