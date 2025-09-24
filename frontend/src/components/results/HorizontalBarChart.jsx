import PropTypes from "prop-types";

export default function HorizontalBarChart({ data, valueKey = "value", labelKey = "label", maxLabelWidth = 160 }) {
  const maxValue = Math.max(...data.map((item) => Math.abs(Number(item[valueKey]) || 0)), 1);

  return (
    <div className="space-y-2">
      {data.map((item) => {
        const value = Number(item[valueKey]) || 0;
        const magnitude = Math.abs(value);
        const percentage = Math.max(2, Math.round((magnitude / maxValue) * 100));
        return (
          <div key={item[labelKey]} className="flex items-center gap-3">
            <div className="w-[140px] text-xs font-medium text-slate-600" style={{ maxWidth: maxLabelWidth }}>
              {item[labelKey]}
            </div>
            <div className="flex-1 rounded-full bg-slate-100">
              <div
                className="rounded-full bg-emerald-500 px-3 py-1 text-right text-xs font-semibold text-white"
                style={{ width: `${percentage}%` }}
              >
                {value > 0 ? "+" : ""}{value.toFixed(2)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

HorizontalBarChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  valueKey: PropTypes.string,
  labelKey: PropTypes.string,
  maxLabelWidth: PropTypes.number,
};

