import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../config";


const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
};

export default function UsersPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      
      // Use your existing API_URL or define it here
      const API_BASE = API_URL
      
      const response = await fetch(`${API_BASE}/api/users/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    if (!query) return users;
    const searchTerm = query.toLowerCase();
    return users.filter(user => 
      user.name?.toLowerCase().includes(searchTerm) || 
      user.email?.toLowerCase().includes(searchTerm)
    );
  }, [users, query]);

  const UserCard = ({ user, isSelected, onClick }) => (
    <div
      onClick={() => onClick(user)}
      className={`cursor-pointer rounded-2xl border p-4 transition-all hover:shadow-md ${
        isSelected 
          ? "border-indigo-500 bg-indigo-50" 
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{user.name}</h3>
          <p className="text-sm text-slate-600">{user.email}</p>
        </div>
        <div className="text-right">
          <div className="flex gap-2 text-xs text-slate-500">
            <span>{user.total_chat_sessions} chats</span>
            <span>{user.total_simulations} sims</span>
          </div>
          {user.is_active ? (
            <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
              Actif
            </span>
          ) : (
            <span className="inline-block rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
              Inactif
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const UserDetails = ({ user }) => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{user.name}</h2>
            <p className="text-slate-600">{user.email}</p>
            <p className="text-xs text-slate-500">ID: {user.id}</p>
          </div>
          <div className="flex gap-2">
            {user.is_admin && (
              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                Admin
              </span>
            )}
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              user.is_active 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {user.is_active ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">{user.total_chat_sessions}</p>
            <p className="text-sm text-slate-600">Sessions Chat</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{user.total_simulations}</p>
            <p className="text-sm text-slate-600">Simulations</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {user.avg_user_score ? parseFloat(user.avg_user_score).toFixed(2) : '0.00'}
            </p>
            <p className="text-sm text-slate-600">Score Moyen</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{user.formatted_time_spent}</p>
            <p className="text-sm text-slate-600">Temps Total</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Informations du compte</h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-slate-600">Date de création</dt>
            <dd className="text-sm text-slate-900">{formatDateTime(user.created_at)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-600">Dernière mise à jour</dt>
            <dd className="text-sm text-slate-900">{formatDateTime(user.updated_at)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-600">Longueur totale des prompts</dt>
            <dd className="text-sm text-slate-900">{user.total_prompt_length || 0} caractères</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-600">Temps total en secondes</dt>
            <dd className="text-sm text-slate-900">{user.total_time_spent_seconds || 0}s</dd>
          </div>
        </dl>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
      {/* Users List */}
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </div>

        <div className="space-y-3">
          {loading && <p className="text-center text-sm text-slate-500">Chargement...</p>}
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
          {!loading && !error && filteredUsers.length === 0 && (
            <p className="text-center text-sm text-slate-500">Aucun utilisateur trouvé</p>
          )}
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isSelected={selectedUser?.id === user.id}
              onClick={setSelectedUser}
            />
          ))}
        </div>
      </div>

      {/* User Details */}
      <div className="space-y-6">
        {!selectedUser ? (
          <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <div className="text-center text-slate-500">
              <Users className="mx-auto h-12 w-12 mb-4" />
              <p>Sélectionnez un utilisateur pour voir les détails</p>
            </div>
          </div>
        ) : (
          <UserDetails user={selectedUser} />
        )}
      </div>
    </div>
  );
}