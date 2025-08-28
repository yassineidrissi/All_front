-- Chat sessions
CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    user_prompt TEXT,
    ai_prompt TEXT,
    user_score NUMERIC(4,2), -- allows values like 0.00 to 99.99
    ai_score NUMERIC(4,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Simulation sessions
CREATE TABLE simulation_sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT,
    prompt_length INT,
    time_spent_seconds INT,
    created_at TIMESTAMP DEFAULT NOW()
);
