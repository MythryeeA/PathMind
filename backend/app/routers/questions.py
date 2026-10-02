from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import json
from ..db import get_db_conn
from dependencies import get_current_user

router = APIRouter()

class QuestionGetRequest(BaseModel):
    concept_id: Optional[str] = "overfitting"
    difficulty: Optional[int] = 2
    track: Optional[str] = "ml_foundations"

@router.post("/get")
def get_question_direct(req: Optional[QuestionGetRequest] = None, user: dict = Depends(get_current_user)):
    concept = req.concept_id if req and req.concept_id else "overfitting"
    diff = req.difficulty if req and req.difficulty else 2

    conn = get_db_conn()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, node_id, difficulty, type, stem, options, rationale FROM questions WHERE (node_id = ? OR node_id LIKE ?) AND reviewed = 1 LIMIT 1",
        (concept, f"%{concept}%")
    )
    q = cursor.fetchone()
    if not q:
        cursor.execute("SELECT id, node_id, difficulty, type, stem, options, rationale FROM questions LIMIT 1")
        q = cursor.fetchone()

    conn.close()

    if not q:
        return {
            "id": "11111111-1111-1111-1111-111111111111",
            "node_id": concept,
            "difficulty": diff,
            "type": "mcq",
            "stem": "A deep model achieves 99.4% accuracy on training data, but only 62.1% accuracy on the test set. What is the root cause?",
            "options": [
                {"id": "opt_a", "text": "The model is underfitting due to low capacity."},
                {"id": "opt_b", "text": "The model is overfitting due to high variance between training and generalization sets."},
                {"id": "opt_c", "text": "Overfitting occurs only when dataset size is under 1,000 samples."},
                {"id": "opt_d", "text": "The learning rate is zero."}
            ],
            "confidence_required": True,
            "confidence_range": [1, 5]
        }

    q_dict = dict(q)
    if isinstance(q_dict["options"], str):
        try:
            q_dict["options"] = json.loads(q_dict["options"])
        except Exception:
            pass

    if isinstance(q_dict["options"], list):
        for opt in q_dict["options"]:
            if isinstance(opt, dict):
                opt.pop("misconception_id", None)

    q_dict.pop("correct_option_id", None)
    q_dict["confidence_required"] = True
    q_dict["confidence_range"] = [1, 5]
    return q_dict

@router.get("/{session_id}/next-question")
def get_next_question(session_id: str, user: dict = Depends(get_current_user)):
    conn = get_db_conn()
    cursor = conn.cursor()

    # Check session
    cursor.execute("SELECT track, mode FROM sessions WHERE id = ?", (session_id,))
    session = cursor.fetchone()
    if not session:
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found")

    cursor.execute(
        "SELECT id, node_id, difficulty, type, stem, options, rationale FROM questions WHERE reviewed = 1 LIMIT 1"
    )
    q = cursor.fetchone()
    conn.close()

    if not q:
        return {
            "id": "11111111-1111-1111-1111-111111111111",
            "node_id": "overfitting",
            "difficulty": 2,
            "type": "mcq",
            "stem": "A model achieves 99% accuracy on the training set but 61% accuracy on the validation set. What is the primary issue?",
            "options": [
                {"id": "opt_a", "text": "The model is underfitting because validation accuracy is low."},
                {"id": "opt_b", "text": "The model is overfitting because of high variance between train and validation performance."},
                {"id": "opt_c", "text": "Overfitting only occurs when dataset is small."},
                {"id": "opt_d", "text": "The learning rate is zero."}
            ],
            "rationale": "Overfitting happens when a high-capacity model fits training noise."
        }

    q_dict = dict(q)
    if isinstance(q_dict["options"], str):
        try:
            q_dict["options"] = json.loads(q_dict["options"])
        except Exception:
            pass

    if isinstance(q_dict["options"], list):
        for opt in q_dict["options"]:
            if isinstance(opt, dict):
                opt.pop("misconception_id", None)

    q_dict.pop("correct_option_id", None)
    return q_dict
