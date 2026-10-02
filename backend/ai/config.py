import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="d:/PathMind/backend/.env")
load_dotenv(dotenv_path="d:/PathMind/.env")
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
MODEL_FAST = os.getenv("MODEL_FAST", "gemini-2.5-flash")
MODEL_TUTOR = os.getenv("MODEL_TUTOR", "gemini-2.5-flash")

REQUEST_TIMEOUT_SECONDS = int(os.getenv("AI_TIMEOUT_SECONDS", "30"))
MAX_TOKENS = int(os.getenv("AI_MAX_TOKENS", "1000"))
