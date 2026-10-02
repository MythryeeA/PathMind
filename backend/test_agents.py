import json
from ai.orchestrator import orchestrator

def run_agent_tests():
    print("==================================================================")
    print(" PATHMIND AI AGENT HARNESS TEST (PRD SECTION 5)")
    print("==================================================================\n")

    # 1. Agent 1: Question Agent
    print("[1/4] TESTING AGENT 1: QUESTION AGENT (Generate & Verify)...")
    q_out = orchestrator.generate_question(
        node_id="overfitting",
        node_title="Overfitting and Underfitting",
        difficulty=3,
        misconceptions=[
            {
                "id": "m_overfit_size",
                "wrong_belief": "Overfitting only occurs when the dataset is too small."
            }
        ],
        recent_stems=[]
    )
    print("Result (QuestionOutput Pydantic Model):")
    print(json.dumps(q_out.model_dump(), indent=2))
    print("\n------------------------------------------------------------------\n")

    # 2. Agent 2: Misconception Classifier
    print("[2/4] TESTING AGENT 2: MISCONCEPTION CLASSIFIER...")
    c_out = orchestrator.classify_misconception(
        question_stem="Why does your validation error spike while training error keeps decreasing?",
        correct_answer="Overfitting occurs because high model capacity memorizes training noise.",
        learner_answer="Because the dataset has too small size so model cannot fit it",
        candidate_misconceptions=[
            {
                "id": "m_overfit_size",
                "wrong_belief": "Overfitting only occurs when the dataset is too small."
            }
        ]
    )
    print("Result (ClassifierOutput Pydantic Model):")
    print(json.dumps(c_out.model_dump(), indent=2))
    print("\n------------------------------------------------------------------\n")

    # 3. Agent 3: Socratic Tutor
    print("[3/4] TESTING AGENT 3: SOCRATIC TUTOR...")
    t_out = orchestrator.tutor_turn(
        misconception={
            "wrong_belief": "Overfitting only occurs when the dataset is too small.",
            "correct_idea": "Overfitting happens when model capacity exceeds dataset complexity.",
            "socratic_seed": "If a complex model memorizes 10,000 noise samples, how will validation accuracy compare?"
        },
        transcript=[
            {"role": "learner", "content": "I think the model is just too big for small datasets."}
        ],
        turn=1,
        style="analogy"
    )
    print("Result (SocraticTutorOutput Pydantic Model):")
    print(json.dumps(t_out.model_dump(), indent=2))
    print("\n------------------------------------------------------------------\n")

    # 4. Agent 4: Multi-Style Explainer
    print("[4/4] TESTING AGENT 4: EXPLAINER (Style-Switched)...")
    e_out = orchestrator.explain_concept(
        node_title="Overfitting and Underfitting",
        node_description="High variance vs high bias tradeoff in deep neural networks.",
        styles_tried=["analogy"],
        misconception={
            "wrong_belief": "Overfitting only occurs when the dataset is too small."
        }
    )
    print("Result (ExplainerOutput Pydantic Model):")
    print(json.dumps(e_out.model_dump(), indent=2))
    print("\n==================================================================")
    print(" ALL 4 AGENTS EXECUTED AND VALIDATED SUCCESSFULLY!")
    print("==================================================================")

if __name__ == "__main__":
    run_agent_tests()
