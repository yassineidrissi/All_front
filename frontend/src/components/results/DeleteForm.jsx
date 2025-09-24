import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import StudentsSearch from "./StudentsSearch";

export default function DeleteForm({
  scope,
  onScopeChange,
  studentQuery,
  onStudentQueryChange,
  students,
  onSelectStudent,
  selectedStudent,
  dateRange,
  onDateRangeChange,
  isLoadingStudents,
  studentError,
}) {
  const [localFrom, setLocalFrom] = useState(dateRange?.from || "");
  const [localTo, setLocalTo] = useState(dateRange?.to || "");

  useEffect(() => {
    if (scope === "dateRange") {
      onDateRangeChange({ from: localFrom, to: localTo });
    }
  }, [scope, localFrom, localTo, onDateRangeChange]);

  useEffect(() => {
    setLocalFrom(dateRange?.from || "");
    setLocalTo(dateRange?.to || "");
  }, [dateRange]);

  return (
    <form className="space-y-6">
      <fieldset className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <legend className="text-sm font-semibold text-slate-700">Portée de la suppression</legend>
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 hover:border-rose-300">
            <input
              type="radio"
              name="scope"
              value="all"
              checked={scope === "all"}
              onChange={(event) => onScopeChange(event.target.value)}
              className="text-rose-500 focus:ring-rose-400"
            />
            <div>
              <p className="font-semibold">Toutes les données</p>
              <p className="text-xs text-slate-500">Supprime l'ensemble des sessions enregistrées.</p>
            </div>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 hover:border-rose-300">
            <input
              type="radio"
              name="scope"
              value="student"
              checked={scope === "student"}
              onChange={(event) => onScopeChange(event.target.value)}
              className="text-rose-500 focus:ring-rose-400"
            />
            <div>
              <p className="font-semibold">Par étudiant</p>
              <p className="text-xs text-slate-500">Supprime uniquement les sessions du profil sélectionné.</p>
            </div>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 hover:border-rose-300">
            <input
              type="radio"
              name="scope"
              value="dateRange"
              checked={scope === "dateRange"}
              onChange={(event) => onScopeChange(event.target.value)}
              className="text-rose-500 focus:ring-rose-400"
            />
            <div>
              <p className="font-semibold">Par période</p>
              <p className="text-xs text-slate-500">Supprime les sessions dont la date est comprise dans l'intervalle.</p>
            </div>
          </label>
        </div>
      </fieldset>

      {scope === "student" && (
        <StudentsSearch
          query={studentQuery}
          onQueryChange={onStudentQueryChange}
          results={students}
          onSelect={onSelectStudent}
          selectedId={selectedStudent?.id || null}
          isLoading={isLoadingStudents}
          error={studentError}
        />
      )}

      {scope === "dateRange" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-slate-700">Sélectionnez la période concernée</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col text-xs font-medium text-slate-600">
              Du
              <input
                type="date"
                value={localFrom}
                onChange={(event) => setLocalFrom(event.target.value)}
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </label>
            <label className="flex flex-col text-xs font-medium text-slate-600">
              Au
              <input
                type="date"
                value={localTo}
                onChange={(event) => setLocalTo(event.target.value)}
                className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </label>
          </div>
        </div>
      )}
    </form>
  );
}

DeleteForm.propTypes = {
  scope: PropTypes.oneOf(["all", "student", "dateRange"]).isRequired,
  onScopeChange: PropTypes.func.isRequired,
  studentQuery: PropTypes.string.isRequired,
  onStudentQueryChange: PropTypes.func.isRequired,
  students: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      lastActivity: PropTypes.string,
    })
  ).isRequired,
  onSelectStudent: PropTypes.func.isRequired,
  selectedStudent: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }),
  dateRange: PropTypes.shape({
    from: PropTypes.string,
    to: PropTypes.string,
  }),
  onDateRangeChange: PropTypes.func.isRequired,
  isLoadingStudents: PropTypes.bool,
  studentError: PropTypes.string,
};

