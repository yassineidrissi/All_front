import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Simulation from "./pages/Simulation";

// import "./index.css"; // <-- Tailwind CSS import

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/simulation" element={<Simulation />} />
      </Routes>
    </Router>
  );
}
