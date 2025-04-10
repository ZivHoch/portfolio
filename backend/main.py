# main.py
import os
import asyncio
from app import factory
from app.controllers.chat_router import ChatRouter
from app.logs.logger import get_logger
from app.startup.documents.init_documents import init_documents
from dotenv import load_dotenv
from fastapi import FastAPI
from app.controllers.chat_router import router


load_dotenv()
logger = get_logger(__name__)

# ✅ Create app at module level so uvicorn can find it
app: FastAPI = factory.create_app()
app.include_router(router)
# ✅ Register routes
chat_service = factory.chat_service()
router = ChatRouter(chat_service=chat_service)
app.include_router(router=router.router)

# ✅ Kick off background tasks when running directly
if __name__ == '__main__':
    import uvicorn

    async def startup_tasks():
        logger.info("Running document initialization...")
        await init_documents()

    asyncio.run(startup_tasks())

    logger.info("Starting server...")
    uvicorn.run("main:app", host=os.getenv("UVICORN_IP", "0.0.0.0"), port=int(os.getenv("UVICORN_PORT", 8000)))
