from pathlib import Path
from app.logs.logger import get_logger

logger = get_logger(__name__)


async def init_documents():
    """
    Scans the 'docs' folder for markdown files and logs their presence.
    Currently does not chunk or embed content since DocumentIndexer is disabled.
    """

    # Assuming docs/ folder is at project root level
    docs_dir = Path(__file__).resolve().parents[3] / "docs"

    logger.info(f"Looking for markdown documents in: {docs_dir}")

    if not docs_dir.exists():
        logger.warning(f"Docs directory {docs_dir} does not exist.")
        return

    md_files = list(docs_dir.glob("*.md"))
    if not md_files:
        logger.info("No markdown documents found.")
        return

    for file_path in md_files:
        logger.info(f"Found markdown file: {file_path.name}")
        try:
            with open(file_path, 'r') as file:
                content = file.read()
                logger.debug(f"Content preview (first 100 chars): {content[:100]}...")
        except Exception as e:
            logger.error(f"Failed to read file {file_path.name}: {str(e)}")
