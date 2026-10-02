import sqlite3
import re
import os

db_path = "d:/PathMind/pathmind.db"
if os.path.exists(db_path):
    os.remove(db_path)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def clean_sql_for_sqlite(sql: str) -> str:
    # Remove Postgres extension statements & RLS
    sql = re.sub(r'CREATE EXTENSION[^;]+;', '', sql, flags=re.IGNORECASE)
    sql = re.sub(r'ALTER TABLE[^;]+ENABLE ROW LEVEL SECURITY;', '', sql, flags=re.IGNORECASE)
    sql = re.sub(r'CREATE POLICY[^;]+;', '', sql, flags=re.IGNORECASE)
    
    # Replace types and defaults cleanly for SQLite
    sql = re.sub(r'DEFAULT uuid_generate_v4\(\)', '', sql, flags=re.IGNORECASE)
    sql = re.sub(r'DEFAULT now\(\)', 'DEFAULT CURRENT_TIMESTAMP', sql, flags=re.IGNORECASE)
    sql = re.sub(r'UUID PRIMARY KEY', 'TEXT PRIMARY KEY', sql, flags=re.IGNORECASE)
    sql = re.sub(r'UUID', 'TEXT', sql, flags=re.IGNORECASE)
    sql = re.sub(r'TIMESTAMPTZ', 'TEXT', sql, flags=re.IGNORECASE)
    sql = re.sub(r'TEXT\[\]', 'TEXT', sql, flags=re.IGNORECASE)
    sql = re.sub(r'JSONB', 'TEXT', sql, flags=re.IGNORECASE)
    sql = re.sub(r'BIGSERIAL', 'INTEGER', sql, flags=re.IGNORECASE)
    sql = re.sub(r'REAL', 'REAL', sql, flags=re.IGNORECASE)
    sql = re.sub(r'::jsonb', '', sql, flags=re.IGNORECASE)
    sql = re.sub(r"'::jsonb", "'", sql, flags=re.IGNORECASE)
    sql = re.sub(r"':jsonb", "'", sql, flags=re.IGNORECASE)
    sql = re.sub(r':jsonb', '', sql, flags=re.IGNORECASE)
    sql = re.sub(r'ON CONFLICT\s*\([^)]+\)\s*DO UPDATE SET[^;]+', '', sql, flags=re.IGNORECASE)
    sql = re.sub(r'ON CONFLICT\s*\([^)]+\)\s*DO NOTHING', '', sql, flags=re.IGNORECASE)
    return sql

migrations = [
    "supabase/migrations/001_init.sql",
    "supabase/migrations/002_rls.sql",
    "supabase/migrations/003_seed.sql"
]

for migration_file in migrations:
    with open(migration_file, "r", encoding="utf-8") as f:
        raw_sql = f.read()
    cleaned = clean_sql_for_sqlite(raw_sql)
    
    statements = []
    current = []
    in_string = False
    quote_char = None
    
    for char in cleaned:
        if char in ("'", '"'):
            if not in_string:
                in_string = True
                quote_char = char
            elif char == quote_char:
                in_string = False
                quote_char = None
        if char == ';' and not in_string:
            stmt = "".join(current).strip()
            if stmt:
                statements.append(stmt)
            current = []
        else:
            current.append(char)
    if current:
        stmt = "".join(current).strip()
        if stmt:
            statements.append(stmt)
            
    for stmt in statements:
        lines = [line for line in stmt.splitlines() if not line.strip().startswith("--")]
        clean_stmt = "\n".join(lines).strip()
        if not clean_stmt:
            continue
        try:
            cursor.execute(clean_stmt)
        except Exception as e:
            print(f"Error on [{migration_file}]: {e}\nStatement was:\n{clean_stmt[:150]}...\n")

conn.commit()

tables = [
    "concept_nodes",
    "misconceptions",
    "questions",
    "sessions",
    "attempts",
    "socratic_turns",
    "mastery",
    "eval_runs",
    "llm_usage"
]

print("\n==================================================")
print("SUPABASE / POSTGRES SCHEMA MIGRATION ROW COUNTS")
print("==================================================")
for table in tables:
    cursor.execute(f"SELECT count(*) FROM {table}")
    count = cursor.fetchone()[0]
    print(f"Table '{table}': {count} rows")
print("==================================================\n")

conn.close()
