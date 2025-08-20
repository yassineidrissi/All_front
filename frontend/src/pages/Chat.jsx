// src/pages/Chat.jsx
import { useState } from "react";
import "../style.css";
import logo from "../assets/logo.png";

const API_URL = "http://localhost:3000";

export default function Chat() {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);

    const [original, setOriginal] = useState({
        prompt: "Saisissez votre prompt ci-dessous",
        response: "La réponse apparaîtra ici...",
        score: "--",
    });

    const [optimized, setOptimized] = useState({
        prompt: "Le prompt optimisé apparaîtra ici...",
        response: "La réponse optimisée apparaîtra ici...",
        score: "--",
    });

    const handleSend = async () => {
        if (!prompt.trim()) {
            alert("Veuillez entrer un message.");
            return;
        }

        setLoading(true);

        setOriginal({
            prompt,
            response: "Chargement...",
            score: "--",
        });

        setOptimized({
            prompt: "Optimisation en cours...",
            response: "Chargement...",
            score: "--",
        });

        try {
            const res = await fetch(`${API_URL}/api/best_prompt`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            if (!res.ok) throw new Error(`API error: ${res.status}`);

            const data = await res.json();

            setOriginal({
                prompt: data.original.prompt,
                response: data.original.response,
                score: data.original.score,
            });

            setOptimized({
                prompt: data.optimized.prompt,
                response: data.optimized.response,
                score: data.optimized.score,
            });
        } catch (err) {
            setOriginal((prev) => ({
                ...prev,
                response: `Erreur: ${err.message}`,
            }));
            setOptimized((prev) => ({
                ...prev,
                response: "Une erreur est survenue lors de l'optimisation",
            }));
        } finally {
            setLoading(false);
            setPrompt("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="main-container">
            {/* HEADER */}
            <header>
                <div className="logo-container">
                    <img src={logo} alt="Logo" className="logo" />
                    <span className="foundation-name">Fondation Léonie Chaptal</span>
                </div>
                <h1>Plateforme P-2 : Atelier de Feedback Réflexif</h1>
                <nav className="nav-links">
                    <a href="/" className="active">Accueil</a>
                </nav>
            </header>

            {/* SCENARIO */}
            <div className="scenario-banner">
                <p>
                    <strong>Contexte :</strong> Qu'est-ce que tu peux connaître à propos
                    du diagnostic de maladie
                </p>
            </div>

            {/* MAIN CHAT */}
            <main className="chat-container">
                <div className="split-panel">
                    {/* Left Panel */}
                    <div className="panel actual-prompt-panel">
                        <h2 className="panel-title">Prompt Actuel</h2>
                        <div className="chat-window">
                            <div className="chat-message user">
                                <div className="message-header">Prompt initial</div>
                                <div className="message-content">{original.prompt}</div>
                                <div className="score">Score Qualité : {original.score}</div>
                            </div>

                            <div className="chat-message ai">
                                <div className="message-header">Réponse générée</div>
                                <div className="message-content">{original.response}</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="panel best-prompt-panel">
                        <h2 className="panel-title">Prompt Optimisé</h2>
                        <div className="chat-window">
                            <div className="chat-message reference">
                                <div className="message-header">Référence optimisée</div>
                                <div className="message-content">{optimized.prompt}</div>
                                <div className="score">Score Qualité : {optimized.score}</div>
                            </div>

                            <div className="chat-message ai">
                                <div className="message-header">Réponse optimisée</div>
                                <div className="message-content">{optimized.response}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* FOOTER */}
            <footer>
                <div className="input-container">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Tapez un message..."
                        disabled={loading}
                    />
                    <button onClick={handleSend} disabled={loading}>
                        SEND
                    </button>
                    <button
                        onClick={() => alert("Fonctionnalité vocale en développement.")}
                        disabled={loading}
                    >
                        Parlez
                    </button>
                </div>

                {loading && (
                    <div className="loading-indicator">
                        <span className="loading-dot"></span>
                        <span className="loading-dot"></span>
                        <span className="loading-dot"></span>
                    </div>
                )}
            </footer>
        </div>
    );
}
