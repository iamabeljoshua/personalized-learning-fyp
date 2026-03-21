from pydantic import BaseModel


class KnowledgeState(BaseModel):
    p_known: float
    p_learn: float
    p_guess: float
    p_slip: float


class KnowledgeTraceUpdateRequest(BaseModel):
    current_state: KnowledgeState
    is_correct: bool


class KnowledgeTraceUpdateResponse(BaseModel):
    updated_state: KnowledgeState
    needs_adaptation: bool
