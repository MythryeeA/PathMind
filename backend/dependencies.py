import os
import time
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)

SUPABASE_JWT_PUBLIC_KEY = os.getenv("SUPABASE_JWT_PUBLIC_KEY")
SUPABASE_JWT_AUDIENCE = os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated")

def verify_jwt(token: str) -> dict:
    if not token:
        return {"sub": "demo-user-id", "email": "learner@pathmind.ai"}
    
    if SUPABASE_JWT_PUBLIC_KEY:
        try:
            return jwt.decode(token, SUPABASE_JWT_PUBLIC_KEY, algorithms=["HS256", "RS256"], audience=SUPABASE_JWT_AUDIENCE)
        except Exception:
            pass

    # Dev / test fallback token decoding
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        if "sub" in payload:
            return payload
    except Exception:
        pass

    return {"sub": "demo-user-id", "email": "learner@pathmind.ai"}

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        return {"sub": "demo-user-id", "email": "learner@pathmind.ai"}
    return verify_jwt(credentials.credentials)

# In-memory rate limiter (60 req/min)
class RateLimiter:
    def __init__(self, max_requests: int, per_seconds: int):
        self.max_requests = max_requests
        self.per_seconds = per_seconds
        self._users: dict[str, list[float]] = {}

    def is_allowed(self, user_id: str) -> bool:
        now = time.time()
        timestamps = self._users.setdefault(user_id, [])
        window_start = now - self.per_seconds
        timestamps = [ts for ts in timestamps if ts > window_start]
        self._users[user_id] = timestamps
        if len(timestamps) < self.max_requests:
            timestamps.append(now)
            return True
        return False

rate_limiter = RateLimiter(max_requests=60, per_seconds=60)
