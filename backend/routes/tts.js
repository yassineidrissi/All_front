import express from "express";
import { promises as fs, createWriteStream } from "fs";
import { exec } from "child_process";
import https from "https";
import { gunzipSync } from "zlib";
import voice from "elevenlabs-node";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const ttsRouter = express.Router();

// Config
const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY?.trim();
const voiceID = "TojRWZatQyy9dujEdiQ1";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const openaiTtsModel = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";
const openaiTtsVoice = process.env.OPENAI_TTS_VOICE || "alloy";

const ELEVENLABS_HOST = "api.elevenlabs.io";

const decodeBody = (buffer, encoding) => {
    if (!encoding || encoding === "identity") {
        return buffer.toString("utf8");
    }

    try {
        if (encoding.includes("gzip")) {
            return gunzipSync(buffer).toString("utf8");
        }
    } catch (error) {
        console.warn("Unable to decode ElevenLabs error body:", error.message);
    }

    return buffer.toString("utf8");
};

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

const deleteIfExists = async (filePath) => {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }
};

const fileExists = async (filePath) => {
    try {
        await fs.access(filePath);
        return true;
    } catch (error) {
        if (error.code === "ENOENT") {
            return false;
        }
        throw error;
    }
};

const readJsonTranscript = async (file) => {
    const data = await fs.readFile(file, "utf8");
    return JSON.parse(data);
};

const audioFileToBase64 = async (file) => {
    const data = await fs.readFile(file);
    return data.toString("base64");
};

const generateWithElevenLabs = async (text, fileName) => {
    if (!elevenLabsApiKey) {
        return { ok: false, error: "Missing ElevenLabs API key" };
    }

    const body = JSON.stringify({
        text,
        voice_settings: {
            stability: Number(process.env.ELEVEN_LABS_STABILITY ?? 0) || 0,
            similarity_boost: Number(process.env.ELEVEN_LABS_SIMILARITY ?? 0) || 0,
        },
        model_id: process.env.ELEVEN_LABS_MODEL_ID || undefined,
    });

    return new Promise((resolve) => {
        let settled = false;
        const settle = (result) => {
            if (settled) return;
            settled = true;
            resolve(result);
        };

        const request = https.request(
            {
                host: ELEVENLABS_HOST,
                path: `/v1/text-to-speech/${voiceID}`,
                method: "POST",
                headers: {
                    Accept: "audio/mpeg",
                    "Content-Type": "application/json",
                    "xi-api-key": elevenLabsApiKey,
                    "Content-Length": Buffer.byteLength(body),
                },
                timeout: Number(process.env.ELEVEN_LABS_TIMEOUT_MS ?? 60000),
            },
            (response) => {
                if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
                    const fileStream = createWriteStream(fileName);
                    response.pipe(fileStream);

                    fileStream.on("finish", () => {
                        fileStream.close(() => settle({ ok: true, provider: "elevenlabs" }));
                    });

                    fileStream.on("error", async (error) => {
                        console.error("Failed to write ElevenLabs audio:", error);
                        await deleteIfExists(fileName);
                        settle({ ok: false, error: error.message });
                    });

                    response.on("error", async (error) => {
                        console.error("ElevenLabs response stream error:", error);
                        fileStream.destroy(error);
                        await deleteIfExists(fileName);
                        settle({ ok: false, error: error.message });
                    });
                } else {
                    const chunks = [];

                    response.on("data", (chunk) => {
                        chunks.push(chunk);
                    });

                    response.on("end", async () => {
                        const rawBody = Buffer.concat(chunks);
                        const decoded = decodeBody(rawBody, response.headers["content-encoding"]);
                        let detail = decoded;
                        try {
                            const parsed = JSON.parse(decoded);
                            detail = parsed?.detail || parsed?.message || JSON.stringify(parsed);
                        } catch (error) {
                            detail = decoded;
                        }

                        console.error("ElevenLabs TTS HTTP error:", {
                            status: response.statusCode,
                            statusText: response.statusMessage,
                            detail,
                        });

                        await deleteIfExists(fileName);
                        settle({ ok: false, error: detail || `HTTP ${response.statusCode}` });
                    });

                    response.on("error", async (error) => {
                        console.error("ElevenLabs response error:", error);
                        await deleteIfExists(fileName);
                        settle({ ok: false, error: error.message });
                    });
                }
            }
        );

        request.on("timeout", async () => {
            console.error("ElevenLabs request timed out");
            request.destroy(new Error("ElevenLabs request timeout"));
        });

        request.on("error", async (error) => {
            console.error("ElevenLabs TTS request error:", error);
            await deleteIfExists(fileName);
            settle({ ok: false, error: error.message });
        });

        request.write(body);
        request.end();
    });
};

const generateWithOpenAITts = async (text, fileName) => {
    if (!openai.apiKey) {
        return { ok: false, error: "Missing OpenAI API key" };
    }

    try {
        const speech = await openai.audio.speech.create({
            model: openaiTtsModel,
            voice: openaiTtsVoice,
            input: text,
            format: "mp3",
        });

        const buffer = Buffer.from(await speech.arrayBuffer());
        await fs.writeFile(fileName, buffer);

        return { ok: true, provider: "openai" };
    } catch (error) {
        console.error("OpenAI fallback TTS error:", error);
        await deleteIfExists(fileName);
        return { ok: false, error: error.message || "OpenAI TTS request failed" };
    }
};

const synthesizeSpeech = async (text, fileName, timings) => {
    const ttsStart = Date.now();
    let lastError;
    let provider = null;

    if (elevenLabsApiKey) {
        const elevenResult = await generateWithElevenLabs(text, fileName);
        if (elevenResult.ok) {
            provider = elevenResult.provider;
        } else {
            lastError = elevenResult.error;
        }
    }

    if (!provider) {
        const fallbackStart = Date.now();
        const fallbackResult = await generateWithOpenAITts(text, fileName);
        if (timings) {
            timings.openai_fallback_ms = (timings.openai_fallback_ms || 0) + (Date.now() - fallbackStart);
        }

        if (fallbackResult.ok) {
            provider = fallbackResult.provider;
        } else {
            lastError = lastError || fallbackResult.error;
        }
    }

    if (timings) {
        timings.elevenlabs_ms += Date.now() - ttsStart;
    }

    return {
        ok: Boolean(provider),
        provider,
        error: lastError,
    };
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
        await deleteIfExists(outPath);

        const result = await synthesizeSpeech(text, outPath);

        if (!result.ok) {
            throw new Error(result.error || "TTS synthesis failed");
        }

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
            timings: null,
        });
    }

    if (!openai.apiKey) {
        return res.send({
            messages: [
                {
                    text: "Mode démo — aucune clé OpenAI configurée.",
                    audio: null,
                    lipsync: null,
                    facialExpression: "sad",
                    animation: "Idle",
                },
            ],
            timings: null,
        });
    }

    try {
        await fs.mkdir("audios", { recursive: true });

        const startTime = Date.now();
        const timings = {
            openai_ms: 0,
            elevenlabs_ms: 0,
            lip_sync_ms: 0,
            audio_encode_ms: 0,
            transcript_ms: 0,
            tfft_ms: 0,
            openai_fallback_ms: 0,
        };

        // Generate response with OpenAI
        const openaiStart = Date.now();
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
        timings.openai_ms = Date.now() - openaiStart;

        let messages = JSON.parse(completion.choices[0].message.content);
        if (messages.messages) messages = messages.messages;

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const fileName = `audios/message_${i}.mp3`;

            await deleteIfExists(fileName);
            await deleteIfExists(`audios/message_${i}.wav`);
            await deleteIfExists(`audios/message_${i}.json`);

            const synthesisResult = await synthesizeSpeech(msg.text, fileName, timings);

            if (!synthesisResult.ok || !(await fileExists(fileName))) {
                msg.audio = null;
                msg.lipsync = null;
                msg.ttsError = true;
                msg.ttsErrorMessage = synthesisResult.error || "Audio synthesis failed";
                continue;
            }

            msg.ttsProvider = synthesisResult.provider;
            const lipSyncStart = Date.now();
            await lipSyncMessage(i);
            timings.lip_sync_ms += Date.now() - lipSyncStart;

            const audioEncodeStart = Date.now();
            msg.audio = await audioFileToBase64(fileName);
            timings.audio_encode_ms += Date.now() - audioEncodeStart;

            const transcriptStart = Date.now();
            msg.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
            timings.transcript_ms += Date.now() - transcriptStart;
        }

        timings.tfft_ms = Date.now() - startTime;

        res.send({ messages, timings });
    } catch (error) {
        console.error("Chat generation error:", error);
        res.status(500).send({ error: "Unable to generate chat response" });
    }
});

export default ttsRouter;
