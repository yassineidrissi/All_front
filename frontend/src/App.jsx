import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Chat from "./pages/Chat";
import AuthPage from "./pages/Auth";
import Simulation from "./pages/Simulation";
import AdminDashboard from "./pages/Dashboard"; // Admin dashboard page
import ResultsLayout from "./pages/results/ResultsLayout";
import DashboardPage from "./pages/results/DashboardPage";
import StudentsPage from "./pages/results/StudentsPage";
import AdminPage from "./pages/results/AdminPage";

// --- AdminRoute wrapper ---
function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return <Navigate to="/" replace />; // redirect non-admins
  }

  return children;
}

// --- Main App ---
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public route - Login page */}
          <Route path="/login" element={<AuthPage />} />

          {/* Protected routes - require authentication */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/simulation"
            element={
              <ProtectedRoute>
                <Simulation />
              </ProtectedRoute>
            }
          />

          {/* Admin-only route */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/results"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <ResultsLayout />
                </AdminRoute>
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>

          {/* Catch-all route */}
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
