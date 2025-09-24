import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

const PRESETS = [
  { label: "7 jours", value: "7d" },
  { label: "30 jours", value: "30d" },
  { label: "90 jours", value: "90d" },
  { label: "Personnalisé", value: "custom" },
];

export default function TimeRangePicker({ value, onChange }) {
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

