import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import OfficerRegisterPage from "./pages/auth/OfficerRegisterPage";
import ClientDashboard from "./pages/dashboard/ClientDashboard";
import OfficerDashboard from "./pages/dashboard/OfficerDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import { ProtectedRoute, PublicOnlyRoute } from "./components/auth/ProtectedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication Routes (Public Only) */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <RegisterPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register-officer"
            element={
              <PublicOnlyRoute>
                <OfficerRegisterPage />
              </PublicOnlyRoute>
            }
          />

          {/* Client Dashboard Routes */}
          <Route
            path="/dashboard/*"
            element={
              <ErrorBoundary>
                <ProtectedRoute allowedRoles={["client"]}>
                  <ClientDashboard />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />

          {/* Officer Dashboard Routes */}
          <Route
            path="/officer/*"
            element={
              <ErrorBoundary>
                <ProtectedRoute allowedRoles={["officer", "admin"]}>
                  <OfficerDashboard />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />

          {/* Main Admin Dashboard Routes */}
          <Route
            path="/admin/*"
            element={
              <ErrorBoundary>
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          />

          {/* Catch-all fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
