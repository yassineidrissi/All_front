import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../config";

const initialDateRange = { from: "", to: "" };

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatScore = (value) => {
  if (value === null || value === undefined) return "—";
  return parseFloat(value).toFixed(2);
};

export default function AdminPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [scope, setScope] = useState("all");
  const [dataType, setDataType] = useState("chats");
  const [userQuery, setUserQuery] = useState("");
  const [userOptions, setUserOptions] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const pendingDeletion = useMemo(() => {
    if (!preview) return 0;
    return preview.matchedCount || 0;
  }, [preview]);

  const columns = useMemo(() => {
    if (dataType === "chats") {
      return [
        { key: "created_at", label: "Date", render: (value) => formatDateTime(value) },
        { key: "name", label: "Utilisateur" },
        { key: "user_score", label: "Score utilisateur", render: (value) => formatScore(value) },
        { key: "ai_score", label: "Score IA", render: (value) => formatScore(value) },
      ];
    } else {
      return [
        { key: "created_at", label: "Date", render: (value) => formatDateTime(value) },
        { key: "name", label: "Utilisateur" },
        { key: "time_spent_seconds", label: "Durée (s)" },
        { key: "ipq_score", label: "IPQ Score" },
      ];
    }
  }, [dataType]);

  const previewPayload = useMemo(() => {
    const payload = { scope, dataType, dryRun: true };
    if (scope === "user" && selectedUser) payload.userId = selectedUser.id;
    if (scope === "dateRange") {
      if (dateRange.from) payload.from = dateRange.from;
      if (dateRange.to) payload.to = dateRange.to;
    }
    return payload;
  }, [scope, dataType, selectedUser, dateRange]);

  const canPreview = useMemo(() => {
    if (scope === "user") return Boolean(selectedUser);
    if (scope === "dateRange") return Boolean(dateRange.from && dateRange.to);
    return true;
  }, [scope, selectedUser, dateRange]);

  const handlePreview = async () => {
    if (!token || !canPreview) return;
    try {
      setLoadingPreview(true);
      setPreviewError(null);

      const params = new URLSearchParams(previewPayload);
      const response = await fetch(`${API_URL}/api/admin/delete-preview?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch preview');
      const result = await response.json();
      setPreview(result);
      setConfirmationText("");
      setSuccessMessage("");
    } catch (error) {
      setPreviewError(error.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const fetchUsers = useCallback(
    async (value) => {
      if (!token) return;
      setUsersLoading(true);
      setUsersError(null);
      try {
        const response = await fetch(`${API_URL}/api/users/search?q=${value}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to search users');
        const data = await response.json();
        setUserOptions(data);
      } catch (error) {
        setUsersError(error.message);
      } finally {
        setUsersLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (scope === "user") {
        fetchUsers(userQuery);
      }
    }, 200);
    return () => clearTimeout(handler);
  }, [userQuery, scope, fetchUsers]);

  useEffect(() => {
    if (scope !== "user") {
      setSelectedUser(null);
    }
    if (scope !== "dateRange") {
      setDateRange(initialDateRange);
    }
    setPreview(null);
    setSuccessMessage("");
  }, [scope]);

  const handleConfirmDelete = async () => {
    if (!token || !preview) return;
    setDeleting(true);
    try {
      const payload = { ...previewPayload, dryRun: false };
      const response = await fetch(`${API_URL}/api/admin/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to delete');
      const result = await response.json();

      setSuccessMessage(
        `Suppression réussie : ${result.deletedCount} élément${result.deletedCount > 1 ? "s" : ""} supprimé${result.deletedCount > 1 ? "s" : ""
        }.`
      );
      setPreview(result);
      setConfirmOpen(false);
      setConfirmationText("");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      setPreviewError(error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <header className="mb-4 flex items-center gap-3 text-rose-600">
          <ShieldAlert className="h-6 w-6" />
          <div>
            <h2 className="text-xl font-semibold">Suppression de données</h2>
            <p className="text-xs text-rose-500">Les opérations sont irréversibles. Utiliser uniquement pour la maintenance.</p>
          </div>
        </header>

        {/* Data Type Selection */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Type de données</label>
          <div className="flex gap-2">
            {["chats", "simulations"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDataType(type)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${dataType === type
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                {type === "chats" ? "Sessions Chat" : "Simulations"}
              </button>
            ))}
          </div>
        </div>

        {/* Scope Selection */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Portée de suppression</label>
          <div className="flex gap-2">
            {["all", "user", "dateRange"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${scope === s
                    ? "bg-rose-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
              >
                {s === "all" ? "Tout" : s === "user" ? "Utilisateur" : "Plage de dates"}
              </button>
            ))}
          </div>
        </div>

        {/* User Selection */}
        {scope === "user" && (
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">Sélectionner un utilisateur</label>
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            {usersLoading && <p className="text-xs text-slate-500">Recherche...</p>}
            {usersError && <p className="text-xs text-rose-600">{usersError}</p>}
            {userOptions.length > 0 && (
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {userOptions.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className={`w-full rounded px-3 py-2 text-left text-sm transition ${selectedUser?.id === user.id
                        ? "bg-indigo-100 text-indigo-900"
                        : "hover:bg-slate-50"
                      }`}
                  >
                    {user.name} - {user.email}
                  </button>
                ))}
              </div>
            )}
            {selectedUser && (
              <p className="mt-2 text-sm text-slate-600">
                Sélectionné : <strong>{selectedUser.name}</strong>
              </p>
            )}
          </div>
        )}

        {/* Date Range */}
        {scope === "dateRange" && (
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Date de début</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Date de fin</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!canPreview || loadingPreview}
            className="inline-flex items-center justify-center rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Prévisualiser
          </button>
          {preview && (
            <p className="text-xs text-slate-500">Dernière prévisualisation : {new Date().toLocaleTimeString()}</p>
          )}
        </div>
        {previewError && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{previewError}</p>}
        {successMessage && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600">{successMessage}</p>}
      </div>

      {loadingPreview && <p className="text-sm text-slate-500">Chargement de la prévisualisation…</p>}

      {preview && (
        <section className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Résultat de la prévisualisation</h3>
            <p className="mt-2 text-sm text-slate-600">
              {preview.matchedCount} élément{preview.matchedCount > 1 ? "s" : ""} trouvé{preview.matchedCount > 1 ? "s" : ""}.
            </p>
            <div className="mt-4 flex justify-between text-sm text-slate-500">
              <span>Éléments supprimés si confirmé : {pendingDeletion}</span>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={pendingDeletion === 0}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>

          {preview.sample && preview.sample.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {columns.map((col) => (
                      <th key={col.key} className="px-4 py-3 text-left font-semibold text-slate-700">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sample.map((row, idx) => (
                    <tr key={idx} className="border-t border-slate-100">
                      {columns.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-slate-600">
                          {col.render ? col.render(row[col.key]) : row[col.key] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Confirmer la suppression</h3>
            <p className="mt-2 text-sm text-slate-600">
              Cette action supprimera définitivement les données sélectionnées. Tapez DELETE pour continuer.
            </p>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Tapez DELETE"
              className="mt-4 w-full rounded-lg border border-rose-300 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmationText("");
                }}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={confirmationText !== "DELETE" || deleting}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Suppression…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}