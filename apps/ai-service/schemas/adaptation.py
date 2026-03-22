from pydantic import BaseModel
from .common import StudentContext


class OutlineNodeInfo(BaseModel):
    id: str
    title: str
    type: str
    order: int


class KTStateInfo(BaseModel):
    node_id: str
    p_known: float


class AdaptRequest(BaseModel):
    failing_node_id: str
    failing_node_title: str
    failing_p_known: float
    outline_nodes: list[OutlineNodeInfo]
    student_context: StudentContext
    kt_states: list[KTStateInfo]


class NewNode(BaseModel):
    title: str
    type: str = "concept"


class AdaptResponse(BaseModel):
    action: str  # "none" | "insert"
    new_nodes: list[NewNode] | None = None
