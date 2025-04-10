import httpx
import os
import json

from fastapi.responses import StreamingResponse

async def stream_from_gemini(chat_request):
    system_prompt = (
        "You are a chatbot trained to answer questions about Ziv Hochman. "
        "Ziv is a software engineer with experience in backend, AI, and data. "
        "Respond helpfully and professionally."
    )

    full_input = "\n".join(
        [f"{m['role'].capitalize()}: {m['content']}" for m in chat_request["messages"]]
        + [f"User: {chat_request['message']}"]
    )

    payload = {
        "contents": [{"parts": [{"text": f"{system_prompt}\n{full_input}"}]}]
    }

    url = f"{os.getenv('LLM_ROUTER_URL')}?key={os.getenv('LLM_ROUTER_API_KEY')}"
    headers = {"Content-Type": "application/json"}

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)
        result = response.json()
        try:
            text = result["candidates"][0]["content"]["parts"][0]["text"]
        except:
            text = "I'm sorry, I couldn't generate a response."

        yield f"0:{json.dumps(text)}\n"
