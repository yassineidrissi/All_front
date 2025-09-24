import PropTypes from "prop-types";

export default function ColumnChart({ data, width = 600, height = 240, valueKey = "value", labelKey = "label" }) {
  const padding = 40;
  const maxValue = Math.max(...data.map((item) => Number(item[valueKey]) || 0), 1);
  const usableWidth = width - padding * 2;
  const columnWidth = data.length > 0 ? usableWidth / data.length - 8 : 20;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Histogramme">
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" />
      {data.map((item, index) => {
        const value = Number(item[valueKey]) || 0;
        const ratio = value / maxValue;
        const barHeight = ratio * (height - padding * 1.5);
        const x = padding + index * (usableWidth / Math.max(1, data.length)) + 4;
        const y = height - padding - barHeight;
        return (
          <g key={`${item[labelKey]}-${index}`}>
            <rect x={x} y={y} width={Math.max(8, columnWidth)} height={barHeight} fill="#0ea5e9" rx={6} />
            <text x={x + Math.max(8, columnWidth) / 2} y={height - padding + 16} fontSize="10" textAnchor="middle" fill="#475569">
              {item[labelKey]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

ColumnChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  valueKey: PropTypes.string,
  labelKey: PropTypes.string,
};

