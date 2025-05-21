from email import header
import os

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from models import ChatRequest
from chat_service import stream_from_gemini

## update
import asyncio
import time
from typing import List, Dict
import httpx
from cachetools import TTLCache

GITHUB_USER = "ZivHoch"#os.getenv("GITHUB_USER")
GITHUB_TOKEN = os.getenv("VITE_GITHUB_TOKEN")
if not (GITHUB_USER and GITHUB_TOKEN):
    raise RuntimeError("Set GITHUB_USER and GITHUB_TOKEN in your environment")

AUTH_HEADER = {"Authorization":f"token {GITHUB_TOKEN}"}

cache = TTLCache(maxsize=1,ttl=60*60)

load_dotenv()

app = FastAPI()

async def fetch_repos(client: httpx.AsyncClient)-> List[Dict]:
    url = f"https://api.github.com/users/{GITHUB_USER}/repos?per_page=100"
    resp = await client.get(url,headers=AUTH_HEADER)
    resp.raise_for_status()
    return resp.json()

async def fetch_languages(client:httpx.AsyncClient, languages_url: str)-> Dict[str,int]:
    resp = await client.get(languages_url,headers=AUTH_HEADER)
    resp.raise_for_status()
    return resp.json()

@app.get("/api/projects")
async def get_projects():
    if "projects" in cache:
        return cache["projects"]
    async with httpx.AsyncClient() as client:
        try:
            repos = await fetch_repos(client)
        except httpx.HTTPError as e:
            raise HTTPException(502,detail="Failed fetching repos") from e
        tasks = [
            fetch_languages(client,repo['languages_url'])
            for repo in repos
        ]
        langs_list = await asyncio.gather(*tasks, return_exceptions=True)
        
        projects = []
        for repo, langs in zip(repos,langs_list):
            if isinstance(langs,Exception):
                langs ={}
            projects.append({
                "name": repo["name"],
                "url": repo["html_url"],
                "description":repo["description"],
                "languages": langs,
                "updated_at": repo["updated_at"]
            })
        cache["projects"] = projects
        return projects

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
