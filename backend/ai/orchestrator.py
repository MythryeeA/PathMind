from typing import List, Dict, Any, Optional
from .schemas import (
    QuestionOutput,
    ClassifierOutput,
    SocraticTutorOutput,
    ExplainerOutput
)
from .agent_question import generate_question
from .agent_classifier import classify_misconception
from .agent_tutor import tutor_turn
from .agent_explainer import explain_concept

class AIOrchestrator:
    """Orchestrator unifying all 4 LLM agents for PathMind."""

    def generate_question(
        self,
        node_id: str,
        node_title: str,
        difficulty: int,
        misconceptions: List[Dict[str, str]],
        recent_stems: Optional[List[str]] = None
    ) -> QuestionOutput:
        return generate_question(node_id, node_title, difficulty, misconceptions, recent_stems)

    def classify_misconception(
        self,
        question_stem: str,
        correct_answer: str,
        learner_answer: str,
        candidate_misconceptions: List[Dict[str, str]]
    ) -> ClassifierOutput:
        return classify_misconception(question_stem, correct_answer, learner_answer, candidate_misconceptions)

    def tutor_turn(
        self,
        misconception: Dict[str, str],
        transcript: List[Dict[str, str]],
        turn: int,
        style: Optional[str] = "analogy"
    ) -> SocraticTutorOutput:
        return tutor_turn(misconception, transcript, turn, style)

    def explain_concept(
        self,
        node_title: str,
        node_description: str,
        styles_tried: List[str],
        misconception: Optional[Dict[str, str]] = None
    ) -> ExplainerOutput:
        return explain_concept(node_title, node_description, styles_tried, misconception)

orchestrator = AIOrchestrator()
