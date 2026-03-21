from fastapi import FastAPI
from middleware.api_key import ApiKeyMiddleware
from routers.pipeline import router as pipeline_router

app = FastAPI(title="Agentic Tutor AI Service", version="0.1.0")

app.add_middleware(ApiKeyMiddleware)
app.include_router(pipeline_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
