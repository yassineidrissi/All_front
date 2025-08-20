// import { Link } from "react-router-dom";

// export default function Home() {
//     return (
//         <main
//             className="wrap"
//             role="main"
//             aria-label="Home"
//             style={{
//                 width: "min(980px,94%)",
//                 background: "#fff",
//                 borderRadius: "12px",
//                 boxShadow: "0 10px 30px rgba(35,31,58,0.08)",
//                 padding: "28px",
//                 display: "grid",
//                 gridTemplateColumns: "1fr 320px",
//                 gap: "24px",
//                 alignItems: "center",
//             }}
//         >
//             {/* HERO SECTION */}
//             <section className="hero" style={{ padding: "8px 16px" }}>
//                 <img src="/chat_front/logo.png" alt="Logo" className="logo" style={{ maxHeight: "56px" }} />
//                 <h1 style={{ margin: "0 0 8px", color: "#4b1d8f", fontSize: "1.4rem" }}>Plateforme P-2</h1>
//                 <p className="lead" style={{ margin: 0, color: "#666" }}>
//                     Choisissez l'application à lancer : simulation virtuelle ou outil de chat pour feedback réflexif.
//                 </p>

//                 <div className="buttons" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "18px" }}>
//                     <div className="info" style={{ fontSize: "0.85rem", color: "#444", marginTop: "10px" }}>
//                         Ouvrir la simulation virtuelle
//                     </div>
//                     <a
//                         className="btn primary"
//                         href="https://fondationleoniechaptal.vercel.app/"
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         style={{
//                             display: "inline-flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             padding: "12px 16px",
//                             borderRadius: "10px",
//                             textDecoration: "none",
//                             fontWeight: 600,
//                             background: "linear-gradient(90deg,#5b2fbf,#3b1b8a)",
//                             color: "#fff",
//                         }}
//                     >
//                         Virtual Simulation
//                     </a>

//                     <div className="info" style={{ fontSize: "0.85rem", color: "#444", marginTop: "8px" }}>
//                         Ouvrir l'interface de chat locale
//                     </div>
//                     {/* React Router navigation instead of <a href="./chat.html"> */}
//                     <Link
//                         className="btn ghost"
//                         to="/chat"
//                         style={{
//                             display: "inline-flex",
//                             alignItems: "center",
//                             justifyContent: "center",
//                             padding: "12px 16px",
//                             borderRadius: "10px",
//                             textDecoration: "none",
//                             fontWeight: 700,
//                             background: "transparent",
//                             color: "#4b1d8f",
//                             border: "2px solid rgba(75,29,143,0.12)",
//                         }}
//                     >
//                         Chat Platform
//                     </Link>
//                 </div>
//             </section>

//             {/* ASIDE SECTION */}
//             <aside
//                 className="actions"
//                 style={{
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "12px",
//                     alignItems: "stretch",
//                 }}
//             >
//                 <div style={{ padding: "12px", background: "#fbfbfe", borderRadius: "8px" }}>
//                     <strong>Notes</strong>
//                     <p style={{ margin: "8px 0 0", color: "#666", fontSize: "0.92rem" }}>
//                         - If you run a static server from repo root, open <code>/</code>.
//                         <br />- If backend serves root, ensure it serves this page.
//                     </p>
//                 </div>
//                 <div
//                     style={{
//                         padding: "12px",
//                         background: "#fff",
//                         borderRadius: "8px",
//                         border: "1px solid #f0eff8",
//                         color: "#666",
//                         fontSize: "0.88rem",
//                     }}
//                 >
//                     Quick commands:
//                     <pre
//                         style={{
//                             margin: "8px 0 0",
//                             fontSize: "0.82rem",
//                             lineHeight: "1.3",
//                             color: "#222",
//                             background: "transparent",
//                             border: 0,
//                             padding: 0,
//                         }}
//                     >
//                         {`# serve root with http-server
// npx http-server -p 8080

// # or with backend (Express) ensure it serves /index.html`}
//                     </pre>
//                 </div>
//             </aside>
//         </main>
//     );
// }

import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Home() {
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
        <h1 style={{ margin: "0 0 8px", color: "#4b1d8f", fontSize: "1.4rem" }}>Plateforme P-2</h1>
        <p className="lead" style={{ margin: 0, color: "#666" }}>
          Choisissez l'application à lancer : simulation virtuelle ou outil de chat pour feedback réflexif.
        </p>

        <div className="buttons" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "18px" }}>
          <div className="info" style={{ fontSize: "0.85rem", color: "#444", marginTop: "10px" }}>
            Ouvrir la simulation virtuelle
          </div>
          {/* Use React Router Link instead of external URL */}
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
        <div style={{ padding: "12px", background: "#fbfbfe", borderRadius: "8px" }}>
          <strong>Notes</strong>
          <p style={{ margin: "8px 0 0", color: "#666", fontSize: "0.92rem" }}>
            - If you run a static server from repo root, open <code>/</code>.<br />
            - If backend serves root, ensure it serves this page.
          </p>
        </div>
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
