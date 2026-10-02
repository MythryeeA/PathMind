import os
import json
import logging
import time
from typing import Type, TypeVar, Optional, Dict, Any
from pydantic import BaseModel, ValidationError
from google import genai
from google.genai import types
from .config import GEMINI_API_KEY, MODEL_FAST, MODEL_TUTOR, REQUEST_TIMEOUT_SECONDS, MAX_TOKENS

T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger("ai_client")

def sanitize_learner_input(raw_input: str) -> str:
    """Wraps untrusted learner input in XML tags to prevent prompt injection."""
    clean = raw_input.replace("<learner_input>", "").replace("</learner_input>", "")
    return f"<learner_input>{clean}</learner_input>"

def call_gemini_json(
    system_prompt: str,
    user_prompt: str,
    model_name: str,
    response_model: Type[T],
    fallback_factory: Any
) -> T:
    """Calls Google Gemini SDK requesting structured JSON.
    Validates output with Pydantic. Retries once on validation failure, then executes fallback_factory.
    """
    if not GEMINI_API_KEY or len(GEMINI_API_KEY.strip()) < 10:
        print("--> FALLBACK TRIGGERED DUE TO: Missing or empty GEMINI_API_KEY in environment")
        return fallback_factory()

    full_system = (
        f"{system_prompt}\n\n"
        "CRITICAL INSTRUCTION: You MUST return strictly valid raw JSON adhering to the required schema. "
        "Do NOT include markdown block markers like ```json ... ``` or conversational preamble."
    )

    try:
        client = genai.Client(api_key=GEMINI_API_KEY.strip())
    except Exception as e:
        print(f"--> FALLBACK TRIGGERED DUE TO Client Init Error: {e}")
        return fallback_factory()

    for attempt in range(2):
        try:
            print(f"--> EXECUTING LIVE GEMINI API CALL (Model: {model_name}, Attempt: {attempt + 1})...")
            start_time = time.time()

            response = client.models.generate_content(
                model=model_name,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=full_system,
                    temperature=0.2,
                    max_output_tokens=MAX_TOKENS,
                    response_mime_type="application/json"
                )
            )
            elapsed = time.time() - start_time
            print(f"--> LIVE GEMINI API RESPONSE RECEIVED [{elapsed:.2f}s]")

            content_text = response.text or ""

            # Clean possible markdown wrapping
            cleaned_json_text = content_text.strip()
            if cleaned_json_text.startswith("```json"):
                cleaned_json_text = cleaned_json_text[7:]
            if cleaned_json_text.startswith("```"):
                cleaned_json_text = cleaned_json_text[3:]
            if cleaned_json_text.endswith("```"):
                cleaned_json_text = cleaned_json_text[:-3]
            cleaned_json_text = cleaned_json_text.strip()

            parsed = json.loads(cleaned_json_text)
            validated = response_model.model_validate(parsed)
            return validated
        except (Exception, json.JSONDecodeError, ValidationError) as e:
            print(f"--> Exception during Gemini API call/validation: {e}")
            if attempt == 1:
                print(f"--> FALLBACK TRIGGERED DUE TO: {e}")
                return fallback_factory()

    return fallback_factory()
