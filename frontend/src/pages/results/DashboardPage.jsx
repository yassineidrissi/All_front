import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchSummary } from "../../lib/results/api";
import { buildTimeDistribution, formatDuration, formatScore } from "../../lib/results/utils";
import KpiCard from "../../components/results/KpiCard";
import TimeRangePicker from "../../components/results/TimeRangePicker";
import SessionsAreaChart from "../../components/results/SessionsAreaChart";
import HorizontalBarChart from "../../components/results/HorizontalBarChart";
import TimeDistributionChart from "../../components/results/TimeDistributionChart";

const nowIso = () => new Date().toISOString().slice(0, 10);

const resolvePresetRange = (preset) => {
  const end = new Date();
  const start = new Date();
  if (preset === "7d") start.setDate(end.getDate() - 7);
  else if (preset === "30d") start.setDate(end.getDate() - 30);
  else if (preset === "90d") start.setDate(end.getDate() - 90);
  return { from: start.toISOString().slice(0, 10), to: nowIso() };
};

export default function DashboardPage() {
  const { token } = useAuth();
  const [range, setRange] = useState({ preset: "30d", ...resolvePresetRange("30d") });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartWindow, setChartWindow] = useState(30);
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const params = range.preset === "custom" ? range : resolvePresetRange(range.preset);
      const data = await fetchSummary(token, params);
      setSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, range]);

  const handleRefresh = () => {
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpis = useMemo(() => {
    if (!summary) return [];
    const deltaValue = Number(summary.avgDeltaBrestScore ?? 0);
    const formattedDelta = `${deltaValue > 0 ? "+" : ""}${formatScore(deltaValue)}`;
    return [
      {
        title: "Étudiants",
        value: summary.totalStudents ?? 0,
        accent: "default",
        icon: "🎓",
      },
      {
        title: "Sessions",
        value: summary.totalSessions ?? 0,
        accent: "default",
        icon: "🗂️",
      },
      {
        title: "BRESTScore moyen",
        value: formatScore(summary.avgBrestScore ?? 0),
        accent: "success",
        icon: "📈",
      },
      {
        title: "Δ moyen",
        value: formattedDelta,
        accent: deltaValue >= 0 ? "success" : "danger",
        icon: deltaValue >= 0 ? "⬆️" : "⬇️",
      },
      {
        title: "Temps total",
        value: formatDuration((summary.totalTimeHours ?? 0) * 3600),
        accent: "warning",
        icon: "⏱️",
      },
    ];
  }, [summary]);

  const busiestDays = useMemo(() => {
    if (!summary) return [];
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - chartWindow);
    return summary.busiestDays
      .filter((day) => new Date(day.date) >= limitDate)
      .map((day) => ({ ...day, label: day.date.slice(5) }));
  }, [summary, chartWindow]);

  const topImprovers = useMemo(() => {
    if (!summary) return [];
    return summary.topImprovers.slice(0, 10).map((student) => ({
      ...student,
      avgDelta: Number(student.avgDelta || 0),
      displayDelta: Number(student.avgDelta || 0).toFixed(2),
    }));
  }, [summary]);

  const timeDistribution = useMemo(() => {
    if (!summary) return [];
    return buildTimeDistribution(summary.timeDistribution || []);
  }, [summary]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <TimeRangePicker value={range} onChange={setRange} />
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-400 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <RefreshCcw className="h-4 w-4" /> Rafraîchir
          </button>
        </div>
        {error && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">{error}</p>}
        {loading && <p className="mt-4 text-sm text-slate-500">Chargement des indicateurs…</p>}
        {!loading && summary && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.title} {...kpi} />
            ))}
          </div>
        )}
      </section>

      {!loading && summary && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Sessions quotidiennes</h2>
                <p className="text-xs text-slate-500">Nombre de sessions terminées par jour</p>
              </div>
              <div className="flex gap-2">
                {[30, 90].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setChartWindow(value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                      chartWindow === value
                        ? "bg-indigo-500 text-white"
                        : "border border-indigo-200 text-indigo-600 hover:border-indigo-400"
                    }`}
                  >
                    {value} jours
                  </button>
                ))}
              </div>
            </header>
            <div className="h-72">
              <SessionsAreaChart data={busiestDays.map((item) => ({ ...item, value: item.sessions }))} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <header className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Top améliorations</h2>
              <p className="text-xs text-slate-500">Moyenne des variations du BRESTScore</p>
            </header>
            <HorizontalBarChart
              data={topImprovers.map((item) => ({ ...item, label: item.name, value: item.avgDelta }))}
              valueKey="value"
              labelKey="label"
            />
          </section>

          <section className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <header className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Répartition du temps passé</h2>
              <p className="text-xs text-slate-500">Temps cumulé par étudiant</p>
            </header>
            <TimeDistributionChart data={timeDistribution} />
          </section>
        </div>
      )}
    </div>
  );
}

