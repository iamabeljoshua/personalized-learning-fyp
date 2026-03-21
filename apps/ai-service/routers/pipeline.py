from fastapi import APIRouter
from providers.llm import get_llm_provider
from providers.image import get_image_provider
from processors.curriculum import CurriculumProcessor
from processors.content import ContentProcessor
from processors.assessment import AssessmentProcessor
from processors.knowledge_trace import KnowledgeTraceProcessor
from schemas.outline import GenerateOutlineRequest, GenerateOutlineResponse
from schemas.content import (
    GenerateTextRequest,
    GenerateTextResponse,
    GenerateAudioRequest,
    GenerateAudioResponse,
    GenerateVideoRequest,
    GenerateVideoResponse,
)
from schemas.assessment import GenerateAssessmentRequest, GenerateAssessmentResponse
from schemas.knowledge_trace import KnowledgeTraceUpdateRequest, KnowledgeTraceUpdateResponse

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


@router.post("/outline", response_model=GenerateOutlineResponse)
async def generate_outline(request: GenerateOutlineRequest):
    llm = get_llm_provider()
    processor = CurriculumProcessor(llm)
    return await processor.generate_outline(
        topic=request.topic,
        student_context=request.student_context,
        rag_chunks=request.rag_chunks,
    )


@router.post("/content/text", response_model=GenerateTextResponse)
async def generate_content_text(request: GenerateTextRequest):
    llm = get_llm_provider()
    image_provider = get_image_provider()
    processor = ContentProcessor(llm, image_provider)
    result = await processor.generate_content(
        node=request.node,
        student_context=request.student_context,
        outline_context=request.outline_context,
        rag_chunks=request.rag_chunks,
    )
    return GenerateTextResponse(text=result.text)


@router.post("/content/audio", response_model=GenerateAudioResponse)
async def generate_content_audio(request: GenerateAudioRequest):
    # TTS implementation coming later
    return GenerateAudioResponse(audio_url=None)


@router.post("/content/video", response_model=GenerateVideoResponse)
async def generate_content_video(request: GenerateVideoRequest):
    # Manim implementation coming later
    return GenerateVideoResponse(video_url=None)


@router.post("/assessment", response_model=GenerateAssessmentResponse)
async def generate_assessment(request: GenerateAssessmentRequest):
    llm = get_llm_provider()
    processor = AssessmentProcessor(llm)
    return await processor.generate_assessment(
        node=request.node,
        student_context=request.student_context,
    )


@router.post("/knowledge-trace-update", response_model=KnowledgeTraceUpdateResponse)
async def knowledge_trace_update(request: KnowledgeTraceUpdateRequest):
    processor = KnowledgeTraceProcessor()
    return processor.update(
        state=request.current_state,
        is_correct=request.is_correct,
    )


@router.post("/adapt")
async def adapt():
    return {"message": "not implemented — LangGraph adaptation coming later"}
