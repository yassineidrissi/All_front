import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../config";
import PropTypes from "prop-types";

const nowIso = () => new Date().toISOString().slice(0, 10);

const resolvePresetRange = (preset) => {
  const end = new Date();
  const start = new Date();
  if (preset === "7d") start.setDate(end.getDate() - 7);
  else if (preset === "30d") start.setDate(end.getDate() - 30);
  else if (preset === "90d") start.setDate(end.getDate() - 90);
  return { from: start.toISOString().slice(0, 10), to: nowIso() };
};

// Utility functions
const formatScore = (score) => {
  if (score == null || isNaN(score)) return '0.00';
  return Number(score).toFixed(2);
};

const formatDuration = (seconds) => {
  if (!seconds || seconds < 60) return `${seconds || 0}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};

// KPI Card Component
const accentClasses = {
  default: "bg-indigo-50 text-indigo-700 border-indigo-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
};

function KpiCard({ title, value, subtitle, accent = "default", icon }) {
  const accentClass = accentClasses[accent] || accentClasses.default;

  return (
    <article className={`rounded-xl border ${accentClass} p-4 shadow-sm transition hover:shadow-md`}>
      <div className="flex items-center gap-3">
        {icon && <span className="text-2xl" aria-hidden="true">{icon}</span>}
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-600">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
        </div>
      </div>
    </article>
  );
}

KpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  accent: PropTypes.oneOf(["default", "success", "warning", "danger"]),
  icon: PropTypes.node,
};

// Time Range Picker Component
const PRESETS = [
  { label: "7 jours", value: "7d" },
  { label: "30 jours", value: "30d" },
  { label: "90 jours", value: "90d" },
  { label: "Personnalisé", value: "custom" },
];

function TimeRangePicker({ value, onChange }) {
  const [preset, setPreset] = useState(value?.preset || "30d");
  const [customFrom, setCustomFrom] = useState(value?.from || "");
  const [customTo, setCustomTo] = useState(value?.to || "");

  useEffect(() => {
    if (preset !== "custom") {
      onChange?.({ preset });
    } else if (customFrom && customTo) {
      onChange?.({ preset, from: customFrom, to: customTo });
    }
  }, [preset, customFrom, customTo, onChange]);

  useEffect(() => {
    if (!value) return;
    setPreset(value.preset || "30d");
    setCustomFrom(value.from || "");
    setCustomTo(value.to || "");
  }, [value]);

  const renderCustomInputs = useMemo(() => {
    if (preset !== "custom") return null;
    return (
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="flex flex-col text-xs font-medium text-slate-600">
          Du
          <input
            type="date"
            value={customFrom}
            onChange={(event) => setCustomFrom(event.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring"
          />
        </label>
        <label className="flex flex-col text-xs font-medium text-slate-600">
          Au
          <input
            type="date"
            value={customTo}
            onChange={(event) => setCustomTo(event.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring"
          />
        </label>
      </div>
    );
  }, [preset, customFrom, customTo]);

  return (
    <fieldset className="rounded-xl border border-slate-200 bg-white p-3">
      <legend className="mb-2 text-sm font-semibold text-slate-700">Période</legend>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setPreset(option.value)}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              preset === option.value
                ? "border-indigo-500 bg-indigo-500 text-white"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {renderCustomInputs}
    </fieldset>
  );
}

TimeRangePicker.propTypes = {
  value: PropTypes.shape({
    preset: PropTypes.string,
    from: PropTypes.string,
    to: PropTypes.string,
  }),
  onChange: PropTypes.func,
};

// Sessions Area Chart Component
function buildPath(points, baselineY) {
  if (points.length === 0) return "";
  const start = `M ${points[0].x} ${baselineY}`;
  const lines = points.map((point) => `L ${point.x} ${point.y}`).join(" ");
  const close = `L ${points[points.length - 1].x} ${baselineY} Z`;
  return `${start} ${lines} ${close}`;
}

function SessionsAreaChart({ data, width = 620, height = 240 }) {
  const padding = 40;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 1.5;
  const maxValue = Math.max(...data.map((item) => item.sessions || item.value || 0), 1);

  const points = data.map((item, index) => {
    const ratio = data.length > 1 ? index / (data.length - 1) : 0.5;
    const x = padding + ratio * usableWidth;
    const y = height - padding - ((item.sessions || item.value || 0) / maxValue) * usableHeight;
    return { ...item, x, y };
  });

  const baselineY = height - padding;
  const areaPath = buildPath(points, baselineY);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" role="img" aria-label="Sessions quotidiennes">
      <defs>
        <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <line x1={padding} y1={baselineY} x2={width - padding} y2={baselineY} stroke="#cbd5f5" strokeWidth="1" />
      <line x1={padding} y1={padding / 2} x2={padding} y2={baselineY} stroke="#cbd5f5" strokeWidth="1" />
      <path d={areaPath} fill="url(#areaGradient)" stroke="#6366f1" strokeWidth="2" />
      {points.map((point, index) => (
        <circle key={`${point.label}-${index}`} cx={point.x} cy={point.y} r={4} fill="#4338ca" />
      ))}
      {points.map((point, index) => (
        <text
          key={`${point.label}-label-${index}`}
          x={point.x}
          y={baselineY + 16}
          fontSize="10"
          textAnchor="middle"
          fill="#475569"
        >
          {index === 0 || index === points.length - 1
            ? point.label
            : index % Math.max(1, Math.round(points.length / 6)) === 0
            ? point.label
            : ""}
        </text>
      ))}
    </svg>
  );
}

SessionsAreaChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      sessions: PropTypes.number,
      value: PropTypes.number,
    })
  ).isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
};

// Horizontal Bar Chart Component
function HorizontalBarChart({ data, valueKey = "value", labelKey = "label", maxBars = 10 }) {
  const displayData = data.slice(0, maxBars);
  const maxValue = Math.max(...displayData.map(item => Math.abs(item[valueKey] || 0)), 1);

  if (displayData.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500">
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayData.map((item, index) => {
        const value = item[valueKey] || 0;
        const width = Math.abs(value) / maxValue * 100;
        const isPositive = value >= 0;
        
        return (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {item[labelKey]}
              </p>
            </div>
            <div className="flex-1 flex items-center">
              <div className="relative w-full h-6 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isPositive ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className={`ml-2 text-sm font-semibold min-w-0 ${
                isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {formatScore(value)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

HorizontalBarChart.propTypes = {
  data: PropTypes.array.isRequired,
  valueKey: PropTypes.string,
  labelKey: PropTypes.string,
  maxBars: PropTypes.number,
};

// Time Distribution Chart Component
function TimeDistributionChart({ data }) {
  const totalTime = data.reduce((sum, item) => sum + (item.totalTimeSec || 0), 0);
  
  if (data.length === 0 || totalTime === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500">
        <p>Aucune donnée de temps disponible</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {data.slice(0, 10).map((item, index) => {
        const percentage = totalTime > 0 ? (item.totalTimeSec / totalTime) * 100 : 0;
        
        return (
          <div key={index} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {item.name}
              </p>
            </div>
            <div className="flex-1 flex items-center">
              <div className="relative w-full h-6 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="ml-2 text-sm font-semibold text-indigo-600 min-w-0">
                {formatDuration(item.totalTimeSec)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

TimeDistributionChart.propTypes = {
  data: PropTypes.array.isRequired,
};

// Main Dashboard Component
export default function DashboardPage() {
  const { token } = useAuth();
  const [range, setRange] = useState({ preset: "30d", ...resolvePresetRange("30d") });
  const [summary, setSummary] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartWindow, setChartWindow] = useState(30);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      
      const API_BASE = API_URL;
      
      // Build query parameters for date range
      const params = new URLSearchParams();
      if (range.from) params.set('from', range.from);
      if (range.to) params.set('to', range.to);
      
      // Fetch from your new dashboard endpoints
      const [summaryRes, performersRes] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard/summary?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/api/dashboard/top-performers`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!summaryRes.ok) throw new Error('Failed to fetch summary data');
      if (!performersRes.ok) throw new Error('Failed to fetch top performers');
      
      const summaryData = await summaryRes.json();
      const performersData = await performersRes.json();
      
      console.log('Summary data received:', summaryData);
      console.log('Performers data received:', performersData);
      
      setSummary(summaryData);
      setTopPerformers(performersData);
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
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
    const deltaValue = Number(summary.avgAiScore - summary.avgUserScore || 0);
    const formattedDelta = `${deltaValue > 0 ? "+" : ""}${formatScore(deltaValue)}`;
    return [
      {
        title: "Utilisateurs",
        value: summary.totalUsers ?? 0,
        accent: "default",
        icon: "👥",
      },
      {
        title: "Sessions",
        value: (summary.totalChatSessions + summary.totalSimulations) ?? 0,
        accent: "default",
        icon: "📊",
      },
      {
        title: "Score Utilisateur",
        value: formatScore(summary.avgUserScore ?? 0),
        accent: "success",
        icon: "📈",
      },
      {
        title: "Δ IA-Utilisateur",
        value: formattedDelta,
        accent: deltaValue >= 0 ? "success" : "danger",
        icon: deltaValue >= 0 ? "⬆️" : "⬇️",
      },
      {
        title: "Temps Total",
        value: formatDuration((summary.totalTimeHours ?? 0) * 3600),
        accent: "warning",
        icon: "⏱️",
      },
    ];
  }, [summary]);

  const busiestDays = useMemo(() => {
    if (!summary || !summary.dailyActivity) return [];
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - chartWindow);
    return summary.dailyActivity
      .filter((day) => new Date(day.date) >= limitDate)
      .map((day) => ({ ...day, label: day.date.slice(5) }));
  }, [summary, chartWindow]);

  const topImprovers = useMemo(() => {
    if (!topPerformers) return [];
    return topPerformers.slice(0, 10).map((user) => ({
      ...user,
      avgDelta: Number(user.avg_user_score || 0),
      displayDelta: Number(user.avg_user_score || 0).toFixed(2),
    }));
  }, [topPerformers]);

  const timeDistribution = useMemo(() => {
    if (!topPerformers) return [];
    return topPerformers.map(user => ({
      studentId: user.id,
      name: user.name,
      totalTimeSec: (user.simulation_count || 0) * 60 // Approximation based on simulation count
    })).filter(item => item.totalTimeSec > 0);
  }, [topPerformers]);

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
              <h2 className="text-lg font-semibold text-slate-900">Top Performers</h2>
              <p className="text-xs text-slate-500">Meilleurs scores moyens</p>
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
              <p className="text-xs text-slate-500">Temps cumulé par utilisateur</p>
            </header>
            <TimeDistributionChart data={timeDistribution} />
          </section>
        </div>
      )}
    </div>
  );
}