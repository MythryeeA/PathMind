from fastapi import APIRouter, Depends
import json
from ..db import get_db_conn
from dependencies import get_current_user

router = APIRouter()

@router.get("")
def get_topics(user: dict = Depends(get_current_user)):
    conn = get_db_conn()
    cursor = conn.cursor()

    cursor.execute("SELECT id, track, title, description, prerequisites, sort_order FROM concept_nodes ORDER BY sort_order ASC")
    nodes = cursor.fetchall()

    user_id = str(user.get("sub", "demo-user"))
    cursor.execute("SELECT node_id, score, calibration, fail_streak, preferred_style FROM mastery WHERE user_id = ?", (user_id,))
    mastery_map = {row["node_id"]: dict(row) for row in cursor.fetchall()}

    result = []
    for node in nodes:
        node_dict = dict(node)
        node_dict["mastery"] = mastery_map.get(node_dict["id"], {
            "score": 0.3,
            "calibration": 0.0,
            "fail_streak": 0,
            "preferred_style": None
        })
        result.append(node_dict)

    conn.close()
    return {"topics": result}
