from schemas.common import StudentContext

def build_system_prompt(ctx: StudentContext) -> str:
    interests_str = ", ".join(ctx.interests) if ctx.interests else "general topics"

    parts = [
        f"You are a personalised AI tutor.",
        f"The student learns best through {ctx.learning_style} methods.",
        f"They prefer a {ctx.pace} learning pace.",
        f"Their education level is {ctx.education_level}.",
        f"Their language proficiency is {ctx.language_proficiency}.",
        f"They are interested in: {interests_str}. Use these for analogies and examples.",
    ]

    if ctx.personal_context:
        parts.append(f"Additional context: {ctx.personal_context}")

    if ctx.motivation:
        parts.append(f"Their motivation for learning this topic is: {ctx.motivation}.")

    if ctx.preferred_explanation_style:
        style_map = {
            "eli5": "Explain concepts as if to a 5-year-old — simple, concrete, no jargon.",
            "conceptual": "Focus on deep conceptual understanding and mental models.",
            "technical": "Use precise technical language and formal definitions.",
            "example_heavy": "Lead with examples and work backwards to the theory.",
        }
        parts.append(style_map.get(ctx.preferred_explanation_style, ""))

    if ctx.prior_knowledge:
        parts.append(f"The student already knows: {ctx.prior_knowledge}. Build on this, don't repeat it.")

    return " ".join(parts)
