-- 002_rls.sql – Row Level Security Policies for PathMind

-- Enable RLS on all tables
ALTER TABLE concept_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE misconceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE socratic_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE eval_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_usage ENABLE ROW LEVEL SECURITY;

-- 1. Read-only policies for public/authenticated users
CREATE POLICY "Allow read access to concept_nodes"
    ON concept_nodes FOR SELECT
    USING (true);

CREATE POLICY "Allow read access to misconceptions"
    ON misconceptions FOR SELECT
    USING (true);

CREATE POLICY "Allow read access to questions"
    ON questions FOR SELECT
    USING (true);

-- 2. User-owned table RLS policies (user_id = auth.uid())
CREATE POLICY "User sessions full access"
    ON sessions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User attempts full access"
    ON attempts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User socratic_turns full access"
    ON socratic_turns FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM attempts
            WHERE attempts.id = socratic_turns.attempt_id
            AND attempts.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM attempts
            WHERE attempts.id = socratic_turns.attempt_id
            AND attempts.user_id = auth.uid()
        )
    );

CREATE POLICY "User mastery full access"
    ON mastery FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User eval_runs full access"
    ON eval_runs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User llm_usage full access"
    ON llm_usage FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
