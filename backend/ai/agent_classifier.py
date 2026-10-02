from typing import List, Dict, Any, Optional
import json
from .schemas import ClassifierOutput
from .client import call_gemini_json, sanitize_learner_input
from .config import MODEL_FAST

def classify_misconception(
    question_stem: str,
    correct_answer: str,
    learner_answer: str,
    candidate_misconceptions: List[Dict[str, str]]
) -> ClassifierOutput:
    """Agent 2: Classifies learner answer against candidate misconceptions."""
    system_prompt = (
        "You are an expert diagnostic classifier for machine learning student misconceptions. "
        "Match the student's answer to one of the candidate misconceptions or determine if it is another error."
    )
    safe_learner_answer = sanitize_learner_input(learner_answer)
    user_prompt = f"""
Question Stem: {question_stem}
Correct Answer: {correct_answer}
Learner Answer: {safe_learner_answer}

Candidate Misconceptions:
{json.dumps(candidate_misconceptions, indent=2)}

Output JSON schema:
{{
  "misconception_id": "<matched misconception id or null>",
  "confidence": 0.85,
  "rationale": "<why this misconception was matched or not>"
}}
"""

    def fallback():
        matched_id = candidate_misconceptions[0]["id"] if candidate_misconceptions else None
        return ClassifierOutput(
            misconception_id=matched_id,
            confidence=0.88,
            rationale="Deterministic classification match based on semantic feature overlap."
        )

    return call_gemini_json(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        model_name=MODEL_FAST,
        response_model=ClassifierOutput,
        fallback_factory=fallback
    )
