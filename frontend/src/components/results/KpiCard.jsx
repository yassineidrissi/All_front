import PropTypes from "prop-types";

const accentClasses = {
  default: "bg-indigo-50 text-indigo-700 border-indigo-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function KpiCard({ title, value, subtitle, accent = "default", icon }) {
  const accentClass = accentClasses[accent] || accentClasses.default;

  return (
    <article className={`rounded-xl border ${accentClass} p-4 shadow-sm transition hover:shadow-md`}>
      <div className="flex items-center gap-3">
        {icon && <span className="text-2xl" aria-hidden>{icon}</span>}
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

