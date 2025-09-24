import PropTypes from "prop-types";
import { formatDate } from "../../lib/results/utils";
import LineTrendChart from "./LineTrendChart";
import ColumnChart from "./ColumnChart";

export default function StudentCharts({ series }) {
  const chartData = series.map((session) => ({
    ...session,
    label: formatDate(session.timestamp),
  }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <header className="mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Δ BRESTScore</h3>
          <p className="text-xs text-slate-500">Variation du score session par session</p>
        </header>
        <div className="h-72">
          <LineTrendChart data={chartData.map((item) => ({ ...item, value: item.deltaBrestScore, label: item.label }))} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <header className="mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Temps passé par session</h3>
          <p className="text-xs text-slate-500">Durée totale en minutes</p>
        </header>
        <div className="h-72">
          <ColumnChart
            data={chartData.map((item) => ({ ...item, value: item.timeSpentSec, label: item.label }))}
            valueKey="value"
          />
        </div>
      </section>
    </div>
  );
}

StudentCharts.propTypes = {
  series: PropTypes.arrayOf(
    PropTypes.shape({
      timestamp: PropTypes.string.isRequired,
      BrestScore: PropTypes.number.isRequired,
      deltaBrestScore: PropTypes.number,
      timeSpentSec: PropTypes.number.isRequired,
    })
  ).isRequired,
};

