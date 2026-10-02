from fastapi import APIRouter, Depends
from pydantic import BaseModel
import uuid
from ..db import get_db_conn
from dependencies import get_current_user

router = APIRouter()

class ApproveProposalRequest(BaseModel):
    proposal_id: str
    approved: bool

@router.post("/propose")
def propose_next_step(user: dict = Depends(get_current_user)):
    user_id = str(user.get("sub", "demo-user"))
    proposal_id = str(uuid.uuid4())

    return {
        "proposal_id": proposal_id,
        "proposal_type": "level_up",
        "node_id": "overfitting",
        "target_difficulty": 3,
        "rationale": "High accuracy on recent difficulty 2 questions. Path Planner proposes leveling up to difficulty 3."
    }

@router.post("/approve")
def approve_proposal(req: ApproveProposalRequest, user: dict = Depends(get_current_user)):
    return {
        "proposal_id": req.proposal_id,
        "approved": req.approved,
        "status": "applied" if req.approved else "overridden"
    }
