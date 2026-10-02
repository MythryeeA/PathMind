"""
PathMind Auth & API Connectivity Verification Script
Checks FastAPI health, CORS preflight handling, and Supabase auth service connectivity.
"""
import sys
import json
import urllib.request
import urllib.error

def verify_all():
    print("=" * 60)
    print(" PathMind Auth & API Connectivity Verification")
    print("=" * 60)

    all_passed = True

    # 1. Supabase Auth Health Check
    supabase_url = "https://nchoalhcumzykgqauyjd.supabase.co"
    anon_key = (
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
        "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jaG9hbGhjdW16eWtncWF1eWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MjcyNDcsImV4cCI6MjEwNjUwMzI0N30."
        "He__9Yk-tFtT9L8QhmVTmT4sBg4TA3t-oGAH2zgZdqU"
    )

    print("\n[1/3] Testing Supabase Live Auth Endpoint...")
    try:
        health_req = urllib.request.Request(
            f"{supabase_url}/auth/v1/health",
            headers={"apikey": anon_key}
        )
        with urllib.request.urlopen(health_req, timeout=8) as res:
            data = json.loads(res.read().decode())
            print(f"  [OK] Supabase Auth Reachable: HTTP {res.status}")
            print(f"       Service Name: {data.get('name', 'GoTrue')}, Version: {data.get('version')}")
    except Exception as e:
        print(f"  [FAIL] Supabase Auth Failed: {e}")
        all_passed = False

    # 2. Supabase Auth API Endpoint Check (password auth ping)
    print("\n[2/3] Testing Supabase Auth Password Endpoint...")
    try:
        auth_req = urllib.request.Request(
            f"{supabase_url}/auth/v1/token?grant_type=password",
            data=json.dumps({"email": "ping_check@pathmind.ai", "password": "dummy_password_ping"}).encode("utf-8"),
            headers={"apikey": anon_key, "Content-Type": "application/json"}
        )
        with urllib.request.urlopen(auth_req, timeout=8) as res:
            print(f"  [OK] Supabase Token Endpoint Active: HTTP {res.status}")
    except urllib.error.HTTPError as e:
        # 400 is expected for non-existent dummy credentials and proves endpoint is active and processing requests
        if e.code == 400:
            print(f"  [OK] Supabase Token Endpoint Active: HTTP {e.code} (Successfully processed auth request)")
        else:
            print(f"  [WARN] Supabase Token Endpoint returned HTTP {e.code}")
    except Exception as e:
        print(f"  [FAIL] Supabase Token Endpoint Connection Failed: {e}")
        all_passed = False

    # 3. FastAPI Local Backend Check via TestClient
    print("\n[3/3] Testing FastAPI Health and CORS Preflight...")
    try:
        from app.main import app
        from starlette.testclient import TestClient

        client = TestClient(app)

        # GET /healthz
        res_get = client.get("/healthz")
        if res_get.status_code == 200:
            print(f"  [OK] GET /healthz: HTTP 200 {res_get.json()}")
        else:
            print(f"  [FAIL] GET /healthz Failed: HTTP {res_get.status_code}")
            all_passed = False

        # OPTIONS /healthz with Vercel origin
        res_opt = client.options(
            "/healthz",
            headers={
                "Origin": "https://pathmind.vercel.app",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization,content-type"
            }
        )
        allow_origin = res_opt.headers.get("access-control-allow-origin")
        allow_methods = res_opt.headers.get("access-control-allow-methods")
        allow_headers = res_opt.headers.get("access-control-allow-headers")
        allow_creds = res_opt.headers.get("access-control-allow-credentials")

        print(f"  [OK] OPTIONS Preflight: HTTP {res_opt.status_code}")
        print(f"       Access-Control-Allow-Origin: {allow_origin}")
        print(f"       Access-Control-Allow-Methods: {allow_methods}")
        print(f"       Access-Control-Allow-Headers: {allow_headers}")
        print(f"       Access-Control-Allow-Credentials: {allow_creds}")

        assert res_opt.status_code == 200
        assert allow_origin in ("*", "https://pathmind.vercel.app")
        assert "authorization" in allow_headers.lower()
        print("  [OK] CORS & Preflight verified successfully without interference!")

    except Exception as e:
        print(f"  [FAIL] FastAPI Local Check Failed: {e}")
        all_passed = False

    print("\n" + "=" * 60)
    if all_passed:
        print(" All checks passed! Authentication and API connectivity ready.")
    else:
        print(" One or more checks failed. Please inspect logs above.")
    print("=" * 60)

    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(verify_all())
