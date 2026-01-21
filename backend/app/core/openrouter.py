from dataclasses import dataclass

import httpx

from app.config import settings


@dataclass
class ChatMessage:
    role: str
    content: str


@dataclass
class ChatResponse:
    content: str
    model: str
    usage: dict


class OpenRouterClient:
    BASE_URL = "https://openrouter.ai/api/v1"

    def __init__(
        self,
        api_key: str = settings.openrouter_api_key,
        default_model: str = settings.default_llm_model,
    ):
        self.api_key = api_key
        self.default_model = default_model

    async def chat(
        self,
        messages: list[ChatMessage],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> ChatResponse:
        model = model or self.default_model

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://polidex.app",
                    "X-Title": "Polidex RAG",
                },
                json={
                    "model": model,
                    "messages": [{"role": m.role, "content": m.content} for m in messages],
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                timeout=60.0,
            )
            response.raise_for_status()
            data = response.json()

        return ChatResponse(
            content=data["choices"][0]["message"]["content"],
            model=data.get("model", model),
            usage=data.get("usage", {}),
        )

    async def generate_rag_response(
        self,
        query: str,
        context_chunks: list[str],
        model: str | None = None,
    ) -> ChatResponse:
        context = "\n\n---\n\n".join(context_chunks)

        system_prompt = """You are a helpful assistant that answers questions based on the provided context.
Use only the information from the context to answer. If the context doesn't contain enough information to answer the question, say so.
Be concise and accurate in your responses."""

        user_prompt = f"""Context:
{context}

Question: {query}

Answer based on the context above:"""

        messages = [
            ChatMessage(role="system", content=system_prompt),
            ChatMessage(role="user", content=user_prompt),
        ]

        return await self.chat(messages, model=model)


openrouter_client = OpenRouterClient()
