1. Product

PathMind is a responsive web app (React frontend + FastAPI backend service) that teaches AI/ML. It does not only mark answers wrong — it works out why the learner is wrong (which specific misconception), asks guided Socratic questions to let them self-correct, re-explains in a different style when the same concept fails twice, and shows a live mastery skill tree.

Problem: AI/ML learners keep hitting the same conceptual traps (overfitting, gradient descent, precision vs recall, attention, RAG vs fine-tuning). Static courses and generic chatbots either hand over the answer or repeat an explanation that already failed. No 1:1 mentor catches the specific misunderstanding.

Users: undergrad AI/DS students, bootcamp learners, self-taught engineers prepping for exams/interviews.

Novelty (must be visible in the product and the demo):

Misconception-aware diagnosis against a curated taxonomy (not just right/wrong).
Confidence-calibrated difficulty: learner rates confidence before each answer; "confidently wrong" answers are flagged as blind spots and prioritised.
Socratic follow-ups instead of giving the answer (turn-capped, then reveal).
Multi-style re-explanation (analogy / math / code) triggered after 2 failures on a concept; remember which style worked.
Live mastery skill tree across ML Foundations → Deep Learning → NLP & GenAI → Agentic AI.
Human approval: AI proposes level-ups / next topic; learner confirms.
Built-in evaluation harness (pre/post quiz, time-to-mastery, misconception-classifier accuracy) so claims in the deck are measured, not asserted.


2. User flow (end to end)
Sign up / log in (email + Google).
Choose a track or "diagnose me" (all tracks).
Diagnostic (6–8 adaptive questions per track). Before submitting each answer the learner sets confidence 1–5.
Server grades. If wrong → Misconception Classifier tags the misconception (or "careless slip").
Socratic loop (max 3 turns): tutor asks a guiding question targeted at the tagged misconception; learner replies; after turn cap or on request → reveal correct answer + short rationale.
If the same concept fails twice → Explainer regenerates the concept in a different style (analogy → math → code) than previously tried.
Mastery updates (per concept node). Blind spots and review-due nodes are recomputed.
Path Planner proposes the next step ("Level up to difficulty 3?" / "Move to Backpropagation?"). Learner approves or overrides.
Dashboard shows skill tree colored by mastery, blind-spot list, review-due list, session history.
Pilot/eval mode: pre-test → learn → post-test on a chosen concept, with timing.


3. Architecture
React (Vite + TS + Tailwind + shadcn/ui + React Flow)
        │  HTTPS, JWT (Supabase Auth)
        ▼
FastAPI backend (Python 3.12, Pydantic v2)
  ├─ routers: auth-guard, topics, sessions, questions, answers, tutor, mastery, eval
  ├─ services: mastery_engine, path_planner (deterministic), question_bank
  ├─ ai/: orchestrator + 4 LLM agents (below) + guardrails + cost meter
  └─ db access via SQLAlchemy/asyncpg
        │
        ▼
Postgres (Supabase) with Row Level Security      Claude API (server-side only)
Deploy: frontend on Vercel/Netlify, backend as Docker container on Render/Railway/Fly, DB on Supabase. Health endpoint /healthz. GitHub Actions: lint + tests on every push.
Model names come from env vars (MODEL_FAST, MODEL_TUTOR), never hard-coded. Default: claude-haiku-4-5-20251001 for classification/verification, claude-sonnet-5 for tutoring/explaining.


4. Data model (Postgres)
sql
create table concept_nodes(
  id text primary key, track text not null, title text not null,
  description text, prerequisites text[] default '{}', sort_order int
);
create table misconceptions(
  id text primary key, node_id text references concept_nodes(id),
  title text not null, wrong_belief text not null, correct_idea text not null,
  socratic_seed text  -- a guiding question to start from
);
create table questions(
  id uuid primary key default gen_random_uuid(),
  node_id text references concept_nodes(id), difficulty int check (difficulty between 1 and 5),
  type text check (type in ('mcq','short')), stem text not null,
  options jsonb,          -- [{id,text,misconception_id|null}]
  correct_option_id text, -- NEVER returned to client before reveal
  rationale text, source text check (source in ('seed','generated')),
  reviewed boolean default false
);
create table sessions(
  id uuid primary key default gen_random_uuid(), user_id uuid not null,
  track text, mode text check (mode in ('diagnostic','practice','pilot_pre','pilot_post')),
  started_at timestamptz default now(), ended_at timestamptz
);
create table attempts(
  id uuid primary key default gen_random_uuid(), session_id uuid references sessions(id),
  user_id uuid not null, question_id uuid references questions(id),
  answer jsonb, is_correct boolean, confidence int check (confidence between 1 and 5),
  time_ms int, misconception_id text, classifier_confidence real,
  is_blind_spot boolean default false, created_at timestamptz default now()
);
create table socratic_turns(
  id uuid primary key default gen_random_uuid(), attempt_id uuid references attempts(id),
  turn int, role text check (role in ('tutor','learner')), content text, created_at timestamptz default now()
);
create table mastery(
  user_id uuid, node_id text references concept_nodes(id),
  score real default 0.3, calibration real default 0, fail_streak int default 0,
  preferred_style text, styles_tried text[] default '{}',
  last_seen timestamptz, next_review timestamptz,
  primary key(user_id, node_id)
);
create table eval_runs(
  id uuid primary key default gen_random_uuid(), user_id uuid, node_id text,
  pre_score real, post_score real, seconds_to_mastery int, created_at timestamptz default now()
);
create table llm_usage(
  id bigserial primary key, user_id uuid, agent text, model text,
  input_tokens int, output_tokens int, created_at timestamptz default now()
);

RLS: every user-owned table (sessions, attempts, socratic_turns, mastery, eval_runs, llm_usage) allows select/insert/update only where user_id = auth.uid(). concept_nodes, misconceptions are read-only for authenticated users. questions.correct_option_id is read only through the backend service role.


5. AI agents (LLM roles inside one orchestrator — no external agent frameworks)

All agents: server-side only, no tools, structured JSON output validated with Pydantic, one retry on validation failure, then deterministic fallback. Learner text is untrusted data: always wrapped in <learner_input> tags and never concatenated into instructions.

Agent 1 — Question Agent (MODEL_FAST generate, MODEL_FAST verify)

Input: node, target difficulty, misconception list for that node, recent question stems (avoid repeats).
Output: {stem, options[{id,text,misconception_id|null}], correct_option_id, rationale}. Every distractor maps to a real misconception id — this makes classification deterministic for MCQs.
A second verifier call checks the keyed answer is unambiguously correct; reject otherwise. Prefer serving reviewed seed questions; generate at runtime only when the bank is exhausted for that node/difficulty.

Agent 2 — Misconception Classifier (MODEL_FAST)

Used for short-answer responses and for MCQ answers where the chosen distractor is ambiguous.
Input: question, correct answer, learner answer, candidate misconceptions (top ≤6 for that node).
Output: {misconception_id|null, confidence 0-1, evidence, kind: "conceptual"|"slip"|"unclear"}.
Below confidence 0.5 → treat as "unclear", no misconception is recorded.

Agent 3 — Socratic Tutor (MODEL_TUTOR)

Input: misconception (wrong_belief, correct_idea, socratic_seed), transcript, turn number, style.
Output: {message, hint_level 1-3, ready_to_reveal: bool}.
Rules: ask ONE guiding question or give one small counter-example; never state the correct answer before turn 3 or explicit "show me"; keep under 80 words.

Agent 4 — Explainer (MODEL_TUTOR)

Triggered when fail_streak >= 2 on a node. Picks a style not in styles_tried (analogy → math → code), else the best previous style.
Output: {style, explanation, check_question} (a quick follow-up MCQ id or stem to confirm understanding).
If the learner then answers correctly, store preferred_style.

Path Planner — deterministic code (not an LLM). LLM is used only to phrase a one-line "why this next" explanation. This keeps pacing predictable and testable.


6. Algorithms
Mastery update (per attempt): expected = sigmoid(k*(score - difficulty_norm)); score += lr * (correct - expected) with lr = 0.15; clamp 0–1. Slip-kind errors count at half weight.
Confidence calibration: if correct and confidence >= 4 → calibration +; if wrong and confidence >= 4 → is_blind_spot = true, mastery penalty ×1.5, node priority boost; if correct and confidence <= 2 → mild positive (underconfident).
Difficulty: next difficulty = round(score×4)+1, +1 if last 2 correct with confidence ≥ 3, −1 if last 2 wrong.
Review scheduling: next_review = now + interval(score) with intervals 1d / 3d / 7d / 14d by mastery bands; blind-spot nodes get the shortest interval.
Next-node selection: candidate nodes = prerequisites all ≥ 0.7 mastery; rank by (blind spot flag, low mastery, review due). Learner must approve the move.


7. API (all routes require a valid JWT except /healthz)
GET  /healthz
GET  /topics                      -> tracks + concept nodes + user mastery overlay
POST /sessions                    {track, mode}
GET  /sessions/{id}/next-question -> question WITHOUT correct_option_id
POST /answers                     {session_id, question_id, answer, confidence, time_ms}
                                  -> {is_correct, misconception?, blind_spot, socratic_start?}
POST /tutor/turn                  {attempt_id, learner_message?} -> tutor message
POST /tutor/explain               {node_id} -> explainer output
POST /path/propose                -> {proposal, rationale}
POST /path/approve                {proposal_id, approved}
GET  /mastery                     -> skill tree data, blind spots, review due
POST /eval/start | /eval/finish   pilot pre/post + timing
GET  /eval/classifier-report      -> accuracy on the labeled misconception test set


8. Frontend screens

Landing + auth · Track picker · Diagnostic · Practice (question card, 1–5 confidence slider shown before submit, Socratic chat panel, explanation style tabs, "Ready to level up?" approval modal) · Mastery dashboard (React Flow skill tree colored by mastery; blind-spot and review-due lists) · Pilot mode (pre → learn → post, live timer) · Eval report page for the demo. Design: clean, responsive (mobile-first), accessible (keyboard, contrast, aria labels), dark theme with gold accent to echo the BFW deck. Loading skeletons for every LLM call; streaming for tutor messages; clear error/retry states.


9. Security & production requirements
Auth: Supabase Auth; backend verifies JWT signature/expiry on every request; RLS on all user tables.
Secrets: Claude API key and Supabase service key only in backend env; .env.example committed, .env gitignored; no secrets in frontend bundle.
Answer integrity: correct_option_id never sent to the client before the answer is graded server-side.
Prompt-injection defenses: learner text tagged as data, agents have no tools, JSON schema validation on every output, tutor output checked so it does not leak system prompts or the keyed answer before reveal; length caps on all inputs.
Abuse/cost control: per-user rate limits (e.g., 60 req/min), daily token budget per user from llm_usage, max output tokens per agent, request timeouts, exponential backoff, circuit breaker with fallback to the seeded question bank.
Web hardening: CORS allowlist, HTTPS only, security headers (CSP, X-Content-Type-Options, frame-ancestors none), parameterized queries only, Pydantic validation on all bodies, generic error messages to client.
Privacy: store only what is needed (email, learning data); redact learner free-text from logs; account deletion endpoint that removes user rows.
Ops: structured JSON logs with request ids, /healthz, Sentry (optional), dependency audit (pip-audit, npm audit) in CI.
Testing: pytest for mastery engine, planner, guardrails; contract tests for each agent with mocked LLM; Playwright smoke test of the full learner flow.


10. Seed content
~45 concept nodes in 4 tracks: ML Foundations (~12), Deep Learning (~12), NLP & GenAI (~12), Agentic AI (~9), with prerequisite edges.
~30 misconceptions, each tied to a node. Starter examples: "overfitting only means the model is too big"; "epoch and iteration are the same"; "gradient descent always reaches the global minimum"; "high accuracy means a good model even on imbalanced data"; "precision and recall are interchangeable"; "attention is the same as human attention"; "temperature changes what the model knows"; "RAG and fine-tuning do the same thing"; "an agent is just a longer prompt"; "embeddings are one-hot vectors".
≥ 5 reviewed MCQs per node across difficulties 1–5 (generate offline with Agent 1, then the team reviews them: set reviewed = true).
Human task (not for the AI): the team hand-labels a set of 20 learner answers with the correct misconception id — this is the test set for the classifier accuracy claim in the deck.


11. Acceptance criteria
A new user can sign up, take a diagnostic, see a mastery map, get a Socratic follow-up on a wrong answer, get a style-switched explanation after two failures, approve a level-up, and see the dashboard update — end to end, in under 60 seconds of LLM latency per step.
Correct answers are never exposed to the client before grading (verified by a test).
Cross-user data access is impossible (RLS test with two users).
GET /eval/classifier-report returns accuracy on the labeled set; pilot mode produces pre/post scores and time-to-mastery.
CI green; app deployed at a public URL; README with setup, env vars, architecture diagram, and demo script.