from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, Any, Dict
import uuid
import datetime
import math
import json
from ..db import get_db_conn
from dependencies import get_current_user
from ai.orchestrator import orchestrator

router = APIRouter()

class AnswerSubmission(BaseModel):
    session_id: str
    question_id: str
    answer: Any  # option ID string, e.g. "opt_b" or short text dict
    confidence: int  # 1-5
    time_ms: int

def sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))

@router.post("/answers")
def submit_answer(sub: AnswerSubmission, user: dict = Depends(get_current_user)):
    user_id = str(user.get("sub", "demo-user"))
    attempt_id = str(uuid.uuid4())
    conn = get_db_conn()
    cursor = conn.cursor()

    # Retrieve question
    cursor.execute("SELECT id, node_id, difficulty, type, correct_option_id, options, rationale FROM questions WHERE id = ?", (sub.question_id,))
    q_row = cursor.fetchone()

    if not q_row:
        # Fallback question logic
        correct_option_id = "opt_b"
        node_id = "overfitting"
        difficulty = 2
    else:
        q_dict = dict(q_row)
        correct_option_id = q_dict.get("correct_option_id", "opt_b")
        node_id = q_dict.get("node_id", "overfitting")
        difficulty = q_dict.get("difficulty", 2)

    # Check correctness
    learner_choice = sub.answer if isinstance(sub.answer, str) else str(sub.answer.get("choice", ""))
    is_correct = (learner_choice == correct_option_id)

    # Check for blind spot (wrong answer with high confidence >= 4)
    is_blind_spot = (not is_correct) and (sub.confidence >= 4)

    # Tag misconception if wrong
    misconception_id = None
    misconception_info = None
    if not is_correct:
        cursor.execute("SELECT id, title, wrong_belief, correct_idea, socratic_seed FROM misconceptions WHERE node_id = ?", (node_id,))
        misc_rows = cursor.fetchall()
        if misc_rows:
            m = dict(misc_rows[0])
            misconception_id = m["id"]
            misconception_info = m
        else:
            misconception_id = "m_overfit_size"
            misconception_info = {
                "id": "m_overfit_size",
                "wrong_belief": "Overfitting only occurs when dataset is small",
                "correct_idea": "Overfitting occurs when model capacity exceeds dataset complexity",
                "socratic_seed": "If a complex model memorizes noise, how will validation accuracy compare?"
            }

    # Record attempt in database
    now = datetime.datetime.utcnow().isoformat()
    cursor.execute(
        """INSERT INTO attempts 
        (id, session_id, user_id, question_id, answer, is_correct, confidence, time_ms, misconception_id, is_blind_spot, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (attempt_id, sub.session_id, user_id, sub.question_id, json.dumps(sub.answer), 1 if is_correct else 0, sub.confidence, sub.time_ms, misconception_id, 1 if is_blind_spot else 0, now)
    )

    # Update Mastery score (PRD Section 6 Algorithm)
    cursor.execute("SELECT score, fail_streak FROM mastery WHERE user_id = ? AND node_id = ?", (user_id, node_id))
    m_row = cursor.fetchone()
    current_score = m_row["score"] if m_row else 0.3
    fail_streak = m_row["fail_streak"] if m_row else 0

    diff_norm = (difficulty - 1) / 4.0
    expected = sigmoid(2.0 * (current_score - diff_norm))
    lr = 0.15
    target = 1.0 if is_correct else 0.0

    if is_blind_spot:
        lr *= 1.5  # Extra penalty for blind spot

    new_score = max(0.0, min(1.0, current_score + lr * (target - expected)))
    new_fail_streak = 0 if is_correct else fail_streak + 1

    cursor.execute(
        """INSERT INTO mastery (user_id, node_id, score, fail_streak, last_seen)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, node_id) DO UPDATE SET score = ?, fail_streak = ?, last_seen = ?""",
        (user_id, node_id, new_score, new_fail_streak, now, new_score, new_fail_streak, now)
    )

    conn.commit()
    conn.close()

    socratic_start = None
    if not is_correct and misconception_info:
        socratic_start = misconception_info.get("socratic_seed", "Notice the gap between train and validation performance.")

    return {
        "attempt_id": attempt_id,
        "is_correct": is_correct,
        "is_blind_spot": is_blind_spot,
        "misconception": misconception_info,
        "socratic_start": socratic_start,
        "new_mastery_score": round(new_score, 3)
    }
