import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";
import { API_URL } from "../config";
import "../style.css";

export default function AdminDashboard() {
    const { user, token } = useAuth();
    const [simulations, setSimulations] = useState([]);
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    if (!user || !user.is_admin) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-red-600 font-semibold text-xl">
                    Access Denied: Admins Only
                </p>
            </div>
        );
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [simRes, chatRes] = await Promise.all([
                    fetch(`${API_URL}/api/simulations`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`${API_URL}/api/chats`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);
                // Parse responses only if the request succeeded
                const simData = simRes.ok ? await simRes.json() : [];
                const chatData = chatRes.ok ? await chatRes.json() : [];

                setSimulations(Array.isArray(simData) ? simData : []);
                setChats(Array.isArray(chatData) ? chatData : []);
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const renderPrompt = (text) =>
        text && text.length > 50 ? `${text.slice(0, 50)}...` : text;

    return (
        <div className="min-h-screen p-6" style={{ background: "var(--bg-light)" }}>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
                Admin Dashboard
            </h1>

            <div className="overflow-x-auto bg-white rounded-2xl shadow-lg mb-10">
                <h2 className="text-xl font-semibold px-4 py-3 border-b">
                    Simulation Sessions
                </h2>
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-3">User</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Prompt</th>
                            <th className="px-4 py-3">Length</th>
                            <th className="px-4 py-3">Time Spent (s)</th>
                            <th className="px-4 py-3">Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {simulations.map((s) => (
                            <tr
                                key={s.id}
                                className="border-b border-gray-200 hover:bg-gray-50"
                            >
                                <td className="px-4 py-3 font-medium">{s.name}</td>
                                <td className="px-4 py-3">{s.email}</td>
                                <td className="px-4 py-3">{renderPrompt(s.prompt)}</td>
                                <td className="px-4 py-3">{s.prompt_length}</td>
                                <td className="px-4 py-3">{s.time_spent_seconds}</td>
                                <td className="px-4 py-3">
                                    {new Date(s.created_at).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="overflow-x-auto bg-white rounded-2xl shadow-lg">
                <h2 className="text-xl font-semibold px-4 py-3 border-b">
                    Chat Sessions
                </h2>
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-3">User</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">User Prompt</th>
                            <th className="px-4 py-3">AI Prompt</th>
                            <th className="px-4 py-3">User Score</th>
                            <th className="px-4 py-3">AI Score</th>
                            <th className="px-4 py-3">Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chats.map((c) => (
                            <tr
                                key={c.id}
                                className="border-b border-gray-200 hover:bg-gray-50"
                            >
                                <td className="px-4 py-3 font-medium">{c.name}</td>
                                <td className="px-4 py-3">{c.email}</td>
                                <td className="px-4 py-3">{renderPrompt(c.user_prompt)}</td>
                                <td className="px-4 py-3">{renderPrompt(c.ai_prompt)}</td>
                                <td className="px-4 py-3">
                                    {c.user_score !== null && !isNaN(c.user_score)
                                        ? Number(c.user_score).toFixed(2)
                                        : "N/A"}
                                </td>
                                <td className="px-4 py-3">
                                    {c.ai_score !== null && !isNaN(c.ai_score)
                                        ? Number(c.ai_score).toFixed(2)
                                        : "N/A"}
                                </td>
                                <td className="px-4 py-3">
                                    {new Date(c.created_at).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

