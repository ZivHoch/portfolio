import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from models import ChatRequest
from chat_service import stream_from_gemini

load_dotenv()

app = FastAPI()

# CORS for Netlify frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or your Netlify domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat")
async def chat_endpoint(request: Request):
    data = await request.json()
    return StreamingResponse(stream_from_gemini(data), media_type="text/event-stream")

@app.get("/")
def root():
    return {"status": "Chatbot is running"}
