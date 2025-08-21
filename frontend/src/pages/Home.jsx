// src/pages/Home.jsx
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      logout();
    }
  };

  return (
    <main
      className="wrap"
      role="main"
      aria-label="Home"
      style={{
        width: "min(980px,94%)",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 10px 30px rgba(35,31,58,0.08)",
        padding: "28px",
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gap: "24px",
        alignItems: "center",
      }}
    >
      {/* HERO SECTION */}
      <section className="hero" style={{ padding: "8px 16px" }}>
        <img src={logo} alt="Logo" className="logo" style={{ maxHeight: "56px" }} />
        <h1 style={{ margin: "0 0 8px", color: "#4b1d8f", fontSize: "1.4rem" }}>
          Plateforme P-2
        </h1>
        <p className="lead" style={{ margin: 0, color: "#666" }}>
          Choisissez l'application à lancer : simulation virtuelle ou outil de chat pour feedback réflexif.
        </p>

        {/* Welcome message */}
        <div
          style={{
            margin: "16px 0",
            padding: "12px",
            background: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #e9ecef",
          }}
        >
          <p style={{ margin: 0, color: "#495057", fontSize: "0.9rem" }}>
            👋 Bienvenue, <strong>{user?.name}</strong>!
          </p>
          <p style={{ margin: "4px 0 0", color: "#6c757d", fontSize: "0.85rem" }}>
            Email: {user?.email}
          </p>
        </div>

        <div
          className="buttons"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "18px",
          }}
        >
          <div className="info" style={{ fontSize: "0.85rem", color: "#444", marginTop: "10px" }}>
            Ouvrir la simulation virtuelle
          </div>

          <Link
            className="btn primary"
            to="/simulation"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 16px",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: 600,
              background: "linear-gradient(90deg,#5b2fbf,#3b1b8a)",
              color: "#fff",
            }}
          >
            Virtual Simulation
          </Link>

          <div className="info" style={{ fontSize: "0.85rem", color: "#444", marginTop: "8px" }}>
            Ouvrir l'interface de chat locale
          </div>

          <Link
            className="btn ghost"
            to="/chat"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 16px",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: 700,
              background: "transparent",
              color: "#4b1d8f",
              border: "2px solid rgba(75,29,143,0.12)",
            }}
          >
            Chat Platform
          </Link>
        </div>
      </section>

      {/* ASIDE SECTION */}
      <aside
        className="actions"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          alignItems: "stretch",
        }}
      >
        {/* User Profile Card */}
        <div
          style={{
            padding: "16px",
            background: "#fff",
            borderRadius: "8px",
            border: "2px solid #e3f2fd",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <strong style={{ color: "#2c3e50", fontSize: "0.95rem" }}>
                {user?.name}
              </strong>
              <p style={{ margin: 0, color: "#666", fontSize: "0.8rem" }}>Connecté</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "6px",
              border: "1px solid #dc3545",
              background: "#fff",
              color: "#dc3545",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "500",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.target.style.background = "#dc3545";
              e.target.style.color = "#fff";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "#fff";
              e.target.style.color = "#dc3545";
            }}
          >
            🚪 Se déconnecter
          </button>
        </div>

        {/* Notes */}
        <div style={{ padding: "12px", background: "#fbfbfe", borderRadius: "8px" }}>
          <strong>Notes</strong>
          <p style={{ margin: "8px 0 0", color: "#666", fontSize: "0.92rem" }}>
            - If you run a static server from repo root, open <code>/</code>.
            <br />
            - If backend serves root, ensure it serves this page.
          </p>
        </div>

        {/* Quick commands */}
        <div
          style={{
            padding: "12px",
            background: "#fff",
            borderRadius: "8px",
            border: "1px solid #f0eff8",
            color: "#666",
            fontSize: "0.88rem",
          }}
        >
          Quick commands:
          <pre
            style={{
              margin: "8px 0 0",
              fontSize: "0.82rem",
              lineHeight: "1.3",
              color: "#222",
              background: "transparent",
              border: 0,
              padding: 0,
            }}
          >
            {`# serve root with http-server
npx http-server -p 8080

# or with backend (Express) ensure it serves /index.html`}
          </pre>
        </div>
      </aside>
    </main>
  );
}
