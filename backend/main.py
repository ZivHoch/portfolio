from dotenv import load_dotenv

# Load environment variables early
load_dotenv()

from app.factory import create_app

app = create_app()
