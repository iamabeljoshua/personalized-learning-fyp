import os
import logging
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter
from schemas.rag import EmbedDocumentResponse, EmbedTextResponse

logger = logging.getLogger(__name__)

# Lazy singleton for the embedding model
_embed_model = None


def _get_embed_model() -> SentenceTransformer:
    global _embed_model
    if _embed_model is None:
        logger.info("Loading sentence-transformers model (all-MiniLM-L6-v2)...")
        _embed_model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Embedding model loaded.")
    return _embed_model


class RAGProcessor:
    def __init__(self):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def embed_document(self, file_path: str) -> EmbedDocumentResponse:
        """Read a document, chunk it, and embed each chunk."""
        text = self._read_file(file_path)
        if not text.strip():
            logger.warning(f"Empty document: {file_path}")
            return EmbedDocumentResponse(chunks=[], embeddings=[])

        chunks = self.splitter.split_text(text)
        logger.info(f"Document chunked into {len(chunks)} pieces")

        model = _get_embed_model()
        embeddings = model.encode(chunks).tolist()

        return EmbedDocumentResponse(chunks=chunks, embeddings=embeddings)

    def embed_text(self, text: str) -> EmbedTextResponse:
        """Embed a single text string (for query vectors)."""
        model = _get_embed_model()
        embedding = model.encode(text).tolist()
        return EmbedTextResponse(embedding=embedding)

    def _read_file(self, file_path: str) -> str:
        """Read text from PDF, TXT, or MD files."""
        ext = os.path.splitext(file_path)[1].lower()

        if ext == ".pdf":
            return self._read_pdf(file_path)
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()

    def _read_pdf(self, file_path: str) -> str:
        """Extract text from a PDF file."""
        try:
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            pages = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    pages.append(text)
            return "\n\n".join(pages)
        except Exception as e:
            logger.error(f"PDF reading failed: {e}")
            return ""
