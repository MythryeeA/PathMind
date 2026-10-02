import requests
import json
import uuid

SUPABASE_URL = "https://nchoalhcumzykgqauyjd.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jaG9hbGhjdW16eWtncWF1eWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MjcyNDcsImV4cCI6MjEwNjUwMzI0N30.He__9Yk-tFtT9L8QhmVTmT4sBg4TA3t-oGAH2zgZdqU"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jaG9hbGhjdW16eWtncWF1eWpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDkyNzI0NywiZXhwIjoyMTA2NTAzMjQ3fQ.R3ZdwH7pbwYx748o6L-CT6U0Ip-5LDV7wdaayo4H3uU"

def get_or_create_user(email: str, password: str):
    """Creates a confirmed user or logs in to return (user_id, access_token)."""
    admin_headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    # Try creating user via Admin API
    requests.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=admin_headers,
        json={"email": email, "password": password, "email_confirm": True}
    )
    
    # Login as the user to get real authenticated JWT
    auth_headers = {
        "apikey": ANON_KEY,
        "Content-Type": "application/json"
    }
    login_resp = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers=auth_headers,
        json={"email": email, "password": password}
    )
    data = login_resp.json()
    user_id = data["user"]["id"]
    access_token = data["access_token"]
    return user_id, access_token

def get_valid_question_id():
    headers = {"apikey": ANON_KEY}
    r = requests.get(f"{SUPABASE_URL}/rest/v1/questions?select=id&limit=1", headers=headers)
    return r.json()[0]["id"]

def insert_attempt(user_id: str, access_token: str, question_id: str, confidence: int):
    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    payload = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "question_id": question_id,
        "is_correct": False,
        "confidence": confidence,
        "time_ms": 3200,
        "is_blind_spot": (confidence >= 4)
    }
    resp = requests.post(f"{SUPABASE_URL}/rest/v1/attempts", headers=headers, json=payload)
    return resp.json()

def query_attempts(access_token: str):
    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {access_token}"
    }
    resp = requests.get(f"{SUPABASE_URL}/rest/v1/attempts?select=id,user_id,confidence,is_blind_spot", headers=headers)
    return resp.json()

def run_rls_test():
    print("==================================================================")
    print(" SUPABASE ROW LEVEL SECURITY (RLS) VERIFICATION TEST")
    print("==================================================================\n")

    # Step 1: Create 2 different authenticated users
    print("[1/3] Creating and authenticating User A and User B on Supabase...")
    user_a_id, token_a = get_or_create_user("user_a_test@pathmind.ai", "PasswordA123!")
    user_b_id, token_b = get_or_create_user("user_b_test@pathmind.ai", "PasswordB123!")
    print(f"User A ID: {user_a_id}")
    print(f"User B ID: {user_b_id}\n")

    # Step 2: Insert attempts
    question_id = get_valid_question_id()
    print(f"[2/3] User A & User B inserting attempts for Question ID: {question_id}...")
    attempt_a = insert_attempt(user_a_id, token_a, question_id, confidence=5)
    attempt_b = insert_attempt(user_b_id, token_b, question_id, confidence=2)

    print("User A Inserted Attempt Record:")
    print(json.dumps(attempt_a, indent=2))
    print("\nUser B Inserted Attempt Record:")
    print(json.dumps(attempt_b, indent=2))
    print("\n------------------------------------------------------------------\n")

    # Step 3: Query as User A and Query as User B
    print("[3/3] Querying `attempts` table as User A (Token A) and User B (Token B)...")
    results_a = query_attempts(token_a)
    results_b = query_attempts(token_b)

    print("\n>>> ACTUAL QUERY RESULT FOR USER A (Token A):")
    print(json.dumps(results_a, indent=2))

    print("\n>>> ACTUAL QUERY RESULT FOR USER B (Token B):")
    print(json.dumps(results_b, indent=2))

    # Verification logic
    user_a_saw_b = any(row.get("user_id") == user_b_id for row in results_a)
    user_b_saw_a = any(row.get("user_id") == user_a_id for row in results_b)

    print("\n==================================================================")
    if not user_a_saw_b and not user_b_saw_a and len(results_a) > 0 and len(results_b) > 0:
        print(" SUCCESS: Row Level Security (RLS) is working perfectly!")
        print(" - User A can ONLY see their own attempts.")
        print(" - User B can ONLY see their own attempts.")
        print(" - Cross-user data visibility is 0 (fully isolated).")
    else:
        print(" RLS ISOLATION FAILED!")
    print("==================================================================")

if __name__ == "__main__":
    run_rls_test()
