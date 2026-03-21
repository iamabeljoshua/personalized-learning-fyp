import re
from providers.llm import LLMProvider
from providers.image import ImageProvider
from schemas.common import StudentContext
from schemas.content import ContentNode, GenerateTextResponse
from .prompts import build_system_prompt


class ContentProcessor:
    def __init__(self, llm: LLMProvider, image_provider: ImageProvider):
        self.llm = llm
        self.image_provider = image_provider

    async def generate_content(
        self,
        node: ContentNode,
        student_context: StudentContext,
        outline_context: list[str] | None = None,
        rag_chunks: list[str] | None = None,
    ) -> GenerateTextResponse:
        system = build_system_prompt(student_context)

        prompt_parts = [
            f"Write a detailed lesson for the concept: '{node.title}'.",
            "Write in a conversational, engaging tone using markdown formatting.",
            "Structure the lesson with clear headers (##), bullet points, and bold key terms.",
            "Use analogies from the student's interests to explain concepts.",
            "",
            "Where a visual diagram or image would help understanding, insert a marker like:",
            "[IMAGE: description of what the image should show]",
            "",
            "Include:",
            "- An introduction connecting to prior knowledge",
            "- Core explanation with examples and analogies",
            "- 2-3 image markers where visuals would help",
            "- A 'Key Takeaways' section at the end",
        ]

        if outline_context:
            prompt_parts.append(
                f"\nThis lesson follows these previous topics: {', '.join(outline_context)}. "
                "Build on what the student has already learned."
            )

        if rag_chunks:
            prompt_parts.append(
                "\nUse the following source material as ground truth:\n\n"
                + "\n---\n".join(rag_chunks)
            )

        prompt = "\n".join(prompt_parts)
        text = await self.llm.generate(prompt, system)

        # Process image markers if image provider is enabled
        text = await self._process_images(text)

        return GenerateTextResponse(text=text)

    async def _process_images(self, text: str) -> str:
        """Replace [IMAGE: description] markers with actual images or formatted placeholders."""
        pattern = r'\[IMAGE:\s*(.+?)\]'
        markers = re.findall(pattern, text)

        for description in markers:
            image_url = await self.image_provider.generate(description)
            if image_url:
                replacement = f"![{description}]({image_url})"
            else:
                replacement = f"\n> *Diagram: {description}*\n"
            text = text.replace(f"[IMAGE: {description}]", replacement, 1)

        return text
