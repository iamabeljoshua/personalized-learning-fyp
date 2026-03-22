# full disclosure: the prompts here were refined using chatgpt and gemini to ensure the LLM calls produces a much better result.

SCENE_PLAN_PROMPT = """You are creating a structured scene plan for an animated educational video.
The video will use Manim (a math animation library) to show visual explanations while a narrator speaks.

Topic: {node_title}

Lesson content to base the video on:
{lesson_text}

Create a JSON scene plan with 4-8 sections. Each section has:
- "title": short label for the section
- "visual_description": what to show on screen using Manim (equations, shapes, diagrams, text labels)
- "narration_text": what the narrator says during this section
- "estimated_seconds": how long this section should take (10-25 seconds each)

Rules:
- The narration_text MUST reference what's shown visually: "As you can see...", "Notice how...", "Watch as..."
- CRITICAL: Spell out ALL equations as spoken words in narration_text:
  - "F = ma" → "F equals m times a"
  - "E = mc²" → "E equals m c squared"
  - Never write raw math notation in narration_text — everything must be pronounceable
- visual_description should use only: Text, equations (MathTex), circles, rectangles, arrows, lines, labels, color highlights
- Each section is independent — assume the screen is cleared between sections
- Keep max 3-4 visual elements per section
- The LAST section MUST be a summary/conclusion that wraps up the key takeaway
- Total video should be {duration}

Return ONLY valid JSON, no markdown fences or explanation:
{{"sections": [{{"title": "...", "visual_description": "...", "narration_text": "...", "estimated_seconds": 15}}, ...]}}"""


MANIM_VOICEOVER_PROMPT = """Generate a Manim Community Edition scene using manim-voiceover for narrated animation.

The scene uses VoiceoverScene with a PrerecordedService that provides pre-generated audio files.
Each `with self.voiceover(text=...)` block automatically syncs animations to the narration audio.
Use `tracker.duration` to time your animations to match the audio length.

Scene plan:
{scene_plan_formatted}

Student profile:
{student_profile}

Requirements:
- Class named `GeneratedScene` extending `VoiceoverScene`
- Imports: `from manim import *` and `from manim_voiceover import VoiceoverScene`
- First line of construct(): `self.set_speech_service(PrerecordedService("{audio_dir}"))`
- Also import: `from prerecorded_service import PrerecordedService`
- One `with self.voiceover(text="exact narration text")` block per section
- Inside each block, use `tracker.duration` to time animations:
  - Keep total animation run_time SHORT: use run_time=0.5 for each self.play() call
  - After all animations, call self.wait() with the remaining time to fill the section
  - Example: 3 animations at 0.5s each = 1.5s of animation. For a section where tracker.duration=15s, do self.wait(tracker.duration - 1.5)
- Between voiceover blocks, clear INSTANTLY: self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.2)
  Do NOT add any self.wait() between sections — the next voiceover block should start immediately.
- STRICT LAYOUT GRID (prevents collisions):
  - Title/header: .move_to(UP * 3) or .to_edge(UP)
  - Main content (equation, key visual): .move_to(UP * 0.5)
  - Labels/descriptions: use .next_to(parent_element, DOWN, buff=0.5) — NEVER position independently
  - Secondary content: .move_to(DOWN * 1.5)
  - FORBIDDEN ZONE: nothing below y=-2.5 (subtitles area)
  - EVERY Text() and MathTex() MUST have a position call — no exceptions
  - EVERY Text() and MathTex() MUST have a position call — no exceptions
  - Max 3 elements per section (excluding labels attached via .next_to())
- The LAST section must end with a summary, then FadeOut everything

Allowed Manim objects (ONLY these):
- Text, MathTex, Tex
- Circle, Square, Rectangle, Line, Arrow, Dot, Triangle
- VGroup, Group
- NumberLine, Axes
- SurroundingRectangle, Brace

Allowed animations (ONLY these):
- Write, FadeIn, FadeOut, Create, DrawBorderThenFill
- Transform, ReplacementTransform
- Indicate, Circumscribe, Flash
- self.play(), self.wait()

Do NOT use:
- SVG, images, external resources, file I/O
- ThreeDScene or 3D objects
- DashedLine or dashed objects
- Colors not in Manim (use: YELLOW, BLUE, GREEN, RED, WHITE, ORANGE, PURPLE, PINK, TEAL, GOLD)

IMPORTANT: The `text` parameter in `self.voiceover(text=...)` MUST be the EXACT narration text shown in the plan. Do not modify it.

{few_shot_example}

Return ONLY Python code, no explanations or markdown."""


FEW_SHOT_EXAMPLE = """
Example with 2 sections:

Section 1: "Introduction" — Narration: "Let's explore Newton's second law. As you can see, F equals m times a."
Section 2: "Summary" — Narration: "So remember, force equals mass times acceleration."

```python
import sys
sys.path.insert(0, "/media/video")
from manim import *
from manim_voiceover import VoiceoverScene
from prerecorded_service import PrerecordedService

class GeneratedScene(VoiceoverScene):
    def construct(self):
        self.set_speech_service(PrerecordedService("/media/audio/sections/example"))

        # --- Section 1: Introduction ---
        with self.voiceover(text="Let's explore Newton's second law. As you can see, F equals m times a.") as tracker:
            title = Text("Newton's Second Law", font_size=44, color=BLUE).move_to(UP * 3)
            self.play(Write(title), run_time=0.5)

            equation = MathTex("F", "=", "m", "\\\\times", "a", font_size=56).move_to(UP * 0.5)
            equation[0].set_color(YELLOW)
            equation[2].set_color(GREEN)
            equation[4].set_color(RED)
            self.play(Write(equation), run_time=0.5)

            f_label = Text("Force", font_size=28, color=YELLOW).next_to(equation[0], DOWN, buff=0.5)
            m_label = Text("Mass", font_size=28, color=GREEN).next_to(equation[2], DOWN, buff=0.5)
            a_label = Text("Acceleration", font_size=28, color=RED).next_to(equation[4], DOWN, buff=0.5)
            self.play(FadeIn(f_label), FadeIn(m_label), FadeIn(a_label), run_time=0.5)

            self.wait(tracker.duration - 1.5)  # 3 animations * 0.5s = 1.5s used

        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.2)  # Instant clear

        # --- Section 2: Summary ---
        with self.voiceover(text="So remember, force equals mass times acceleration.") as tracker:
            summary = Text("F = ma links force, mass,\\nand acceleration", font_size=36, color=WHITE).move_to(UP * 0.5)
            self.play(Write(summary), run_time=0.5)
            self.play(Circumscribe(summary, color=YELLOW), run_time=0.5)

            self.wait(tracker.duration - 1.0)  # 2 animations * 0.5s = 1.0s used

        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.2)
        self.wait(1)
```
"""


# This is a fallback template for generating a very simple video in case the LLM call fails (Ollama is poor with generating manim code)
# If a cloud model is configured, you will get really nice and creative video outputs.
SAFE_FALLBACK_TEMPLATE = '''import sys
sys.path.insert(0, "/media/video")
from manim import *
from manim_voiceover import VoiceoverScene
from prerecorded_service import PrerecordedService

class GeneratedScene(VoiceoverScene):
    def construct(self):
        self.set_speech_service(PrerecordedService("{audio_dir}"))

        with self.voiceover(text="{narration}") as tracker:
            title = Text("{node_title}", font_size=40, color=BLUE).move_to(ORIGIN)
            self.play(Write(title), run_time=tracker.duration * 0.3)
            self.wait(tracker.duration * 0.7)

        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.3)
        self.wait(1)
'''
