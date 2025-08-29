import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
    const { user, token } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Protect admin route
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
        const fetchUsers = async () => {
            try {
                const res = await fetch("https://allfront-production.up.railway.app/api/users/stats", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();
                setUsers(data);
            } catch (err) {
                console.error("Failed to fetch user stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [token]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                Admin Dashboard
            </h1>

            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Chat Sessions</th>
                            <th className="px-4 py-3">Avg User Score</th>
                            <th className="px-4 py-3">Avg AI Score</th>
                            <th className="px-4 py-3">Simulations</th>
                            <th className="px-4 py-3">Prompt Length</th>
                            <th className="px-4 py-3">Time Spent</th>
                            <th className="px-4 py-3">Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr
                                key={u.id}
                                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <td className="px-4 py-3 font-medium">{u.name}</td>
                                <td className="px-4 py-3">{u.email}</td>
                                <td className="px-4 py-3">{u.total_chat_sessions}</td>
                                <td className="px-4 py-3">
                                    {u.avg_user_score !== null && !isNaN(u.avg_user_score)
                                        ? Number(u.avg_user_score).toFixed(2)
                                        : "N/A"}
                                </td>
                                <td className="px-4 py-3">
                                    {u.avg_ai_score !== null && !isNaN(u.avg_ai_score)
                                        ? Number(u.avg_ai_score).toFixed(2)
                                        : "N/A"}
                                </td>
                                <td className="px-4 py-3">{u.total_simulations}</td>
                                <td className="px-4 py-3">{u.total_prompt_length}</td>
                                <td className="px-4 py-3">{u.formatted_time_spent}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-2 py-1 text-xs rounded-full ${u.is_active
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {u.is_active ? "Active" : "Inactive"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
