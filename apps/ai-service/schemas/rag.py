from pydantic import BaseModel


class EmbedDocumentRequest(BaseModel):
    file_path: str


class EmbedDocumentResponse(BaseModel):
    chunks: list[str]
    embeddings: list[list[float]]


class EmbedTextRequest(BaseModel):
    text: str


class EmbedTextResponse(BaseModel):
    embedding: list[float]
