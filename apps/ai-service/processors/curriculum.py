import uuid
from providers.llm import LLMProvider
from schemas.common import StudentContext
from schemas.outline import GenerateOutlineResponse, OutlineNode
from .prompts import build_system_prompt

OUTLINE_SCHEMA = {
    "type": "object",
    "properties": {
        "nodes": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "type": {
                        "type": "string",
                        "enum": ["introduction", "concept", "summary"],
                    },
                },
                "required": ["title", "type"],
            },
        },
    },
    "required": ["nodes"],
}


class CurriculumProcessor:
    def __init__(self, llm: LLMProvider):
        self.llm = llm

    async def generate_outline(
        self,
        topic: str,
        student_context: StudentContext,
        rag_chunks: list[str] | None = None,
    ) -> GenerateOutlineResponse:
        system = build_system_prompt(student_context)

        prompt_parts = [
            f"Create a structured learning outline for the topic: '{topic}'.",
            "The outline should be a sequence of nodes that build on each other.",
            "Include 5-10 nodes that progressively build understanding.",
            "Types: 'introduction' for the first node, 'concept' for teaching nodes, 'summary' for the final node.",
        ]

        if rag_chunks:
            prompt_parts.append(
                "Ground the outline in the following source material:\n\n"
                + "\n---\n".join(rag_chunks)
            )

        prompt = "\n".join(prompt_parts)
        data = await self.llm.generate_structured(prompt, OUTLINE_SCHEMA, system)

        nodes = [
            OutlineNode(
                id=str(uuid.uuid4()),
                title=node.get("title", f"Node {i + 1}"),
                type=node.get("type", "concept"),
                order=i + 1,
            )
            for i, node in enumerate(data.get("nodes", []))
        ]

        return GenerateOutlineResponse(version=1, nodes=nodes)
