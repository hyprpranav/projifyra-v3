import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ProjifyraLoader from "../common/ProjifyraLoader";

// Full-page loading screen shown while auth state resolves
function AuthLoading() {
  return (
    <ProjifyraLoader
      fullScreen
      size="lg"
      label="Authenticating session & engineering portal..."
    />
  );
}

// ProtectedRoute — requires authentication, optional role check
export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { currentUser, userProfile, authLoading, role } = useAuth();
  const location = useLocation();

  if (authLoading) return <AuthLoading />;

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Only redirect if role is explicitly mismatched and user is not already on that dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    if (role === "admin" && !location.pathname.startsWith("/admin")) {
      return <Navigate to="/admin" replace />;
    }
    if (role === "officer" && !location.pathname.startsWith("/officer")) {
      return <Navigate to="/officer" replace />;
    }
    if (role === "client" && !location.pathname.startsWith("/dashboard")) {
      return <Navigate to="/dashboard" replace />;
    }
    // Prevent redirecting to the same route if already on /dashboard
    if (!location.pathname.startsWith("/dashboard")) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

// PublicOnlyRoute — redirects logged-in users away from login/register
export function PublicOnlyRoute({ children }) {
  const { currentUser, userProfile, authLoading, role } = useAuth();

  if (authLoading) return <AuthLoading />;

  if (currentUser) {
    if (role === "admin") return <Navigate to="/admin" replace />;
    if (role === "officer") return <Navigate to="/officer" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
