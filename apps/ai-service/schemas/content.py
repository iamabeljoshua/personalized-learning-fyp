from pydantic import BaseModel
from .common import StudentContext


class ContentNode(BaseModel):
    id: str
    title: str
    type: str


# Text generation
class GenerateTextRequest(BaseModel):
    node: ContentNode
    outline_context: list[str] = []
    student_context: StudentContext
    rag_chunks: list[str] = []


class GenerateTextResponse(BaseModel):
    text: str


# Audio generation
class GenerateAudioRequest(BaseModel):
    text: str
    node_id: str


class GenerateAudioResponse(BaseModel):
    audio_url: str | None = None


# Video generation
class GenerateVideoRequest(BaseModel):
    node_title: str
    full_text: str
    node_id: str
    student_context: StudentContext


class GenerateVideoResponse(BaseModel):
    video_url: str | None = None


# Scene plan (internal use for video pipeline)
class SceneSection(BaseModel):
    title: str
    visual_description: str
    narration_text: str
    estimated_seconds: int = 15
    actual_duration: float | None = None  # filled after TTS

    # LLMs sometimes use alternate key names — normalize them
    def __init__(self, **data):
        # accept "narration" as an alias for "narration_text"
        if "narration_text" not in data and "narration" in data:
            data["narration_text"] = data.pop("narration")
        if "narration_text" not in data and "visual_description" in data:
            data["narration_text"] = data["visual_description"]
        super().__init__(**data)


class ScenePlan(BaseModel):
    sections: list[SceneSection]
