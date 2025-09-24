import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { formatDate } from "../../lib/results/utils";

export default function StudentsSearch({
  query,
  onQueryChange,
  results,
  onSelect,
  selectedId,
  isLoading,
  error,
}) {
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]');
    if (active) {
      active.scrollIntoView({ block: "nearest" });
    }
  }, [selectedId, results]);

  return (
    <section aria-label="Recherche étudiants" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <label className="flex-grow" htmlFor="students-search">
          <span className="sr-only">Rechercher un étudiant</span>
          <input
            id="students-search"
            type="search"
            value={query}
            placeholder="Rechercher par nom ou identifiant..."
            onChange={(event) => onQueryChange(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </label>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        {isLoading && "Chargement..."}
        {error && <span className="text-rose-500">{error}</span>}
        {!isLoading && !error && results.length === 0 && <span>Aucun étudiant trouvé.</span>}
      </div>

      <ul
        ref={listRef}
        className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-slate-100"
        role="listbox"
        aria-label="Résultats"
      >
        {results.map((student) => {
          const isActive = selectedId === student.id;
          return (
            <li
              key={student.id}
              role="option"
              aria-selected={isActive}
              data-active={isActive}
              tabIndex={0}
              className={`cursor-pointer px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isActive ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50"
              }`}
              onClick={() => onSelect(student)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(student);
                }
              }}
            >
              <p className="font-semibold">{student.name}</p>
              <p className="text-xs text-slate-500">{student.id}</p>
              <p className="text-xs text-slate-500">
                Dernière activité : {student.lastActivity ? formatDate(student.lastActivity) : "—"}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

StudentsSearch.propTypes = {
  query: PropTypes.string.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  results: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      lastActivity: PropTypes.string,
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  selectedId: PropTypes.string,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
};

