import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px 24px", maxWidth: "600px", margin: "60px auto", textAlign: "center", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "18px", boxShadow: "var(--shadow-lg)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239, 68, 68, 0.12)", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <AlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "8px", color: "var(--color-text)" }}>
            Something went wrong loading this section
          </h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", lineHeight: 1.5, marginBottom: "24px" }}>
            {this.state.error?.message || "A temporary display issue occurred. Please refresh or return to the homepage."}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              <RefreshCw size={16} /> Reload Page
            </button>
            <Link to="/" className="btn btn-outline">
              <Home size={16} /> Back to Home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
