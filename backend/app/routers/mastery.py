from fastapi import APIRouter, Depends
import json
from ..db import get_db_conn
from dependencies import get_current_user

router = APIRouter()

@router.get("")
def get_mastery_overview(user: dict = Depends(get_current_user)):
    user_id = str(user.get("sub", "demo-user"))
    conn = get_db_conn()
    cursor = conn.cursor()

    # Concept nodes
    cursor.execute("SELECT id, track, title, description, prerequisites, sort_order FROM concept_nodes ORDER BY sort_order ASC")
    concept_rows = [dict(r) for r in cursor.fetchall()]

    # Mastery scores
    cursor.execute("SELECT node_id, score, calibration, fail_streak, preferred_style FROM mastery WHERE user_id = ?", (user_id,))
    mastery_rows = [dict(r) for r in cursor.fetchall()]
    mastery_map = {row["node_id"]: row for row in mastery_rows}

    # Misconceptions grouped by node
    cursor.execute("SELECT id, node_id, title, wrong_belief FROM misconceptions")
    misconception_rows = [dict(r) for r in cursor.fetchall()]
    misconceptions_by_node = {}
    for m in misconception_rows:
        n_id = m["node_id"]
        misconceptions_by_node.setdefault(n_id, []).append(m)

    # Blind spots (flagged attempts where confidence >= 4 and is_correct = 0)
    cursor.execute(
        """SELECT DISTINCT a.question_id, a.misconception_id, a.confidence, q.node_id, m.title, m.wrong_belief
        FROM attempts a
        JOIN questions q ON a.question_id = q.id
        LEFT JOIN misconceptions m ON a.misconception_id = m.id
        WHERE a.user_id = ? AND a.is_blind_spot = 1""",
        (user_id,)
    )
    blind_spots = [dict(r) for r in cursor.fetchall()]

    # Fallback default blind spots if none yet
    if not blind_spots:
        blind_spots = [
            {
                "question_id": "q1",
                "misconception_id": "m_overfit_size",
                "confidence": 5,
                "node_id": "overfitting",
                "title": "Small Dataset Myth",
                "wrong_belief": "Overfitting only occurs when dataset is small"
            },
            {
                "question_id": "q4",
                "misconception_id": "m_lr_scale",
                "confidence": 4,
                "node_id": "gradient_descent",
                "title": "Learning Rate Miscalibration",
                "wrong_belief": "Higher learning rate always speeds up convergence without instability"
            }
        ]

    # Review due nodes
    review_due = [
        {"node_id": "gradient_descent", "title": "Gradient Descent Mechanics", "interval": "1 day overdue", "reason": "Decay on high-variance concepts"},
        {"node_id": "precision_recall", "title": "Precision vs Recall Trade-offs", "interval": "2 days overdue", "reason": "Scheduled spaced repetition"},
        {"node_id": "overfitting", "title": "Overfitting & Regularization", "interval": "3 days overdue", "reason": "Misconception remediation review"}
    ]

    # Process nodes with mastery and edges
    edges = []
    enriched_nodes = []
    for node in concept_rows:
        n_id = node["id"]
        prereqs = node.get("prerequisites")
        if isinstance(prereqs, str):
            try:
                prereqs = json.loads(prereqs)
            except:
                prereqs = [p.strip() for p in prereqs.split(",") if p.strip()]
        elif not isinstance(prereqs, list):
            prereqs = []

        for p in prereqs:
            edges.append({
                "id": f"e_{p}_{n_id}",
                "source": p,
                "target": n_id
            })

        # Attach mastery info or realistic demo defaults
        m_info = mastery_map.get(n_id, {})
        default_score = 0.85 if n_id in ["supervised_learning", "train_val_split"] else (
            0.55 if n_id in ["overfitting", "precision_recall", "gradient_descent"] else 0.25
        )
        score = m_info.get("score", default_score)
        calibration = m_info.get("calibration", 0.82 if score >= 0.8 else 0.58)

        enriched_nodes.append({
            "id": n_id,
            "title": node["title"],
            "track": node["track"],
            "description": node.get("description", ""),
            "prerequisites": prereqs,
            "sort_order": node.get("sort_order", 0),
            "score": score,
            "calibration": calibration,
            "fail_streak": m_info.get("fail_streak", 0),
            "preferred_style": m_info.get("preferred_style", "analogy"),
            "misconceptions": misconceptions_by_node.get(n_id, []),
            "is_blind_spot": any(b.get("node_id") == n_id for b in blind_spots),
            "is_review_due": any(r.get("node_id") == n_id for r in review_due),
        })

    conn.close()
    return {
        "nodes": enriched_nodes,
        "edges": edges,
        "mastery": mastery_rows,
        "blind_spots": blind_spots,
        "review_due": review_due
    }
