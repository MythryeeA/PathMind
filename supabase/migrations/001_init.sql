-- 001_init.sql – Core Schema for PathMind (Postgres / Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Concept nodes
CREATE TABLE IF NOT EXISTS concept_nodes (
    id TEXT PRIMARY KEY,
    track TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    prerequisites TEXT[] DEFAULT '{}',
    sort_order INT
);

-- 2. Misconceptions
CREATE TABLE IF NOT EXISTS misconceptions (
    id TEXT PRIMARY KEY,
    node_id TEXT REFERENCES concept_nodes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    wrong_belief TEXT NOT NULL,
    correct_idea TEXT NOT NULL,
    socratic_seed TEXT
);

-- 3. Questions
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id TEXT REFERENCES concept_nodes(id) ON DELETE CASCADE,
    difficulty INT CHECK (difficulty BETWEEN 1 AND 5),
    type TEXT CHECK (type IN ('mcq','short')),
    stem TEXT NOT NULL,
    options JSONB,
    correct_option_id TEXT,
    rationale TEXT,
    source TEXT CHECK (source IN ('seed','generated')),
    reviewed BOOLEAN DEFAULT FALSE
);

-- 4. Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    track TEXT,
    mode TEXT CHECK (mode IN ('diagnostic','practice','pilot_pre','pilot_post')),
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ
);

-- 5. Attempts
CREATE TABLE IF NOT EXISTS attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    answer JSONB,
    is_correct BOOLEAN,
    confidence INT CHECK (confidence BETWEEN 1 AND 5),
    time_ms INT,
    misconception_id TEXT,
    classifier_confidence REAL,
    is_blind_spot BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Socratic turns
CREATE TABLE IF NOT EXISTS socratic_turns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
    turn INT,
    role TEXT CHECK (role IN ('tutor','learner')),
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Mastery
CREATE TABLE IF NOT EXISTS mastery (
    user_id UUID NOT NULL,
    node_id TEXT REFERENCES concept_nodes(id) ON DELETE CASCADE,
    score REAL DEFAULT 0.3,
    calibration REAL DEFAULT 0,
    fail_streak INT DEFAULT 0,
    preferred_style TEXT,
    styles_tried TEXT[] DEFAULT '{}',
    last_seen TIMESTAMPTZ,
    next_review TIMESTAMPTZ,
    PRIMARY KEY (user_id, node_id)
);

-- 8. Evaluation runs
CREATE TABLE IF NOT EXISTS eval_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    node_id TEXT REFERENCES concept_nodes(id),
    pre_score REAL,
    post_score REAL,
    seconds_to_mastery INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. LLM usage tracking
CREATE TABLE IF NOT EXISTS llm_usage (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    agent TEXT,
    model TEXT,
    input_tokens INT,
    output_tokens INT,
    created_at TIMESTAMPTZ DEFAULT now()
);
