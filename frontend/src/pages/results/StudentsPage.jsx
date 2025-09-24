import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchStudentSeries, searchStudents } from "../../lib/results/api";
import { computeDelta, exportToCsv, formatDateTime, formatDuration, formatScore } from "../../lib/results/utils";
import StudentsSearch from "../../components/results/StudentsSearch";
import StudentCharts from "../../components/results/StudentCharts";
import DataTable from "../../components/results/DataTable";

export default function StudentsPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [series, setSeries] = useState([]);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [seriesError, setSeriesError] = useState(null);

  const debouncedSearch = useCallback(
    (value) => {
      if (!token) return;
      setStudentsLoading(true);
      setStudentsError(null);
      searchStudents(token, value)
        .then((data) => setStudentResults(data))
        .catch((error) => setStudentsError(error.message))
        .finally(() => setStudentsLoading(false));
    },
    [token]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      debouncedSearch(query);
    }, 250);
    return () => clearTimeout(handler);
  }, [query, debouncedSearch]);

  useEffect(() => {
    if (studentResults.length > 0 && !selectedStudent) {
      setSelectedStudent(studentResults[0]);
    }
  }, [studentResults, selectedStudent]);

  useEffect(() => {
    if (!token || !selectedStudent) return;
    setSeriesLoading(true);
    setSeriesError(null);
    fetchStudentSeries(token, selectedStudent.id)
      .then((data) => {
        const computed = computeDelta(data.series);
        setSeries(computed);
      })
      .catch((error) => setSeriesError(error.message))
      .finally(() => setSeriesLoading(false));
  }, [token, selectedStudent]);

  const stats = useMemo(() => {
    if (!series || series.length === 0) return null;
    const totalSessions = series.length;
    const avgScore =
      series.reduce((sum, session) => sum + Number(session.BrestScore || 0), 0) / totalSessions;
    const totalTime = series.reduce((sum, session) => sum + Number(session.timeSpentSec || 0), 0);
    return {
      totalSessions,
      avgScore: formatScore(avgScore),
      totalTime: formatDuration(totalTime),
    };
  }, [series]);

  const columns = useMemo(
    () => [
      { key: "timestamp", label: "Date", render: (value) => formatDateTime(value) },
      { key: "BrestScore", label: "BRESTScore", render: (value) => formatScore(value) },
      {
        key: "deltaBrestScore",
        label: "Δ",
        render: (value) => (value === null || value === undefined ? "—" : `${value > 0 ? "+" : ""}${formatScore(value)}`),
      },
      {
        key: "timeSpentSec",
        label: "Durée",
        render: (value) => formatDuration(value),
      },
    ],
    []
  );

  const exportRows = useMemo(
    () =>
      series.map((session) => ({
        id: session.id,
        timestamp: formatDateTime(session.timestamp),
        BrestScore: formatScore(session.BrestScore),
        deltaBrestScore:
          session.deltaBrestScore === null || session.deltaBrestScore === undefined
            ? ""
            : `${session.deltaBrestScore > 0 ? "+" : ""}${formatScore(session.deltaBrestScore)}`,
        timeSpent: formatDuration(session.timeSpentSec),
      })),
    [series]
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <StudentsSearch
        query={query}
        onQueryChange={setQuery}
        results={studentResults}
        onSelect={setSelectedStudent}
        selectedId={selectedStudent?.id || null}
        isLoading={studentsLoading}
        error={studentsError}
      />

      <section className="space-y-6">
        {!selectedStudent && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            <AlertTriangle className="h-5 w-5" />
            <p>Sélectionnez un étudiant pour consulter les détails.</p>
          </div>
        )}

        {selectedStudent && (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">{selectedStudent.name}</h2>
                  <p className="text-xs text-slate-500">ID : {selectedStudent.id}</p>
                </div>
                {stats && (
                  <dl className="grid grid-cols-2 gap-4 text-sm text-slate-600 sm:grid-cols-3">
                    <div>
                      <dt className="font-semibold text-slate-700">Sessions</dt>
                      <dd>{stats.totalSessions}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">Score moyen</dt>
                      <dd>{stats.avgScore}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-700">Temps cumulé</dt>
                      <dd>{stats.totalTime}</dd>
                    </div>
                  </dl>
                )}
              </header>
              {seriesLoading && <p className="mt-4 text-sm text-slate-500">Chargement des sessions…</p>}
              {seriesError && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{seriesError}</p>}
              {!seriesLoading && !seriesError && series.length === 0 && (
                <p className="mt-6 text-sm text-slate-500">Aucune session enregistrée pour cet étudiant.</p>
              )}
            </div>

            {!seriesLoading && !seriesError && series.length > 0 && (
              <>
                <StudentCharts series={series} />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">Historique des sessions</h3>
                    <button
                      type="button"
                      onClick={() => exportToCsv(exportRows)}
                      className="rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-400 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      Export CSV
                    </button>
                  </div>
                  <DataTable columns={columns} rows={series} />
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

