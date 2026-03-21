from providers.llm import LLMProvider
from schemas.common import StudentContext
from schemas.assessment import AssessmentNode, GenerateAssessmentResponse, Question
from .prompts import build_system_prompt

ASSESSMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "options": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "correct_index": {"type": "integer"},
                },
                "required": ["question", "options", "correct_index"],
            },
        },
    },
    "required": ["questions"],
}


class AssessmentProcessor:
    def __init__(self, llm: LLMProvider):
        self.llm = llm

    async def generate_assessment(
        self,
        node: AssessmentNode,
        student_context: StudentContext,
    ) -> GenerateAssessmentResponse:
        system = build_system_prompt(student_context)

        prompt = "\n".join([
            f"Create 4 multiple choice questions to test understanding of: '{node.title}'.",
            "Each question should have exactly 4 options.",
            "Make questions progressively harder.",
            "Tailor the language and examples to the student's level and interests.",
        ])

        data = await self.llm.generate_structured(prompt, ASSESSMENT_SCHEMA, system)

        questions = [
            Question(
                question=q["question"],
                options=q["options"],
                correct_index=q.get("correct_index", 0),
            )
            for q in data.get("questions", [])
        ]

        return GenerateAssessmentResponse(questions=questions)
