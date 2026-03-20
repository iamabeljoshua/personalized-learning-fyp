from fastapi import FastAPI

app = FastAPI(title="Agentic Tutor AI Service", version="0.1.0")


@app.get("/health")
async def health():
    return {"status": "ok"}
