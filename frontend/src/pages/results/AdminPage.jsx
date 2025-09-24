import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { deleteData, searchStudents } from "../../lib/results/api";
import { formatDateTime, formatDuration, formatScore } from "../../lib/results/utils";
import DeleteForm from "../../components/results/DeleteForm";
import DataTable from "../../components/results/DataTable";
import ConfirmDialog from "../../components/results/ConfirmDialog";

const initialDateRange = { from: "", to: "" };

export default function AdminPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [scope, setScope] = useState("all");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentOptions, setStudentOptions] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
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
    if (preview.deletedCount && preview.deletedCount > 0) {
      return preview.deletedCount;
    }
    return preview.matchedCount || 0;
  }, [preview]);

  const columns = useMemo(
    () => [
      { key: "timestamp", label: "Date", render: (value) => formatDateTime(value) },
      { key: "studentName", label: "Étudiant" },
      { key: "BrestScore", label: "BRESTScore", render: (value) => formatScore(value) },
      {
        key: "deltaBrestScore",
        label: "Δ",
        render: (value) => (value === null || value === undefined ? "—" : `${value > 0 ? "+" : ""}${formatScore(value)}`),
      },
      { key: "timeSpentSec", label: "Durée", render: (value) => formatDuration(value) },
    ],
    []
  );

  const previewPayload = useMemo(() => {
    const payload = { scope, dryRun: true };
    if (scope === "student" && selectedStudent) payload.studentId = selectedStudent.id;
    if (scope === "dateRange") {
      if (dateRange.from) payload.from = dateRange.from;
      if (dateRange.to) payload.to = dateRange.to;
    }
    return payload;
  }, [scope, selectedStudent, dateRange]);

  const canPreview = useMemo(() => {
    if (scope === "student") return Boolean(selectedStudent);
    if (scope === "dateRange") return Boolean(dateRange.from && dateRange.to);
    return true;
  }, [scope, selectedStudent, dateRange]);

  const handlePreview = async () => {
    if (!token || !canPreview) return;
    try {
      setLoadingPreview(true);
      setPreviewError(null);
      const result = await deleteData(token, previewPayload);
      setPreview(result);
      setConfirmationText("");
      setSuccessMessage("");
    } catch (error) {
      setPreviewError(error.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const fetchStudents = useCallback(
    (value) => {
      if (!token) return;
      setStudentsLoading(true);
      setStudentsError(null);
      searchStudents(token, value)
        .then((data) => setStudentOptions(data))
        .catch((error) => setStudentsError(error.message))
        .finally(() => setStudentsLoading(false));
    },
    [token]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (scope === "student") {
        fetchStudents(studentQuery);
      }
    }, 200);
    return () => clearTimeout(handler);
  }, [studentQuery, scope, fetchStudents]);

  useEffect(() => {
    if (scope !== "student") {
      setSelectedStudent(null);
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
      const result = await deleteData(token, payload);
      setSuccessMessage(
        `Suppression réussie : ${result.deletedCount} élément${result.deletedCount > 1 ? "s" : ""} supprimé${
          result.deletedCount > 1 ? "s" : ""
        }.`
      );
      setPreview(result);
      setConfirmOpen(false);
      setConfirmationText("");
      setTimeout(() => navigate("/results"), 1500);
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
        <DeleteForm
          scope={scope}
          onScopeChange={setScope}
          studentQuery={studentQuery}
          onStudentQueryChange={setStudentQuery}
          students={studentOptions}
          onSelectStudent={setSelectedStudent}
          selectedStudent={selectedStudent}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          isLoadingStudents={studentsLoading}
          studentError={studentsError}
        />
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
            {preview.warnings && preview.warnings.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm text-amber-600">
                {preview.warnings.map((warning) => (
                  <li key={warning} className="rounded-lg bg-amber-50 px-3 py-2">
                    {warning}
                  </li>
                ))}
              </ul>
            )}
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
          <DataTable columns={columns} rows={preview.sample || []} emptyLabel="Aucun échantillon" />
        </section>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Confirmer la suppression"
        description="Cette action supprimera définitivement les données sélectionnées. Tapez DELETE pour continuer."
        confirmLabel={deleting ? "Suppression…" : "Confirmer"}
        confirmDisabled={confirmationText !== "DELETE" || deleting}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmationText("");
        }}
        onConfirm={handleConfirmDelete}
      />

      {confirmOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-white/90 px-6 py-4 shadow-lg">
          <div className="mx-auto flex max-w-lg flex-col gap-3">
            <label className="text-sm font-semibold text-slate-700" htmlFor="confirm-input">
              Saisissez DELETE pour confirmer
            </label>
            <input
              id="confirm-input"
              type="text"
              value={confirmationText}
              onChange={(event) => setConfirmationText(event.target.value)}
              className="rounded-lg border border-rose-300 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
        </div>
      )}
    </div>
  );
}

