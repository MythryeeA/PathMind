import requests
import sqlite3
import json

SUPABASE_URL = "https://nchoalhcumzykgqauyjd.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jaG9hbGhjdW16eWtncWF1eWpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDkyNzI0NywiZXhwIjoyMTA2NTAzMjQ3fQ.R3ZdwH7pbwYx748o6L-CT6U0Ip-5LDV7wdaayo4H3uU"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

conn = sqlite3.connect("d:/PathMind/pathmind.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# 1. Seed Concept Nodes
cursor.execute("SELECT id, track, title, description, sort_order FROM concept_nodes")
nodes = [dict(r) for r in cursor.fetchall()]
for n in nodes:
    n["prerequisites"] = []

r = requests.post(f"{SUPABASE_URL}/rest/v1/concept_nodes", headers=headers, json=nodes)
print(f"concept_nodes seed status: {r.status_code}")

# 2. Seed Misconceptions
cursor.execute("SELECT id, node_id, title, wrong_belief, correct_idea, socratic_seed FROM misconceptions")
miscs = [dict(r) for r in cursor.fetchall()]
r = requests.post(f"{SUPABASE_URL}/rest/v1/misconceptions", headers=headers, json=miscs)
print(f"misconceptions seed status: {r.status_code}")

# 3. Seed Questions
cursor.execute("SELECT id, node_id, difficulty, type, stem, options, correct_option_id, rationale, source, reviewed FROM questions")
questions = []
for r in cursor.fetchall():
    q = dict(r)
    if isinstance(q["options"], str):
        try:
            q["options"] = json.loads(q["options"])
        except Exception:
            pass
    q["reviewed"] = bool(q["reviewed"])
    questions.append(q)

r = requests.post(f"{SUPABASE_URL}/rest/v1/questions", headers=headers, json=questions)
print(f"questions seed status: {r.status_code}")

conn.close()

# Verify live row counts
for table in ['concept_nodes', 'misconceptions', 'questions']:
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?select=count", headers=headers)
    print(f"Live {table} row count: {r.json()}")
