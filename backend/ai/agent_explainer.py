from typing import List, Dict, Any, Optional
import json
from .schemas import ExplainerOutput
from .client import call_gemini_json
from .config import MODEL_FAST

def explain_concept(
    node_title: str,
    node_description: str,
    styles_tried: List[str],
    misconception: Optional[Dict[str, str]] = None
) -> ExplainerOutput:
    """Agent 4: Explains concept switching between Analogy, Math, and Code."""
    system_prompt = (
        "You are an expert AI educator. Generate 3 distinct pedagogical perspectives "
        "(Analogy, Mathematical formulation, Python/PyTorch code) to remediate conceptual gaps."
    )
    user_prompt = f"""
Concept: {node_title}
Description: {node_description}
Previous Styles Attempted: {styles_tried}
Target Misconception: {misconception.get('title', '') if misconception else 'General'}

Output JSON schema:
{{
  "concept_title": "{node_title}",
  "analogy_explanation": "<intuitive real world analogy>",
  "math_explanation": "<mathematical equations and objective function>",
  "code_explanation": "<runnable Python / PyTorch code snippet with comments>"
}}
"""

    def fallback():
        return ExplainerOutput(
            concept_title=node_title,
            analogy_explanation=f"💡 Analogy: Learning {node_title} is like learning musical scales instead of memorizing a single song note-for-note.",
            math_explanation="📐 Math: Decomposition of risk E[L(Y, f(X))] = Bias² + Variance + Irreducible Error σ².",
            code_explanation="# PyTorch Implementation\nimport torch\nimport torch.nn as nn\nmodel = nn.Sequential(nn.Linear(64, 32), nn.Dropout(0.3), nn.Linear(32, 2))"
        )

    return call_gemini_json(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        model_name=MODEL_FAST,
        response_model=ExplainerOutput,
        fallback_factory=fallback
    )
