"""
AI Provider Resolver — selects the best available AI provider given user keys.

Priority for chat completions:
  1. openai_api_key  → OpenAI API directly (GPT-4)
  2. openrouter_api_key → OpenRouter (GPT-4 / Claude / any model via openrouter_model setting)
  3. claude_api_key  → Anthropic API directly (Claude)
  4. env OPENAI_API_KEY fallback

Whisper transcription, DALL-E images, and TTS are OpenAI-only.
"""

import os
from typing import Optional


class ChatProvider:
    """Unified interface for chat completions across providers."""

    provider: str = "base"

    def complete(
        self,
        system: str,
        user: str,
        max_tokens: int = 1200,
        temperature: float = 0.3,
    ) -> str:
        raise NotImplementedError


class OpenAIChatProvider(ChatProvider):
    provider = "openai"

    def __init__(self, api_key: str, model: str = "gpt-4") -> None:
        import openai
        self.client = openai.OpenAI(api_key=api_key)
        self.model = model

    def complete(self, system: str, user: str, max_tokens: int = 1200, temperature: float = 0.3) -> str:
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return resp.choices[0].message.content.strip()


class OpenRouterChatProvider(ChatProvider):
    provider = "openrouter"

    def __init__(self, api_key: str, model: str) -> None:
        import openai
        self.client = openai.OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
        )
        self.model = model

    def complete(self, system: str, user: str, max_tokens: int = 1200, temperature: float = 0.3) -> str:
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return resp.choices[0].message.content.strip()


class ClaudeChatProvider(ChatProvider):
    provider = "claude"

    def __init__(self, api_key: str, model: str = "claude-3-5-haiku-latest") -> None:
        import anthropic
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model

    def complete(self, system: str, user: str, max_tokens: int = 1200, temperature: float = 0.3) -> str:
        resp = self.client.messages.create(
            model=self.model,
            system=system,
            messages=[{"role": "user", "content": user}],
            max_tokens=max_tokens,
            temperature=float(temperature),
        )
        return resp.content[0].text.strip()


def resolve_chat_provider(
    openai_key: Optional[str] = None,
    openrouter_key: Optional[str] = None,
    claude_key: Optional[str] = None,
    openrouter_model: Optional[str] = None,
) -> Optional[ChatProvider]:
    """
    Return the best available ChatProvider given the supplied keys.

    Falls back to env var OPENAI_API_KEY if no user key is provided.
    Returns None only if no key is available at all.
    """
    from app.utils.config import get_settings

    settings = get_settings()
    model = openrouter_model or settings.openrouter_model or "openai/gpt-4"

    if openai_key:
        return OpenAIChatProvider(api_key=openai_key, model="gpt-4")

    if openrouter_key:
        return OpenRouterChatProvider(api_key=openrouter_key, model=model)

    if claude_key:
        return ClaudeChatProvider(api_key=claude_key)

    env_key = os.getenv("OPENAI_API_KEY")
    if env_key:
        return OpenAIChatProvider(api_key=env_key, model="gpt-4")

    return None
