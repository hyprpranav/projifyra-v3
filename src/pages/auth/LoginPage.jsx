import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Eye, EyeOff, AlertCircle, MessageSquare,
  X, CheckCircle2, Send, HelpCircle, Phone, Mail, User
} from "lucide-react";
import { loginUser, friendlyAuthError } from "../../services/authService";
import { submitClientIssue } from "../../services/issueService";
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
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  // Mini Chat Corner / Issue Modal State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatForm, setChatForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: "Idea Approval Inquiry",
    message: "",
  });
  const [chatSubmitting, setChatSubmitting] = useState(false);
  const [chatSuccess, setChatSuccess] = useState(false);
  const [chatError, setChatError] = useState("");

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (error) {
      setError("");
      setIsPendingApproval(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");
    setIsPendingApproval(false);
    try {
      await loginUser(form.email, form.password);
    } catch (err) {
      const msg = err.message || friendlyAuthError(err);
      setError(msg);
      if (err.isPendingApproval || msg.toLowerCase().includes("under approval") || msg.toLowerCase().includes("pending")) {
        setIsPendingApproval(true);
        setChatForm((prev) => ({
          ...prev,
          email: form.email,
          message: prev.message || "Hello Admin, I have submitted my idea with this email. Please check and approve my project account.",
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = () => {
    setChatForm((prev) => ({
      ...prev,
      email: form.email || prev.email,
      message: isPendingApproval && !prev.message
        ? "Hello Admin, I have submitted my idea with this email. Please check and approve my project account."
        : prev.message,
    }));
    setChatSuccess(false);
    setChatError("");
    setChatOpen(true);
  };

  const handleSendIssue = async (e) => {
    e.preventDefault();
    if (!chatForm.email.trim() || !chatForm.message.trim()) {
      setChatError("Please enter your email and message.");
      return;
    }

    setChatSubmitting(true);
    setChatError("");
    try {
      await submitClientIssue({
        name: chatForm.name.trim() || "Student",
        email: chatForm.email.trim(),
        phone: chatForm.phone.trim(),
        category: chatForm.category,
        message: chatForm.message.trim(),
      });
      setChatSuccess(true);
      setTimeout(() => {
        setChatOpen(false);
        setChatSuccess(false);
        setChatForm({
          name: "",
          email: "",
          phone: "",
          category: "Idea Approval Inquiry",
          message: "",
        });
      }, 3500);
    } catch (err) {
      setChatError("Failed to deliver message: " + err.message);
    } finally {
      setChatSubmitting(false);
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
            <div
              className={`alert ${isPendingApproval ? "alert-warning" : "alert-error"}`}
              role="alert"
              style={{
                marginBottom: "var(--space-5)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 600 }}>{error}</span>
              </div>

              {isPendingApproval && (
                <div style={{ marginTop: "4px" }}>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={handleOpenChat}
                    style={{
                      background: "var(--color-primary)",
                      color: "#fff",
                      border: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <MessageSquare size={14} /> Open Chat Corner / Contact Admin
                  </button>
                </div>
              )}
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

      {/* Floating Chat / Help Button in Bottom Right */}
      <button
        type="button"
        onClick={handleOpenChat}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          background: "var(--color-primary)",
          color: "#ffffff",
          border: "none",
          borderRadius: "999px",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontWeight: 700,
          fontSize: "14px",
          boxShadow: "0 4px 20px rgba(99, 91, 255, 0.4)",
          cursor: "pointer",
          zIndex: 100,
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        aria-label="Open support chat corner"
      >
        <MessageSquare size={18} />
        <span>Chat with Admin</span>
      </button>

      {/* Mini Chat Corner / Issue Reporting Modal */}
      {chatOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
          }}
        >
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "var(--shadow-xl)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "var(--space-5) var(--space-6)",
                background: "linear-gradient(135deg, rgba(99, 91, 255, 0.12), rgba(139, 92, 246, 0.08))",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "var(--color-primary)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "var(--color-text)" }}>
                    Admin Support Corner
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                    Direct message to PROJIFYRA Admin Desk
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setChatOpen(false)}
                style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "var(--space-6)" }}>
              {chatSuccess ? (
                <div style={{ textAlign: "center", padding: "var(--space-4)" }}>
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "rgba(16, 185, 129, 0.12)",
                      color: "#10B981",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto var(--space-4)",
                    }}
                  >
                    <CheckCircle2 size={36} />
                  </div>
                  <h4 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text)", marginBottom: "8px" }}>
                    Message Delivered!
                  </h4>
                  <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
                    Your message has been received by the Admin Desk. We will review your idea approval request and contact you directly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendIssue}>
                  {chatError && (
                    <div className="alert alert-error" style={{ marginBottom: "var(--space-4)", padding: "8px 12px", fontSize: "12px" }}>
                      <AlertCircle size={14} />
                      <span>{chatError}</span>
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: "var(--space-4)" }}>
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Your Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Soban N"
                      value={chatForm.name}
                      onChange={(e) => setChatForm({ ...chatForm, name: e.target.value })}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="you@email.com"
                        value={chatForm.email}
                        onChange={(e) => setChatForm({ ...chatForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="10-digit mobile"
                        value={chatForm.phone}
                        onChange={(e) => setChatForm({ ...chatForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: "var(--space-4)" }}>
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Topic / Category</label>
                    <select
                      className="form-control"
                      value={chatForm.category}
                      onChange={(e) => setChatForm({ ...chatForm, category: e.target.value })}
                    >
                      <option value="Idea Approval Inquiry">Idea Approval Inquiry</option>
                      <option value="Website Issue">Website or Technical Issue</option>
                      <option value="Payment Query">Payment / Pricing Inquiry</option>
                      <option value="General Issue">General Question / Other</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: "var(--space-5)" }}>
                    <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>Message to Admin *</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Describe your query or issue in detail..."
                      value={chatForm.message}
                      onChange={(e) => setChatForm({ ...chatForm, message: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setChatOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={chatSubmitting}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      {chatSubmitting ? "Sending..." : <><Send size={14} /> Send Message</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
