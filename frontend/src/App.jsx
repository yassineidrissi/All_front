
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import AuthPage from "./pages/Auth";
import Simulation from "./pages/Simulation";
// import "./index.css"; // <-- Tailwind CSS import


export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public route - Login page */}
          <Route path="/login" element={<AuthPage />} />
          
          {/* Protected routes - require authentication */}
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          
          <Route path="/chat" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          
          <Route path="/simulation" element={
            <ProtectedRoute>
              <Simulation />
            </ProtectedRoute>
          } />
          
          {/* Catch all route - redirect to home if authenticated, login if not */}
          <Route path="*" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}