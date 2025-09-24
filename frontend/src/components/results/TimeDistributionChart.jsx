import PropTypes from "prop-types";
import { formatDuration } from "../../lib/results/utils";

export default function TimeDistributionChart({ data }) {
  const total = data.reduce((sum, item) => sum + (item.totalTimeSec || 0), 0);
  let currentAngle = 0;
  const segments = data.map((item) => {
    const ratio = total === 0 ? 0 : (item.totalTimeSec || 0) / total;
    const startAngle = currentAngle;
    const degrees = ratio * 360;
    currentAngle += degrees;
    return {
      ...item,
      ratio,
      startAngle,
      degrees,
    };
  });

  const gradient = segments
    .map((segment, index) => {
      const start = segment.startAngle;
      const end = segment.startAngle + segment.degrees;
      const color = colors[index % colors.length];
      return `${color} ${start}deg ${end}deg`;
    })
    .join(", ");

  return (
    <div className="flex flex-col items-center gap-4 lg:flex-row">
      <div
        className="relative h-56 w-56 rounded-full"
        style={{ background: `conic-gradient(${gradient || "#e2e8f0 0deg 360deg"})` }}
        aria-hidden
      >
        <div className="absolute inset-[20%] rounded-full bg-white shadow-inner" />
      </div>
      <ul className="flex-1 space-y-2 text-sm text-slate-600">
        {segments.map((segment, index) => (
          <li
            key={segment.studentId}
            className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
            style={{ borderLeft: `4px solid ${colors[index % colors.length]}` }}
          >
            <span className="font-medium text-slate-700">{segment.name}</span>
            <span>
              {formatDuration(segment.totalTimeSec)} · {(segment.ratio * 100 || 0).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const colors = ["#6366f1", "#22d3ee", "#f97316", "#f43f5e", "#10b981", "#8b5cf6", "#0ea5e9", "#fb7185"];

TimeDistributionChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      studentId: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      totalTimeSec: PropTypes.number.isRequired,
    })
  ).isRequired,
};

