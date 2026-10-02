from typing import List, Dict, Any, Optional
import json
from .schemas import SocraticTutorOutput
from .client import call_gemini_json, sanitize_learner_input
from .config import MODEL_TUTOR

def tutor_turn(
    misconception: Dict[str, str],
    transcript: List[Dict[str, str]],
    turn: int,
    style: Optional[str] = "analogy"
) -> SocraticTutorOutput:
    """Agent 3: Socratic multi-turn dialogue without immediately giving away the answer."""
    system_prompt = (
        "You are a master Socratic AI tutor. Ask guiding questions to help the learner "
        "identify and correct their own conceptual misunderstanding. "
        "Do NOT give away the direct answer before turn 3."
    )
    safe_transcript = [
        {"role": t.get("role", "learner"), "text": sanitize_learner_input(t.get("text", ""))}
        for t in transcript
    ]
    user_prompt = f"""
Misconception Target:
Title: {misconception.get('title', '')}
Wrong Belief: {misconception.get('wrong_belief', '')}
Pedagogical Style: {style}
Current Turn: {turn} of 3

Dialogue Transcript:
{json.dumps(safe_transcript, indent=2)}

Output JSON schema:
{{
  "turn_number": {turn},
  "tutor_reply": "<guiding question or rationale>",
  "is_resolved": false,
  "reveal_solution": {"true" if turn >= 3 else "false"}
}}
"""

    def fallback():
        if turn == 1:
            reply = "Notice the relationship between model capacity and training data noise. What occurs when a model has sufficient parameters to memorize individual sample quirks?"
            resolved = False
        elif turn == 2:
            reply = "Exactly right direction. If a model fits noise, how does its performance on new, unseen test data compare to data it already memorized?"
            resolved = False
        else:
            reply = "Great effort! High variance occurs when model capacity is too high relative to sample size, leading to poor validation generalization. Regularization and cross-validation help anchor the model."
            resolved = True

        return SocraticTutorOutput(
            turn_number=turn,
            tutor_reply=reply,
            is_resolved=resolved,
            reveal_solution=(turn >= 3)
        )

    return call_gemini_json(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        model_name=MODEL_TUTOR,
        response_model=SocraticTutorOutput,
        fallback_factory=fallback
    )
