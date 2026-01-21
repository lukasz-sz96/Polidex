import hashlib
from pathlib import Path

import fitz
from docx import Document as DocxDocument


class DocumentProcessor:
    SUPPORTED_TYPES = {".pdf", ".docx", ".txt", ".md"}

    def extract_text(self, file_path: Path) -> str:
        suffix = file_path.suffix.lower()

        if suffix == ".pdf":
            return self._extract_pdf(file_path)
        elif suffix == ".docx":
            return self._extract_docx(file_path)
        elif suffix in {".txt", ".md"}:
            return self._extract_text_file(file_path)
        else:
            raise ValueError(f"Unsupported file type: {suffix}")

    def _extract_pdf(self, file_path: Path) -> str:
        text_parts = []
        with fitz.open(file_path) as doc:
            for page in doc:
                text_parts.append(page.get_text())
        return "\n".join(text_parts)

    def _extract_docx(self, file_path: Path) -> str:
        doc = DocxDocument(file_path)
        paragraphs = [para.text for para in doc.paragraphs]
        return "\n".join(paragraphs)

    def _extract_text_file(self, file_path: Path) -> str:
        return file_path.read_text(encoding="utf-8")

    def compute_hash(self, content: bytes) -> str:
        return hashlib.sha256(content).hexdigest()

    def get_file_type(self, filename: str) -> str:
        suffix = Path(filename).suffix.lower()
        type_map = {
            ".pdf": "application/pdf",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".txt": "text/plain",
            ".md": "text/markdown",
        }
        return type_map.get(suffix, "application/octet-stream")

    def is_supported(self, filename: str) -> bool:
        return Path(filename).suffix.lower() in self.SUPPORTED_TYPES


document_processor = DocumentProcessor()
