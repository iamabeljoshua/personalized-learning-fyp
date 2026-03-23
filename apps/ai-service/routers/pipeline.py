from fastapi import APIRouter
from providers.llm import get_llm_provider, get_video_llm_provider
from providers.image import get_image_provider
from providers.tts import get_tts_provider
from providers.manim_runner import get_manim_runner
from processors.curriculum import CurriculumProcessor
from processors.content import ContentProcessor
from processors.audio import AudioProcessor
from processors.video import VideoProcessor
from processors.assessment import AssessmentProcessor
from processors.knowledge_trace import KnowledgeTraceProcessor
from processors.adaptation import AdaptationProcessor
from processors.rag import RAGProcessor
from schemas.adaptation import AdaptRequest, AdaptResponse
from schemas.rag import EmbedDocumentRequest, EmbedDocumentResponse, EmbedTextRequest, EmbedTextResponse
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
from schemas.knowledge_trace import (
    KnowledgeTraceUpdateRequest,
    KnowledgeTraceUpdateResponse,
    KnowledgeTraceBatchRequest,
    KnowledgeTraceBatchResponse,
)

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
    llm = get_llm_provider()
    tts = get_tts_provider()
    processor = AudioProcessor(llm, tts)
    return await processor.generate_audio(request)


@router.post("/content/video", response_model=GenerateVideoResponse)
async def generate_content_video(request: GenerateVideoRequest):
    llm = get_video_llm_provider()
    tts = get_tts_provider()
    manim = get_manim_runner()
    processor = VideoProcessor(llm, tts, manim)
    return await processor.generate_video(request)


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


@router.post("/knowledge-trace-batch", response_model=KnowledgeTraceBatchResponse)
async def knowledge_trace_batch(request: KnowledgeTraceBatchRequest):
    processor = KnowledgeTraceProcessor()
    return processor.update_batch(
        state=request.current_state,
        answers=request.answers,
    )


@router.post("/adapt", response_model=AdaptResponse)
async def adapt(request: AdaptRequest):
    llm = get_llm_provider()
    processor = AdaptationProcessor(llm)
    return await processor.adapt(request)


@router.post("/embed", response_model=EmbedDocumentResponse)
async def embed_document(request: EmbedDocumentRequest):
    processor = RAGProcessor()
    return processor.embed_document(request.file_path)


@router.post("/embed-text", response_model=EmbedTextResponse)
async def embed_text(request: EmbedTextRequest):
    processor = RAGProcessor()
    return processor.embed_text(request.text)
