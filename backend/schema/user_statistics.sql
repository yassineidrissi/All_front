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
    tfft_ms INT,
    ipq_score NUMERIC(5,2),
    openai_ms INT,
    elevenlabs_ms INT,
    lip_sync_ms INT,
    audio_encode_ms INT,
    transcript_ms INT,
    created_at TIMESTAMP DEFAULT NOW()
);
