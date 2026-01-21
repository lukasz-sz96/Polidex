from dataclasses import dataclass

from app.config import settings


@dataclass
class TextChunk:
    content: str
    start_char: int
    end_char: int
    index: int


class TextChunker:
    def __init__(
        self,
        chunk_size: int = settings.chunk_size,
        chunk_overlap: int = settings.chunk_overlap,
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk(self, text: str) -> list[TextChunk]:
        if not text or not text.strip():
            return []

        text = text.strip()
        chunks = []
        start = 0
        index = 0

        while start < len(text):
            end = start + self.chunk_size

            if end < len(text):
                break_point = self._find_break_point(text, start, end)
                if break_point > start:
                    end = break_point

            chunk_text = text[start:end].strip()
            if chunk_text:
                chunks.append(TextChunk(
                    content=chunk_text,
                    start_char=start,
                    end_char=end,
                    index=index,
                ))
                index += 1

            if end >= len(text):
                break

            start = end - self.chunk_overlap
            if start < 0:
                start = 0

        return chunks

    def _find_break_point(self, text: str, start: int, end: int) -> int:
        search_start = max(start, end - 200)
        search_text = text[search_start:end]

        for sep in ["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " "]:
            pos = search_text.rfind(sep)
            if pos != -1:
                return search_start + pos + len(sep)

        return end


text_chunker = TextChunker()
