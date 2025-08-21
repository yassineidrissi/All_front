import express from "express";
import { promises as fs } from "fs";
import { exec } from "child_process";
import voice from "elevenlabs-node";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const ttsRouter = express.Router();

// Config
const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceID = "TojRWZatQyy9dujEdiQ1";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const execCommand = (command) =>
    new Promise((resolve, reject) => {
        exec(command, (error, stdout) => {
            if (error) reject(error);
            resolve(stdout);
        });
    });

const lipSyncMessage = async (message) => {
    await execCommand(`ffmpeg -y -i audios/message_${message}.mp3 audios/message_${message}.wav`);
    await execCommand(
        `./bin/rhubarb -f json -o audios/message_${message}.json audios/message_${message}.wav -r phonetic`
    );
};

const readJsonTranscript = async (file) => {
    const data = await fs.readFile(file, "utf8");
    return JSON.parse(data);
};

const audioFileToBase64 = async (file) => {
    const data = await fs.readFile(file);
    return data.toString("base64");
};

// Get available voices
ttsRouter.get("/voices", async (req, res) => {
    try {
        const voices = await voice.getVoices(elevenLabsApiKey);
        res.json(voices);
    } catch (err) {
        console.error("ElevenLabs error:", err);
        res.status(500).send("TTS fetch failed");
    }
});

// Test endpoint for TTS
ttsRouter.get("/test-tts", async (req, res) => {
    try {
        const text = "Salut mon cœur ! Ça marche très bien sur ElevenLabs.";
        const outPath = "audios/eleven_test.mp3";

        await fs.mkdir("audios", { recursive: true });
        await voice.textToSpeech(elevenLabsApiKey, voiceID, outPath, text);

        const fileData = await fs.readFile(outPath);
        res.set("Content-Type", "audio/mpeg");
        res.send(fileData);
    } catch (err) {
        console.error("TTS error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Main chat route
ttsRouter.post("/chat", async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.send({
            messages: [
                {
                    text: "Coucou mon amour... Comment s'est passée ta journée ?",
                    audio: await audioFileToBase64("audios/intro_0.wav"),
                    lipsync: await readJsonTranscript("audios/intro_0.json"),
                    facialExpression: "smile",
                    animation: "Talking_1",
                },
            ],
        });
    }

    if (!elevenLabsApiKey || !openai.apiKey) {
        return res.send({
            messages: [
                {
                    text: "Mode démo — aucune clé API configurée.",
                    audio: null,
                    lipsync: null,
                    facialExpression: "sad",
                    animation: "Idle",
                },
            ],
        });
    }

    // Generate response with OpenAI
    const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        max_tokens: 1000,
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content: `
          You are a virtual girlfriend.
          Always reply with JSON array of up to 3 messages.
          Each has text, facialExpression, and animation.
        `,
            },
            { role: "user", content: userMessage },
        ],
    });

    let messages = JSON.parse(completion.choices[0].message.content);
    if (messages.messages) messages = messages.messages;

    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const fileName = `audios/message_${i}.mp3`;

        await voice.textToSpeech(elevenLabsApiKey, voiceID, fileName, msg.text);
        await lipSyncMessage(i);

        msg.audio = await audioFileToBase64(fileName);
        msg.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
    }

    res.send({ messages });
});

export default ttsRouter;
