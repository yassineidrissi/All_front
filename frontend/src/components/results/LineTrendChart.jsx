import PropTypes from "prop-types";

export default function LineTrendChart({ data, width = 600, height = 240, valueKey = "value", labelKey = "label" }) {
  const padding = 40;
  const maxValue = Math.max(...data.map((item) => Number(item[valueKey]) || 0), 1);
  const minValue = Math.min(...data.map((item) => Number(item[valueKey]) || 0), 0);
  const range = maxValue - minValue || 1;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 1.5;

  const points = data.map((item, index) => {
    const ratio = data.length > 1 ? index / (data.length - 1) : 0.5;
    const x = padding + ratio * usableWidth;
    const value = Number(item[valueKey]) || 0;
    const y = height - padding - ((value - minValue) / range) * usableHeight;
    return { ...item, x, y, value };
  });

  const zeroRatio = (0 - minValue) / range;
  const baselineInRange = zeroRatio >= 0 && zeroRatio <= 1;
  const baselineY = height - padding - zeroRatio * usableHeight;
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Tendance">
      {baselineInRange && (
        <line x1={padding} y1={baselineY} x2={width - padding} y2={baselineY} stroke="#e2e8f0" strokeDasharray="4 4" />
      )}
      <path d={path} fill="none" stroke="#6366f1" strokeWidth="2" />
      {points.map((point, index) => (
        <circle key={`${point[labelKey]}-${index}`} cx={point.x} cy={point.y} r={4} fill="#4338ca" />
      ))}
      {points.map((point, index) => (
        <text key={`${point[labelKey]}-label-${index}`} x={point.x} y={height - padding + 16} fontSize="10" textAnchor="middle" fill="#475569">
          {point[labelKey]}
        </text>
      ))}
    </svg>
  );
}

LineTrendChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  valueKey: PropTypes.string,
  labelKey: PropTypes.string,
};

