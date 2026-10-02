from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import uuid
import datetime
from ..db import get_db_conn
from dependencies import get_current_user

router = APIRouter()

class CreateSessionRequest(BaseModel):
    track: str
    mode: str  # 'diagnostic', 'practice', 'pilot_pre', 'pilot_post'

@router.post("")
def create_session(req: CreateSessionRequest, user: dict = Depends(get_current_user)):
    user_id = str(user.get("sub", "demo-user"))
    session_id = str(uuid.uuid4())
    now = datetime.datetime.utcnow().isoformat()

    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO sessions (id, user_id, track, mode, started_at) VALUES (?, ?, ?, ?, ?)",
        (session_id, user_id, req.track, req.mode, now)
    )
    conn.commit()
    conn.close()

    return {"session_id": session_id, "track": req.track, "mode": req.mode, "started_at": now}
