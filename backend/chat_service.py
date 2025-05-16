import os
import json
from pathlib import Path
import httpx
from fastapi.responses import StreamingResponse

# Optional: Load your markdown context file (if using)
def load_markdown_context():
    context_path = Path(__file__).parent / "docs" / "about-me.md"
    if context_path.exists():
        with open(context_path, "r", encoding="utf-8") as f:
            return f.read()
    return ""

markdown_context = load_markdown_context()


async def stream_from_gemini(chat_request):
    # Basic validation
    if not os.getenv("LLM_ROUTER_URL") or not os.getenv("LLM_ROUTER_API_KEY"):
        raise ValueError("LLM_ROUTER_URL or LLM_ROUTER_API_KEY not set")

    # System prompt with optional markdown context
    system_prompt = (
        "You are a professional AI assistant, designed to provide engaging, "
        "personalized responses about Ziv Hochman. Use the context below to answer:\n\n"
        f"{markdown_context}\n\n"
        "Instructions:\n"
        "1. Be accurate and rely only on the context or prior messages.\n"
        "2. Respond clearly using markdown.\n"
        "3. Do not make up information. Say if you're unsure.\n"
        "4. Be polite, but concise.\n"
        "5. If the question concerns a specific role, research the company’s details and respond accordingly.\n"
    )

    # Format the message history
    full_input = "\n".join(
        [f"{m['role'].capitalize()}: {m['content']}" for m in chat_request["messages"]]
        + [f"User: {chat_request['message']}"]
    )

    payload = {
        "contents": [
            {"parts": [{"text": f"{system_prompt}\n\n{full_input}"}]}
        ]
    }

    url = f"{os.getenv('LLM_ROUTER_URL')}?key={os.getenv('LLM_ROUTER_API_KEY')}"
    headers = {"Content-Type": "application/json"}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()

            # Extract response text
            text = result["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print("❌ Error calling Gemini:", e)
            text = "I'm sorry, I couldn't generate a response."

    yield f"0:{json.dumps(text)}\n"
