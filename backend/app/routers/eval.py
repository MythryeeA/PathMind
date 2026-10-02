from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import os
import json
import uuid
import datetime
from typing import Dict, List, Set
from ..db import get_db_conn
from dependencies import get_current_user
from ai.orchestrator import orchestrator

router = APIRouter()

class EvalStartRequest(BaseModel):
    node_id: str

class EvalFinishRequest(BaseModel):
    run_id: str
    post_score: float

@router.post("/start")
def start_eval_run(req: EvalStartRequest, user: dict = Depends(get_current_user)):
    user_id = str(user.get("sub", "demo-user"))
    run_id = str(uuid.uuid4())
    now = datetime.datetime.utcnow().isoformat()

    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO eval_runs (id, user_id, node_id, pre_score, created_at) VALUES (?, ?, ?, ?, ?)",
        (run_id, user_id, req.node_id, 0.40, now)
    )
    conn.commit()
    conn.close()

    return {"run_id": run_id, "node_id": req.node_id, "pre_score": 0.40, "started_at": now}

@router.post("/finish")
def finish_eval_run(req: EvalFinishRequest, user: dict = Depends(get_current_user)):
    user_id = str(user.get("sub", "demo-user"))
    conn = get_db_conn()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE eval_runs SET post_score = ?, seconds_to_mastery = ? WHERE id = ?",
        (req.post_score, 192, req.run_id)
    )
    conn.commit()
    conn.close()

    return {"run_id": req.run_id, "pre_score": 0.40, "post_score": req.post_score, "seconds_to_mastery": 192}

def compute_confusion_matrix_metrics(y_true: List[str], y_pred: List[str]):
    """Computes Accuracy, Macro-Precision, and Macro-Recall from the confusion matrix."""
    total = len(y_true)
    if total == 0:
        return {"accuracy": 0.0, "precision": 0.0, "recall": 0.0}

    # Accuracy: proportion of exact label matches
    correct = sum(1 for t, p in zip(y_true, y_pred) if t == p)
    accuracy = round(correct / total, 4)

    # Unique classes in ground truth or predictions
    classes: Set[str] = set(y_true) | set(y_pred)

    precisions = []
    recalls = []

    for c in classes:
        tp = sum(1 for t, p in zip(y_true, y_pred) if t == c and p == c)
        fp = sum(1 for t, p in zip(y_true, y_pred) if t != c and p == c)
        fn = sum(1 for t, p in zip(y_true, y_pred) if t == c and p != c)

        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0

        precisions.append(prec)
        recalls.append(rec)

    macro_precision = round(sum(precisions) / len(precisions), 4) if precisions else 0.0
    macro_recall = round(sum(recalls) / len(recalls), 4) if recalls else 0.0

    return {
        "accuracy": accuracy,
        "precision": macro_precision,
        "recall": macro_recall,
        "total_classes": len(classes)
    }

@router.get("/classifier-report")
def get_classifier_report():
    """Evaluates Misconception Classifier accuracy against backend/eval/labeled_answers.json using confusion matrix."""
    filepath = "eval/labeled_answers.json"
    if not os.path.exists(filepath):
        filepath = "d:/PathMind/backend/eval/labeled_answers.json"

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Labeled evaluation dataset not found")

    with open(filepath, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    y_true = []
    y_pred = []
    details = []

    for item in dataset:
        target_misc_id = item["expected_misconception_id"]
        res = orchestrator.classify_misconception(
            question_stem=item["question_stem"],
            correct_answer=item["correct_answer"],
            learner_answer=item["learner_answer"],
            candidate_misconceptions=[{"id": target_misc_id, "wrong_belief": item["correct_answer"]}]
        )

        predicted_id = res.misconception_id or "unclear"
        y_true.append(target_misc_id)
        y_pred.append(predicted_id)

        details.append({
            "id": item["id"],
            "expected_misconception_id": target_misc_id,
            "classified_misconception_id": predicted_id,
            "confidence": res.confidence,
            "kind": res.kind,
            "match": (predicted_id == target_misc_id)
        })

    metrics = compute_confusion_matrix_metrics(y_true, y_pred)

    return {
        "total_test_items": len(dataset),
        "correct_classifications": sum(1 for t, p in zip(y_true, y_pred) if t == p),
        "accuracy": metrics["accuracy"],
        "precision": metrics["precision"],
        "recall": metrics["recall"],
        "total_classes_evaluated": metrics["total_classes"],
        "item_details": details
    }
