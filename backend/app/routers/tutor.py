from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import uuid
import datetime
from ..db import get_db_conn
from dependencies import get_current_user
from ai.orchestrator import orchestrator

router = APIRouter()

class TutorTurnRequest(BaseModel):
    attempt_id: str
    learner_message: Optional[str] = None

class ExplainRequest(BaseModel):
    node_id: str

@router.post("/turn")
def execute_tutor_turn(req: TutorTurnRequest, user: dict = Depends(get_current_user)):
    user_id = str(user.get("sub", "demo-user"))
    conn = get_db_conn()
    cursor = conn.cursor()

    # Get attempt & misconception details
    cursor.execute("SELECT misconception_id, user_id FROM attempts WHERE id = ?", (req.attempt_id,))
    attempt = cursor.fetchone()
    if not attempt:
        conn.close()
        raise HTTPException(status_code=404, detail="Attempt not found")

    misc_id = attempt["misconception_id"] or "m_overfit_size"
    cursor.execute("SELECT wrong_belief, correct_idea, socratic_seed FROM misconceptions WHERE id = ?", (misc_id,))
    misc_row = cursor.fetchone()
    conn.close()

    misc_dict = dict(misc_row) if misc_row else {
        "wrong_belief": "Overfitting only occurs when dataset is small",
        "correct_idea": "Overfitting happens when model capacity exceeds dataset complexity",
        "socratic_seed": "How does high model capacity interact with noise in the training set?"
    }

    # Fetch turn history count
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT count(*) FROM socratic_turns WHERE attempt_id = ?", (req.attempt_id,))
    turn_count = cursor.fetchone()[0] // 2 + 1

    # Call Agent 3: Socratic Tutor
    transcript = [{"role": "learner", "content": req.learner_message}] if req.learner_message else []
    tutor_res = orchestrator.tutor_turn(misc_dict, transcript, turn_count, style="analogy")

    # Log turn
    turn_id = str(uuid.uuid4())
    now = datetime.datetime.utcnow().isoformat()
    cursor.execute(
        "INSERT INTO socratic_turns (id, attempt_id, turn, role, content, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (turn_id, req.attempt_id, turn_count, "tutor", tutor_res.message, now)
    )
    conn.commit()
    conn.close()

    return {
        "turn": turn_count,
        "message": tutor_res.message,
        "hint_level": tutor_res.hint_level,
        "ready_to_reveal": tutor_res.ready_to_reveal
    }

@router.post("/explain")
def execute_explainer(req: ExplainRequest, user: dict = Depends(get_current_user)):
    user_id = str(user.get("sub", "demo-user"))
    conn = get_db_conn()
    cursor = conn.cursor()

    cursor.execute("SELECT title, description FROM concept_nodes WHERE id = ?", (req.node_id,))
    node = cursor.fetchone()
    title = node["title"] if node else req.node_id
    desc = node["description"] if node else ""

    cursor.execute("SELECT styles_tried, preferred_style FROM mastery WHERE user_id = ? AND node_id = ?", (user_id, req.node_id))
    m_row = cursor.fetchone()
    styles_tried = m_row["styles_tried"] if m_row and m_row["styles_tried"] else []
    conn.close()

    explainer_res = orchestrator.explain_concept(
        node_title=title,
        node_description=desc,
        styles_tried=styles_tried if isinstance(styles_tried, list) else [],
        misconception={"wrong_belief": "Overfitting only occurs when dataset is small"}
    )

    return explainer_res.model_dump()
