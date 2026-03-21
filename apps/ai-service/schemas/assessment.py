from pydantic import BaseModel
from .common import StudentContext


class AssessmentNode(BaseModel):
    id: str
    title: str


class Question(BaseModel):
    question: str
    options: list[str]
    correct_index: int


class GenerateAssessmentRequest(BaseModel):
    node: AssessmentNode
    student_context: StudentContext


class GenerateAssessmentResponse(BaseModel):
    questions: list[Question]
