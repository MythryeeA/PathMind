from typing import List, Dict, Any, Optional
import json
from .schemas import QuestionOutput, QuestionOption
from .client import call_gemini_json
from .config import MODEL_FAST

def generate_question(
    node_id: str,
    node_title: str,
    difficulty: int,
    misconceptions: List[Dict[str, str]],
    recent_stems: Optional[List[str]] = None
) -> QuestionOutput:
    """Agent 1: Generates diagnostic MCQ targeting specific misconceptions."""
    system_prompt = (
        "You are an expert AI/ML pedagogical exam writer. "
        "Create a single multiple-choice question designed to diagnose specific AI misconceptions."
    )
    user_prompt = f"""
Target Node: {node_title} (ID: {node_id})
Difficulty: {difficulty} (1=easy, 2=medium, 3=hard, 4=advanced, 5=expert)
Target Misconceptions:
{json.dumps(misconceptions, indent=2)}

Output JSON schema:
{{
  "node_id": "{node_id}",
  "difficulty": {difficulty},
  "stem": "<question stem>",
  "options": [
    {{"id": "opt_a", "text": "<option text>", "misconception_id": null}},
    {{"id": "opt_b", "text": "<option text>", "misconception_id": "<misconception_id or null>"}},
    {{"id": "opt_c", "text": "<option text>", "misconception_id": "<misconception_id or null>"}},
    {{"id": "opt_d", "text": "<option text>", "misconception_id": "<misconception_id or null>"}}
  ],
  "correct_option_id": "opt_a",
  "rationale": "<explanation of correct answer>"
}}
"""

    def fallback():
        return QuestionOutput(
            node_id=node_id,
            difficulty=difficulty,
            stem=f"When training a machine learning model on {node_title}, what is the primary indicator of high variance (overfitting)?",
            options=[
                QuestionOption(id="opt_a", text="Training loss is low while validation loss is significantly higher and diverging.", misconception_id=None),
                QuestionOption(id="opt_b", text="Both training and validation losses remain equally high throughout training.", misconception_id=misconceptions[0]["id"] if misconceptions else None),
                QuestionOption(id="opt_c", text="The learning rate is too low for gradient descent to update weights.", misconception_id=None),
                QuestionOption(id="opt_d", text="The dataset contains too many features relative to rows.", misconception_id=None),
            ],
            correct_option_id="opt_a",
            rationale="Overfitting occurs when the model learns training noise, leading to high generalization variance."
        )

    return call_gemini_json(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        model_name=MODEL_FAST,
        response_model=QuestionOutput,
        fallback_factory=fallback
    )
