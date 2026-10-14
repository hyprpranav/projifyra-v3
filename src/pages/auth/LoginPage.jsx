import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react";
import { loginUser, friendlyAuthError } from "../../services/authService";
import "../../styles/auth.css";

const AUTH_FEATURES = [
  "Submit project ideas and requests",
  "Track project progress in real time",
  "Access hardware and software projects",
  "Get documentation and guidance support",
];

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // loginUser returns {user, userData}; AuthContext handles role redirect
      await loginUser(form.email, form.password);
      // Navigation is handled by AuthContext → ProtectedRoute redirect
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left Panel */}
      <div className="auth-left" aria-hidden="true">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "var(--space-2)" }}>
          <img src="/logo.png" alt="PROJIFYRA" style={{ width: "42px", height: "42px", objectFit: "contain", filter: "drop-shadow(0 2px 10px rgba(99,91,255,0.4))" }} />
          <div>
            <div className="auth-brand-name" style={{ marginBottom: 0 }}>PROJIFYRA</div>
            <div className="auth-brand-tagline">Projects. Guidance. Progress.</div>
          </div>
        </div>
        <h2 className="auth-left-heading">
          Welcome Back to Your Project Dashboard
        </h2>
        <p className="auth-left-desc">
          Log in to access your projects, track progress, and connect with your project team.
        </p>
        <div className="auth-features">
          {AUTH_FEATURES.map((f) => (
            <div key={f} className="auth-feature">
              <div className="auth-feature-dot" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-form-card animate-fade-up">
          <div className="auth-form-header">
            <Link to="/" className="auth-form-back">
              <ArrowLeft size={16} />
              Back to home
            </Link>
            <h1 className="auth-form-title">Sign in</h1>
            <p className="auth-form-subtitle">
              Log in to your PROJIFYRA account
            </p>
          </div>

          {error && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: "var(--space-5)" }}>
              <AlertCircle size={18} aria-hidden="true" />
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Email address <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                className="form-control"
                placeholder="you@email.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
                aria-required="true"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">
                Password <span className="required" aria-hidden="true">*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  className="form-control"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  style={{ paddingRight: "2.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: "0.75rem", top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", color: "var(--color-text-secondary)", cursor: "pointer",
                    display: "flex", padding: "4px",
                  }}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="auth-switch">
            Don't have an account?{" "}
            <Link to="/register">Create Account</Link>
          </div>

          <div style={{ textAlign: "center", marginTop: "14px", fontSize: "13px" }}>
            <Link to="/register-officer" style={{ color: "var(--color-text-secondary)", textDecoration: "none" }}>
              Technical Officer? <strong style={{ color: "var(--color-primary)" }}>Apply Here</strong>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
