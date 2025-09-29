import express from "express"
import OpenAI from "openai/index.mjs";
import { calculateScore } from "../utils/scoring.js";
import pool from "../db.js";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const router = express.Router()

// Mounted under '/api' in server.js
router.post('/auth/best_prompt', async (req, res) => {
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

router.post('/auth/simulation', async (req, res) => {
    try {
        const { userId, prompt, timeSpentSeconds, timings = {}, ipqScore } = req.body;

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

        const {
            openai_ms = null,
            elevenlabs_ms = null,
            lip_sync_ms = null,
            audio_encode_ms = null,
            transcript_ms = null,
            tfft_ms = null,
        } = timings;

        await pool.query(
            `INSERT INTO simulation_sessions (user_id, prompt, prompt_length, time_spent_seconds, openai_ms, elevenlabs_ms, lip_sync_ms, audio_encode_ms, transcript_ms, tfft_ms, ipq_score)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                userId,
                prompt,
                promptLength,
                timeSpentSeconds,
                openai_ms,
                elevenlabs_ms,
                lip_sync_ms,
                audio_encode_ms,
                transcript_ms,
                tfft_ms,
                ipqScore ?? null,
            ]
        );

        res.json({
            success: true,
            data: {
                userId,
                prompt,
                promptLength,
                timeSpentSeconds,
                timings: {
                    openai_ms,
                    elevenlabs_ms,
                    lip_sync_ms,
                    audio_encode_ms,
                    transcript_ms,
                    tfft_ms,
                },
                ipqScore: ipqScore ?? null,
            }
        });

    } catch (error) {
        console.error('❌ Error in /api/auth/simulation:', error);
        res.status(500).json({
            error: error.message || 'Failed to save simulation'
        });
    }
});

router.get('/simulations', async (req, res) => {
    try {
        const query = `
            SELECT s.id, u.name, u.email, s.prompt, s.prompt_length, s.time_spent_seconds,
                   s.openai_ms, s.elevenlabs_ms, s.lip_sync_ms, s.audio_encode_ms, s.transcript_ms, s.tfft_ms,
                   s.ipq_score, s.created_at
            FROM simulation_sessions s
            JOIN users u ON u.id = s.user_id
            ORDER BY s.created_at DESC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching simulations:', error);
        res.status(500).json({ error: 'Failed to fetch simulations' });
    }
});

router.get('/chats', async (req, res) => {
    try {
        const query = `
            SELECT c.id, u.name, u.email, c.user_prompt, c.ai_prompt, c.user_score, c.ai_score, c.created_at
            FROM chat_sessions c
            JOIN users u ON u.id = c.user_id
            ORDER BY c.created_at DESC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
});

router.get("/users/stats", async (req, res) => {
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

router.get('/dashboard/summary', async (req, res) => {
    try {
        const { from, to } = req.query;
        
        // Build date filter parameters
        let params = [];
        let whereClause = '';
        
        if (from && to) {
            whereClause = 'WHERE created_at >= $1 AND created_at <= $2';
            params = [from, to];
        } else if (from) {
            whereClause = 'WHERE created_at >= $1';
            params = [from];
        } else if (to) {
            whereClause = 'WHERE created_at <= $1';
            params = [to];
        }

        // Get basic counts
        const totalUsersQuery = 'SELECT COUNT(*) as count FROM users WHERE is_admin = false';
        const { rows: userRows } = await pool.query(totalUsersQuery);
        const totalUsers = parseInt(userRows[0].count);

        // Get chat sessions stats
        const chatStatsQuery = `
            SELECT 
                COUNT(*) as total_sessions,
                AVG(user_score) as avg_user_score,
                AVG(ai_score) as avg_ai_score
            FROM chat_sessions 
            ${whereClause}
        `;
        const { rows: chatRows } = await pool.query(chatStatsQuery, params);
        const chatStats = chatRows[0];

        // Get simulation stats
        const simStatsQuery = `
            SELECT 
                COUNT(*) as total_sessions,
                AVG(ipq_score) as avg_ipq_score,
                SUM(time_spent_seconds) as total_time_seconds
            FROM simulation_sessions 
            ${whereClause}
        `;
        const { rows: simRows } = await pool.query(simStatsQuery, params);
        const simStats = simRows[0];

        // Get daily activity for the last 30 days
        const dailyQuery = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as sessions
            FROM (
                SELECT created_at FROM chat_sessions ${whereClause}
                UNION ALL
                SELECT created_at FROM simulation_sessions ${whereClause}
            ) combined
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        `;
        const { rows: dailyRows } = await pool.query(dailyQuery, params);

        res.json({
            totalUsers,
            totalChatSessions: parseInt(chatStats.total_sessions) || 0,
            totalSimulations: parseInt(simStats.total_sessions) || 0,
            avgUserScore: parseFloat(chatStats.avg_user_score) || 0,
            avgAiScore: parseFloat(chatStats.avg_ai_score) || 0,
            avgIpqScore: parseFloat(simStats.avg_ipq_score) || 0,
            totalTimeHours: (parseInt(simStats.total_time_seconds) || 0) / 3600,
            dailyActivity: dailyRows,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard summary' });
    }
});

router.get('/dashboard/top-performers', async (req, res) => {
    try {
        const query = `
            SELECT 
                u.name,
                u.email,
                u.id,
                COALESCE(AVG(c.user_score), 0) as avg_user_score,
                COALESCE(AVG(c.ai_score), 0) as avg_ai_score,
                COUNT(c.id) as chat_count,
                COUNT(s.id) as simulation_count
            FROM users u
            LEFT JOIN chat_sessions c ON u.id = c.user_id
            LEFT JOIN simulation_sessions s ON u.id = s.user_id
            WHERE u.is_admin = false
            GROUP BY u.id, u.name, u.email
            HAVING COUNT(c.id) > 0 OR COUNT(s.id) > 0
            ORDER BY COALESCE(AVG(c.user_score), 0) DESC
            LIMIT 10
        `;

        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching top performers:', error);
        res.status(500).json({ error: 'Failed to fetch top performers' });
    }
});

// User search
router.get('/users/search', async (req, res) => {
    try {
        const { q = '' } = req.query;
        const query = `
            SELECT id, name, email
            FROM users
            WHERE is_admin = false
            AND (LOWER(name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1))
            ORDER BY name
            LIMIT 20
        `;
        const { rows } = await pool.query(query, [`%${q}%`]);
        res.json(rows);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

// Delete preview
router.get('/admin/delete-preview', async (req, res) => {
    try {
        const { scope, dataType, userId, from, to } = req.query;
        const table = dataType === 'chats' ? 'chat_sessions' : 'simulation_sessions';
        
        let whereConditions = [];
        let params = [];
        let paramCount = 1;
        
        if (scope === 'user' && userId) {
            whereConditions.push(`${table}.user_id = $${paramCount}`);
            params.push(userId);
            paramCount++;
        } else if (scope === 'dateRange') {
            if (from) {
                whereConditions.push(`${table}.created_at >= $${paramCount}`);
                params.push(from);
                paramCount++;
            }
            if (to) {
                whereConditions.push(`${table}.created_at <= $${paramCount}`);
                params.push(to);
                paramCount++;
            }
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        const countQuery = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
        const { rows: countRows } = await pool.query(countQuery, params);
        const matchedCount = parseInt(countRows[0].count);
        
        let sampleQuery;
        if (dataType === 'chats') {
            sampleQuery = `
                SELECT c.id, c.user_prompt, c.user_score, c.ai_score, c.created_at, u.name, u.email
                FROM chat_sessions c
                JOIN users u ON u.id = c.user_id
                ${whereClause}
                ORDER BY c.created_at DESC
                LIMIT 10
            `;
        } else {
            sampleQuery = `
                SELECT s.id, s.prompt, s.time_spent_seconds, s.ipq_score, s.created_at, u.name, u.email
                FROM simulation_sessions s
                JOIN users u ON u.id = s.user_id
                ${whereClause}
                ORDER BY s.created_at DESC
                LIMIT 10
            `;
        }
        
        const { rows: sampleRows } = await pool.query(sampleQuery, params);
        
        res.json({ matchedCount, sample: sampleRows });
    } catch (error) {
        console.error('Error in delete preview:', error);
        res.status(500).json({ error: 'Failed to generate preview' });
    }
});

// Delete
router.delete('/admin/delete', async (req, res) => {
    try {
        const { scope, dataType, userId, from, to } = req.body;
        const table = dataType === 'chats' ? 'chat_sessions' : 'simulation_sessions';
        
        let whereConditions = [];
        let params = [];
        let paramCount = 1;
        
        if (scope === 'user' && userId) {
            whereConditions.push(`user_id = $${paramCount}`);
            params.push(userId);
            paramCount++;
        } else if (scope === 'dateRange') {
            if (from) {
                whereConditions.push(`created_at >= $${paramCount}`);
                params.push(from);
                paramCount++;
            }
            if (to) {
                whereConditions.push(`created_at <= $${paramCount}`);
                params.push(to);
                paramCount++;
            }
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const deleteQuery = `DELETE FROM ${table} ${whereClause} RETURNING id`;
        const { rows } = await pool.query(deleteQuery, params);
        
        res.json({ deletedCount: rows.length, matchedCount: rows.length });
    } catch (error) {
        console.error('Error in delete:', error);
        res.status(500).json({ error: 'Failed to delete data' });
    }
});

export default router
