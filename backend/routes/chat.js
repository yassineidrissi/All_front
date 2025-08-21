import express from "express"
import OpenAI from "openai/index.mjs";
import { calculateScore } from "../utils/scoring.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const chatRouter = express.Router()
// Chat endpoint - process a user prompt and return AI response
chatRouter.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a helpful medical assistant providing information about diagnoses and medical conditions." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const aiResponse = response.choices[0].message.content;
        const score = calculateScore(prompt, aiResponse);

        res.json({
            prompt,
            response: aiResponse,
            score
        });

    } catch (error) {
        console.error('Error in /api/chat:', error);
        res.status(500).json({ error: error.message || 'Failed to process chat request' });
    }
});

// Best prompt endpoint - optimize the prompt and compare responses
chatRouter.post('/api/best_prompt', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // Step 1: Generate an optimized version of the prompt
        const optimizationResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a prompt optimization expert. Rewrite the given medical prompt to be more specific, clear, and effective. Focus on adding context, specificity, and proper framing. Return ONLY the optimized prompt, nothing else." },
                { role: "user", content: `Original prompt: "${prompt}"` }
            ],
            temperature: 0.7,
            max_tokens: 300
        });

        const optimizedPrompt = optimizationResponse.choices[0].message.content;

        // Step 2: Get responses for both prompts
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

        // Step 3: Calculate scores for both responses
        const originalText = originalResponse.choices[0].message.content;
        const optimizedText = optimizedResponse.choices[0].message.content;

        const originalScore = calculateScore(prompt, originalText);
        const optimizedScore = calculateScore(optimizedPrompt, optimizedText);

        // Step 4: Return comparison results
        res.json({
            original: {
                prompt,
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
        console.error('Error in /api/best_prompt:', error);
        res.status(500).json({ error: error.message || 'Failed to process best prompt request' });
    }
});

export default chatRouter
