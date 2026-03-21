from pydantic import BaseModel
from .common import StudentContext


class OutlineNode(BaseModel):
    id: str
    title: str
    type: str  # "concept" | "introduction" | "summary"
    order: int
    children: list["OutlineNode"] = []


class GenerateOutlineRequest(BaseModel):
    topic: str
    student_context: StudentContext
    rag_chunks: list[str] = []


class GenerateOutlineResponse(BaseModel):
    version: int
    nodes: list[OutlineNode]
