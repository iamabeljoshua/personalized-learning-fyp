from pydantic import BaseModel


class StudentContext(BaseModel):
    learning_style: str
    pace: str
    education_level: str
    language_proficiency: str
    interests: list[str]
    personal_context: str | None = None
    # goal-level fields
    motivation: str | None = None
    preferred_explanation_style: str | None = None
    prior_knowledge: str | None = None
