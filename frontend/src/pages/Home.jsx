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
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 16px",
        backgroundImage:
          "linear-gradient(135deg, rgba(231, 240, 255, 0.9) 0%, rgba(245, 238, 255, 0.95) 50%, rgba(232, 244, 250, 0.9) 100%)",
      }}
    >
      <main
        className="wrap"
        role="main"
        aria-label="Home"
        style={{
          width: "min(1040px,94%)",
          margin: "0 auto",
          background: "rgba(255,255,255,0.95)",
          borderRadius: "16px",
          boxShadow: "0 25px 60px rgba(31, 38, 135, 0.15)",
          padding: "36px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 320px",
          gap: "28px",
          alignItems: "stretch",
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255,255,255,0.6)",
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

          {/* ✅ Show admin dashboard link only if user is admin */}
          {user?.is_admin && (
            <>
              <div
                className="info"
                style={{ fontSize: "0.85rem", color: "#444", marginTop: "8px" }}
              >
                Admin Tools
              </div>
              <Link
                className="btn ghost"
                to="/admin/dashboard"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: 700,
                  background: "transparent",
                  color: "#d63384",
                  border: "2px solid rgba(214,51,132,0.25)",
                }}
              >
                ⚡ Admin Dashboard
              </Link>
            </>
          )}
        </div>
      </section>

      {/* ASIDE SECTION */}
      <aside
        className="actions"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
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
        <div
          style={{
            padding: "18px",
            background: "linear-gradient(160deg, rgba(243, 245, 255, 0.95), rgba(237, 248, 255, 0.95))",
            borderRadius: "12px",
            border: "1px solid rgba(111, 136, 255, 0.18)",
            boxShadow: "0 12px 30px rgba(79, 70, 229, 0.08)",
            color: "#394150",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#4338ca" }}>Notes</h3>
          <p style={{ margin: "12px 0", fontSize: "0.9rem", lineHeight: 1.6 }}>
            Plateforme P-2 combine des simulations immersives et un outil de chat pour le
            feedback réflexif. Utilisez ces espaces pour préparer vos sessions, capturer des
            observations et suivre les indicateurs clés du tableau de bord administrateur.
          </p>
          <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#312e81" }}>
            Aperçu des données suivies :
          </div>
          <ul style={{ margin: "10px 0 0", padding: "0 0 0 18px", fontSize: "0.88rem", lineHeight: 1.6 }}>
            <li style={{ marginBottom: "6px" }}>
              <strong>Sessions de simulation :</strong> suivi du prompt, de la durée passée et des
              temps de réponse (OpenAI, ElevenLabs, synchronisation labiale).
            </li>
            <li style={{ marginBottom: "6px" }}>
              <strong>Sessions de chat :</strong> comparaison des prompts utilisateur et IA, ainsi que
              les scores de feedback attribués par chaque partie.
            </li>
            <li>
              <strong>Variables d'étude :</strong> longueur du prompt, temps vers le premier token
              (TFFT) et score IPQ pour analyser la présence et l'engagement des utilisateurs.
            </li>
          </ul>
        </div>

        {/* Quick commands */}
        <div
          style={{
            padding: "16px",
            background: "rgba(255,255,255,0.9)",
            borderRadius: "12px",
            border: "1px solid rgba(229, 231, 235, 0.8)",
            color: "#4b5563",
            fontSize: "0.88rem",
            boxShadow: "0 10px 22px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div style={{ fontWeight: 600, color: "#1f2937" }}>Commandes rapides</div>
          <pre
            style={{
              margin: "10px 0 0",
              fontSize: "0.82rem",
              lineHeight: "1.45",
              color: "#1f2937",
              background: "rgba(241, 245, 249, 0.65)",
              borderRadius: "8px",
              padding: "12px",
            }}
          >
            {`# Lancer un serveur statique à la racine
npx http-server -p 8080

# Veiller à servir /index.html côté backend (Express)`}
          </pre>
        </div>
      </aside>
    </main>
    </div>
  );
}
