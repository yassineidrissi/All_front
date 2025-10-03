import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function TopRightUserMenu({ className = "", style }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      logout();
    }
  };

  const isHome = location.pathname === "/";

  return (
    <div className={`top-right-user-menu ${className}`.trim()} style={style}>
      <Link
        to="/"
        className={`top-right-user-menu__link ${isHome ? "top-right-user-menu__link--active" : ""}`.trim()}
      >
        Accueil
      </Link>
      <span className="top-right-user-menu__greeting">
        Bonjour, {user?.name || "Utilisateur"}
      </span>
      <button type="button" className="top-right-user-menu__logout" onClick={handleLogout}>
        Déconnexion
      </button>
    </div>
  );
}
