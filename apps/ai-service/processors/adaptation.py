import logging
from providers.llm import LLMProvider
from schemas.adaptation import AdaptRequest, AdaptResponse, NewNode
from .prompts import build_system_prompt
from .curriculum import OUTLINE_SCHEMA

logger = logging.getLogger(__name__)

ASSESS_PROMPT = """A student is struggling with the concept: "{failing_title}" (knowledge score: {p_known:.0%}).

Here is the current learning outline:
{outline_summary}

Here are the student's knowledge scores per node:
{kt_summary}

The nodes AFTER the failing node are:
{forward_nodes}

Question: Do the remaining forward nodes already provide enough reinforcement for the failing concept "{failing_title}"?
- If the forward nodes cover the same ideas from different angles, reply: SUFFICIENT
- If there is a gap and the student needs additional material to understand "{failing_title}", reply: NEEDS_REINFORCEMENT

Reply with ONLY one word: SUFFICIENT or NEEDS_REINFORCEMENT"""


GENERATE_PROMPT = """A student is struggling with: "{failing_title}" (knowledge score: {p_known:.0%}).

Current outline:
{outline_summary}

Generate 1-3 SHORT supplementary lesson nodes to reinforce this concept.
These nodes will be inserted RIGHT AFTER "{failing_title}" in the outline.

Rules:
- Each node should approach the failing concept from a different angle (examples, analogies, practice)
- Use the student's interests and preferred explanation style to make nodes relatable and engaging
- Do NOT duplicate content already covered by existing nodes: {forward_titles}
- Each node type should be "concept"
- Keep titles concise and specific

{feedback}"""


VERIFY_PROMPT = """Review these proposed supplementary nodes in context of the full outline.

Full outline:
{outline_summary}

New nodes to insert after "{failing_title}":
{new_node_titles}

Are these new nodes:
1. Coherent with the rest of the outline?
2. Non-duplicative of existing forward nodes?
3. Focused on reinforcing the failing concept?

Reply YES or NO followed by a brief reason."""


class AdaptationProcessor:
    def __init__(self, llm: LLMProvider):
        self.llm = llm

    async def adapt(self, request: AdaptRequest) -> AdaptResponse:
        system = build_system_prompt(request.student_context)

        outline_summary = "\n".join(
            f"  {n.order}. [{n.type}] {n.title}" for n in request.outline_nodes
        )

        failing_node = next(
            (n for n in request.outline_nodes if n.id == request.failing_node_id), None
        )
        if not failing_node:
            logger.error(f"Failing node {request.failing_node_id} not found in outline")
            return AdaptResponse(action="none")

        forward_nodes = [n for n in request.outline_nodes if n.order > failing_node.order]
        forward_summary = "\n".join(
            f"  {n.order}. [{n.type}] {n.title}" for n in forward_nodes
        ) or "  (none — this is the last node)"

        kt_summary = "\n".join(
            f"  {kt.node_id[:8]}... p_known={kt.p_known:.2f}" for kt in request.kt_states
        )

        # call llm to determin if outline adaptation is truly needed
        logger.info(f"Assessing adaptation need for '{request.failing_node_title}'...")
        assessment = await self._assess(
            system, request.failing_node_title, request.failing_p_known,
            outline_summary, kt_summary, forward_summary,
        )

        if assessment == "SUFFICIENT":
            logger.info("Assessment: existing outline is sufficient, no adaptation needed")
            return AdaptResponse(action="none")

        logger.info("Assessment: reinforcement needed, generating new nodes...")

        # generate new nodes to reinforce the concept, ensuring student understand it
        forward_titles = ", ".join(f'"{n.title}"' for n in forward_nodes) or "none"
        new_nodes = await self._generate(
            system, request.failing_node_title, request.failing_p_known,
            outline_summary, forward_titles,
        )

        if not new_nodes:
            logger.warning("Node generation returned empty, skipping adaptation")
            return AdaptResponse(action="none")

        # verity (not more than two calls) if the new nodes are good enough
        for attempt in range(2):
            is_good = await self._verify(
                system, request.failing_node_title, outline_summary, new_nodes
            )
            if is_good:
                break
            logger.info(f"Verify failed on attempt {attempt + 1}, regenerating...")
            new_nodes = await self._generate(
                system, request.failing_node_title, request.failing_p_known,
                outline_summary, forward_titles,
                feedback="The previous nodes were not coherent or duplicated existing content. Try again.",
            )

        logger.info(f"Adaptation complete: inserting {len(new_nodes)} new nodes")
        return AdaptResponse(action="insert", new_nodes=new_nodes)

    async def _assess(
        self, system: str, failing_title: str, p_known: float,
        outline_summary: str, kt_summary: str, forward_nodes: str,
    ) -> str:
        prompt = ASSESS_PROMPT.format(
            failing_title=failing_title,
            p_known=p_known,
            outline_summary=outline_summary,
            kt_summary=kt_summary,
            forward_nodes=forward_nodes,
        )
        response = await self.llm.generate(prompt, system)
        return "SUFFICIENT" if "SUFFICIENT" in response.upper() else "NEEDS_REINFORCEMENT"

    async def _generate(
        self, system: str, failing_title: str, p_known: float,
        outline_summary: str, forward_titles: str, feedback: str = "",
    ) -> list[NewNode]:
        prompt = GENERATE_PROMPT.format(
            failing_title=failing_title,
            p_known=p_known,
            outline_summary=outline_summary,
            forward_titles=forward_titles,
            feedback=feedback,
        )
        try:
            data = await self.llm.generate_structured(prompt, OUTLINE_SCHEMA, system)
            return [NewNode(title=item["title"], type=item.get("type", "concept")) for item in data.get("nodes", []) if "title" in item][:3]
        except Exception as e:
            logger.error(f"Node generation failed: {e}")
        return []

    async def _verify(
        self, system: str, failing_title: str,
        outline_summary: str, new_nodes: list[NewNode],
    ) -> bool:
        new_titles = "\n".join(f"  - {n.title}" for n in new_nodes)
        prompt = VERIFY_PROMPT.format(
            outline_summary=outline_summary,
            failing_title=failing_title,
            new_node_titles=new_titles,
        )
        response = await self.llm.generate(prompt, system)
        return response.strip().upper().startswith("YES")
