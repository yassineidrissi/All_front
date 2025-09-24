import PropTypes from "prop-types";

function buildPath(points, baselineY) {
  if (points.length === 0) return "";
  const start = `M ${points[0].x} ${baselineY}`;
  const lines = points.map((point) => `L ${point.x} ${point.y}`).join(" ");
  const close = `L ${points[points.length - 1].x} ${baselineY} Z`;
  return `${start} ${lines} ${close}`;
}

export default function SessionsAreaChart({ data, width = 620, height = 240 }) {
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

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Sessions quotidiennes">
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

