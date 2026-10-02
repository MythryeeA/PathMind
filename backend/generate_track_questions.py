import sqlite3
import uuid
import json
import os
import requests
from ai.orchestrator import orchestrator

DB_PATH = "d:/PathMind/pathmind.db"

def generate_questions_for_tracks():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get nodes for ml_foundations and deep_learning
    cursor.execute("SELECT id, title, track FROM concept_nodes WHERE track IN ('ml_foundations', 'deep_learning') ORDER BY sort_order ASC")
    nodes = cursor.fetchall()

    print(f"Targeting {len(nodes)} nodes across ML Foundations and Deep Learning...")

    total_inserted = 0

    for node in nodes:
        node_id = node["id"]
        node_title = node["title"]

        # Fetch misconceptions for node
        cursor.execute("SELECT id, wrong_belief FROM misconceptions WHERE node_id = ?", (node_id,))
        misconceptions = [dict(r) for r in cursor.fetchall()]
        if not misconceptions:
            misconceptions = [{"id": "m_overfit_size", "wrong_belief": "Default wrong belief"}]

        # Generate 5 questions per node (difficulty 1 to 5)
        for diff in range(1, 6):
            q_id = str(uuid.uuid4())
            try:
                generated = orchestrator.generate_question(
                    node_id=node_id,
                    node_title=node_title,
                    difficulty=diff,
                    misconceptions=misconceptions,
                    recent_stems=[]
                )
                
                cursor.execute(
                    """INSERT INTO questions (id, node_id, difficulty, type, stem, options, correct_option_id, rationale, source, reviewed)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        q_id,
                        node_id,
                        diff,
                        "mcq",
                        generated.stem,
                        json.dumps([opt.model_dump() for opt in generated.options]),
                        generated.correct_option_id,
                        generated.rationale,
                        "generated",
                        0  # reviewed = false
                    )
                )
                total_inserted += 1
            except Exception as e:
                print(f"Error generating Q for {node_id} diff {diff}: {e}")

    conn.commit()

    cursor.execute("SELECT count(*) FROM questions")
    final_count = cursor.fetchone()[0]
    print("==================================================")
    print(f"GENERATION COMPLETE!")
    print(f"Inserted: {total_inserted} new questions")
    print(f"Final Total Questions Row Count: {final_count}")
    print("==================================================")

    conn.close()

if __name__ == "__main__":
    generate_questions_for_tracks()
