import express from "express"
import OpenAI from "openai/index.mjs";
import { calculateScore } from "../utils/scoring.js";
import pool from "../db.js";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const router = express.Router()

router.post('/api/auth/best_prompt', async (req, res) => {
    try {
        const { userId, prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Step 1: Optimize the prompt
        const optimizationResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a prompt optimization expert. Rewrite the given medical prompt to be more specific, clear, and effective. Focus on adding context, specificity, and proper framing. Return ONLY the optimized prompt, nothing else."
                },
                { role: "user", content: `Original prompt: "${prompt}"` }
            ],
            temperature: 0.7,
            max_tokens: 300
        });

        const optimizedPrompt = optimizationResponse.choices[0].message.content.trim();

        // Step 2: Get responses for both prompts (in parallel)
        const [originalResponse, optimizedResponse] = await Promise.all([
            openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: "You are a helpful medical assistant providing information about diagnoses and medical conditions." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 500
            }),
            openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    { role: "system", content: "You are a helpful medical assistant providing information about diagnoses and medical conditions." },
                    { role: "user", content: optimizedPrompt }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        ]);

        const originalText = originalResponse.choices[0].message.content.trim();
        const optimizedText = optimizedResponse.choices[0].message.content.trim();

        // Step 3: Score both
        const originalScore = calculateScore(prompt, originalText);
        const optimizedScore = calculateScore(optimizedPrompt, optimizedText);

        // Step 4: Save to DB
        await pool.query(
            `INSERT INTO chat_sessions (user_id, user_prompt, ai_prompt, user_score, ai_score)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                userId || null,
                prompt,           // only raw user prompt
                optimizedPrompt,  // the optimized version
                originalScore,
                optimizedScore
            ]
        );

        // Step 5: Return proper JSON
        res.json({
            original: {
                prompt: prompt,
                response: originalText,
                score: originalScore
            },
            optimized: {
                prompt: optimizedPrompt,
                response: optimizedText,
                score: optimizedScore
            }
        });

    } catch (error) {
        console.error('Error in /api/auth/best_prompt:', error);
        res.status(500).json({
            error: error.message || 'Failed to process best prompt request'
        });
    }
});

router.post('/api/auth/simulation', async (req, res) => {
    try {
        const { userId, prompt, timeSpentSeconds } = req.body;

        if (!prompt || prompt.trim().length === 0) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        if (timeSpentSeconds === undefined || isNaN(timeSpentSeconds) || timeSpentSeconds < 0) {
            return res.status(400).json({ error: 'Valid timeSpentSeconds is required (>= 0)' });
        }

        const promptLength = prompt.length;

        // ✅ Enforce userId
        if (!userId) {
            return res.status(401).json({ error: 'User ID is required (from JWT or body)' });
        }

        await pool.query(
            `INSERT INTO simulation_sessions (user_id, prompt, prompt_length, time_spent_seconds)
             VALUES ($1, $2, $3, $4)`,
            [userId, prompt, promptLength, timeSpentSeconds]
        );

        res.json({
            success: true,
            data: { userId, prompt, promptLength, timeSpentSeconds }
        });

    } catch (error) {
        console.error('❌ Error in /api/auth/simulation:', error);
        res.status(500).json({
            error: error.message || 'Failed to save simulation'
        });
    }
});

router.get("/api/users/stats", async (req, res) => {
    try {
        const query = `
      SELECT 
          u.id,
          u.email,
          u.name,
          u.is_admin,
          u.is_active,
          u.created_at,
          u.updated_at,
          
          COUNT(DISTINCT c.id) AS total_chat_sessions,
          AVG(c.user_score) AS avg_user_score,
          AVG(c.ai_score) AS avg_ai_score,
          
          COUNT(DISTINCT s.id) AS total_simulations,
          COALESCE(SUM(s.prompt_length), 0) AS total_prompt_length,
          COALESCE(SUM(s.time_spent_seconds), 0) AS total_time_spent_seconds,

          CASE
              WHEN COALESCE(SUM(s.time_spent_seconds), 0) < 60
                  THEN COALESCE(SUM(s.time_spent_seconds), 0) || ' seconds'
              WHEN COALESCE(SUM(s.time_spent_seconds), 0) < 3600
                  THEN ROUND(SUM(s.time_spent_seconds) / 60.0, 2) || ' minutes'
              WHEN COALESCE(SUM(s.time_spent_seconds), 0) < 86400
                  THEN ROUND(SUM(s.time_spent_seconds) / 3600.0, 2) || ' hours'
              ELSE
                  ROUND(SUM(s.time_spent_seconds) / 86400.0, 2) || ' days'
          END AS formatted_time_spent

      FROM users u
      LEFT JOIN chat_sessions c ON u.id = c.user_id
      LEFT JOIN simulation_sessions s ON u.id = s.user_id
      WHERE u.is_admin = false
      GROUP BY u.id
      ORDER BY u.created_at DESC;
    `;

        const { rows } = await pool.query(query);

        res.json(rows);
    } catch (err) {
        console.error("Error fetching users with stats:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router