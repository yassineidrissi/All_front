import { NavLink, Outlet } from "react-router-dom";
import TopRightUserMenu from "../../components/TopRightUserMenu";

const tabs = [
  { to: "/results", label: "Tableau de bord", exact: true },
  { to: "/results/students", label: "Étudiants" },
  { to: "/results/admin", label: "Administration" },
];

export default function ResultsLayout() {
  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4">
        <header className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Résultats</p>
              <h1 className="text-3xl font-bold text-slate-900">Espace de pilotage</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Suivez les indicateurs clés, analysez les progrès des étudiants et gérez les données
                collectées par la plateforme.
              </p>
            </div>
            <TopRightUserMenu className="shrink-0" />
          </div>
          <nav aria-label="Navigation des résultats">
            <ul className="flex flex-wrap gap-3">
              {tabs.map((tab) => (
                <li key={tab.to}>
                  <NavLink
                    to={tab.to}
                    end={tab.exact}
                    className={({ isActive }) =>
                      `inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        isActive
                          ? "border-indigo-500 bg-indigo-500 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                      }`
                    }
                  >
                    {tab.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <main className="pb-12">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

