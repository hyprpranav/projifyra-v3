import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, UserCheck, FolderOpen, Send, ShoppingBag,
  Star, Activity, TrendingUp, ArrowRight, ShieldCheck, CheckCircle2, Clock,
  AlertTriangle, Trash2, KeyRound, AlertCircle
} from "lucide-react";
import { getAllUsers, getActivityLogs, deleteAllUsersByRole, clearEntireDatabase } from "../../../services/adminService";
import { getAllRequests, getAllOrders } from "../../../services/orderService";
import { getPublicProjects } from "../../../services/projectService";
import { getAllReviews } from "../../../services/reviewService";
import SecurityPinModal from "../../../components/common/SecurityPinModal";

export default function AdminHome() {
  const [stats, setStats] = useState({
    clients: 0,
    officers: 0,
    projects: 0,
    requests: 0,
    orders: 0,
    reviews: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", type: "" });

  // Security PIN Modal State for System Deletions (PIN: 927624)
  const [pinModal, setPinModal] = useState({
    isOpen: false,
    title: "",
    description: "",
    actionType: "", // "delete_clients" | "delete_officers" | "clear_database"
  });

  const loadDashboardData = async () => {
    try {
      const [users, projects, requests, orders, reviews, logs] = await Promise.all([
        getAllUsers(),
        getPublicProjects(),
        getAllRequests(),
        getAllOrders(),
        getAllReviews(),
        getActivityLogs(5),
      ]);

      const clientsCount = users.filter((u) => u.role === "client" || !u.role).length;
      const officersCount = users.filter((u) => u.role === "officer").length;

      setStats({
        clients: clientsCount,
        officers: officersCount,
        projects: projects.length,
        requests: requests.length,
        orders: orders.length,
        reviews: reviews.length,
      });

      setRecentRequests(requests.slice(0, 5));
      setRecentLogs(logs);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handlers for PIN-protected deletions
  const promptDeleteAllClients = () => {
    setPinModal({
      isOpen: true,
      title: "Delete All Clients",
      description: "DANGER: This will permanently delete all client accounts from the database. Enter the 6-digit Secret PIN to authorize.",
      actionType: "delete_clients",
    });
  };

  const promptDeleteAllOfficers = () => {
    setPinModal({
      isOpen: true,
      title: "Delete All Officers",
      description: "DANGER: This will permanently delete all officer accounts (Super Admin is preserved). Enter the 6-digit Secret PIN to authorize.",
      actionType: "delete_officers",
    });
  };

  const promptClearEntireDatabase = () => {
    setPinModal({
      isOpen: true,
      title: "Wipe Entire System Database",
      description: "CRITICAL DANGER: This will completely wipe all requests, active orders, and non-admin users across PROJIFYRA. Enter the 6-digit Secret PIN to authorize.",
      actionType: "clear_database",
    });
  };

  const handlePinConfirmed = async (pin) => {
    try {
      if (pinModal.actionType === "delete_clients") {
        await deleteAllUsersByRole("client", pin);
        setMsg({ text: "All client accounts deleted successfully.", type: "success" });
      } else if (pinModal.actionType === "delete_officers") {
        await deleteAllUsersByRole("officer", pin);
        setMsg({ text: "All officer accounts deleted successfully.", type: "success" });
      } else if (pinModal.actionType === "clear_database") {
        await clearEntireDatabase(pin);
        setMsg({ text: "System database wiped and reset successfully.", type: "success" });
      }
      loadDashboardData();
    } catch (err) {
      setMsg({ text: err.message || "Operation failed", type: "error" });
    } finally {
      setTimeout(() => setMsg({ text: "", type: "" }), 6000);
    }
  };

  return (
    <div className="admin-home">
      {msg.text && (
        <div
          className={`alert ${msg.type === "error" ? "alert-error" : msg.type === "info" ? "alert-info" : "alert-success"}`}
          style={{ marginBottom: "var(--space-6)" }}
        >
          <AlertCircle size={18} />
          <span>{msg.text}</span>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(99, 91, 255, 0.1)", color: "var(--color-primary)" }}>
            <Users size={22} />
          </div>
          <div className="stat-card-value">{loading ? "..." : stats.clients}</div>
          <div className="stat-card-label">Registered Clients</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563EB" }}>
            <UserCheck size={22} />
          </div>
          <div className="stat-card-value">{loading ? "..." : stats.officers}</div>
          <div className="stat-card-label">Platform Officers</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10B981" }}>
            <Send size={22} />
          </div>
          <div className="stat-card-value">{loading ? "..." : stats.requests}</div>
          <div className="stat-card-label">Project Requests</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#F59E0B" }}>
            <FolderOpen size={22} />
          </div>
          <div className="stat-card-value">{loading ? "..." : stats.projects}</div>
          <div className="stat-card-label">Showcase Projects</div>
        </div>
      </div>

      {/* Quick Action Bento Grid */}
      <div style={{ marginBottom: "var(--space-8)" }}>
        <h3 style={{ fontSize: "var(--font-size-md)", fontWeight: "var(--font-weight-bold)", marginBottom: "var(--space-4)" }}>
          Administrator Controls
        </h3>
        <div className="bento-grid">
          <Link to="/admin/projects" className="bento-card">
            <div className="bento-card-icon">
              <FolderOpen size={24} />
            </div>
            <div className="bento-card-title">Manage Projects</div>
            <div className="bento-card-description">
              Create, update, or archive hardware and software projects shown on the public showcase catalog.
            </div>
            <div className="bento-card-cta btn btn-outline btn-sm">
              Open Catalog <ArrowRight size={14} />
            </div>
          </Link>

          <Link to="/admin/requests" className="bento-card">
            <div className="bento-card-icon" style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563EB" }}>
              <Send size={24} />
            </div>
            <div className="bento-card-title">Review Client Requests</div>
            <div className="bento-card-description">
              View custom student requests, assign review status, allocate officers, and convert to active orders.
            </div>
            <div className="bento-card-cta btn btn-outline btn-sm">
              View Requests <ArrowRight size={14} />
            </div>
          </Link>

          <Link to="/admin/officers" className="bento-card">
            <div className="bento-card-icon" style={{ background: "rgba(124, 58, 237, 0.1)", color: "#7C3AED" }}>
              <ShieldCheck size={24} />
            </div>
            <div className="bento-card-title">Manage Officers</div>
            <div className="bento-card-description">
              Assign or revoke officer privileges, monitor workloads, and coordinate team members.
            </div>
            <div className="bento-card-cta btn btn-outline btn-sm">
              Manage Officers <ArrowRight size={14} />
            </div>
          </Link>

          <Link to="/admin/stats" className="bento-card">
            <div className="bento-card-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10B981" }}>
              <TrendingUp size={24} />
            </div>
            <div className="bento-card-title">Platform Statistics</div>
            <div className="bento-card-description">
              Inspect landing page metrics, milestone figures, client success records, and sync global values.
            </div>
            <div className="bento-card-cta btn btn-outline btn-sm">
              View Analytics <ArrowRight size={14} />
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Requests Section */}
      <div className="data-table-wrap" style={{ marginBottom: "var(--space-8)" }}>
        <div className="data-table-header">
          <div>
            <h3>Recent Project Requests</h3>
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
              Latest requirements submitted by students and institutions
            </p>
          </div>
          <Link to="/admin/requests" className="btn btn-outline btn-sm">
            View All ({stats.requests})
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
            {loading ? "Loading requests..." : "No project requests found in database."}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title / Scope</th>
                <th>Domain</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.map((req) => (
                <tr key={req.id}>
                  <td>
                    <div style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-text)" }}>
                      {req.title || "Custom Project"}
                    </div>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                      {req.clientName || req.email || "Client"}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">{req.domain || req.category || "General"}</span>
                  </td>
                  <td style={{ fontWeight: "var(--font-weight-medium)" }}>
                    {req.budget ? `₹${req.budget}` : "Not specified"}
                  </td>
                  <td>
                    <span className={`badge ${req.status === "Completed" ? "badge-success" : req.status === "In Progress" ? "badge-primary" : "badge-warning"}`}>
                      {req.status || "New"}
                    </span>
                  </td>
                  <td style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                    {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : "Recent"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Activity Logs Preview */}
      <div className="data-table-wrap">
        <div className="data-table-header">
          <div>
            <h3>Recent Activity Logs</h3>
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
              System audit and operations log
            </p>
          </div>
          <Link to="/admin/logs" className="btn btn-outline btn-sm">
            Full Audit Log
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
            {loading ? "Loading logs..." : "No recent activity logged."}
          </div>
        ) : (
          <div style={{ padding: "var(--space-4) var(--space-6)" }}>
            {recentLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-3) 0",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--color-primary)",
                    }}
                  />
                  <div>
                    <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text)", fontWeight: "var(--font-weight-medium)" }}>
                      {log.message || log.type}
                    </div>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                      Type: {log.type || "System"} • User: {log.userId || "System"}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                  {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform Danger Zone: Database Master Deletions (Protected by 6-Digit PIN: 927624) */}
      <div
        style={{
          marginTop: "var(--space-8)",
          padding: "var(--space-6)",
          borderRadius: "var(--radius-xl)",
          background: "rgba(220, 38, 38, 0.03)",
          border: "1px solid rgba(220, 38, 38, 0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "var(--space-4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(220, 38, 38, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#DC2626",
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "var(--font-size-md)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text)", margin: 0 }}>
                Master Security & Database Controls
              </h3>
              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", margin: 0 }}>
                High-privilege destructive operations. All actions strictly require Master Security PIN verification.
              </p>
            </div>
          </div>
          <span
            className="badge"
            style={{
              background: "rgba(220, 38, 38, 0.1)",
              color: "#DC2626",
              fontWeight: 700,
              fontSize: "11px",
              padding: "4px 8px",
            }}
          >
            PIN Protected
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
          {/* Card 1: Delete All Clients */}
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: "var(--color-text)", marginBottom: "4px" }}>
                Delete All Clients
              </div>
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
                Permanently deletes all registered student client records from the platform. Requires 6-digit Secret PIN.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: "rgba(220, 38, 38, 0.08)",
                color: "#DC2626",
                border: "1px solid rgba(220, 38, 38, 0.3)",
                width: "100%",
              }}
              onClick={promptDeleteAllClients}
            >
              <Trash2 size={14} /> Delete All Clients (PIN)
            </button>
          </div>

          {/* Card 2: Delete All Officers */}
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: "var(--color-text)", marginBottom: "4px" }}>
                Delete All Officers
              </div>
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
                Removes all verified officers and pending applicants (Super Admin preserved). Requires 6-digit Secret PIN.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: "rgba(220, 38, 38, 0.08)",
                color: "#DC2626",
                border: "1px solid rgba(220, 38, 38, 0.3)",
                width: "100%",
              }}
              onClick={promptDeleteAllOfficers}
            >
              <Trash2 size={14} /> Delete All Officers (PIN)
            </button>
          </div>

          {/* Card 3: Clear Entire Database */}
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid rgba(220, 38, 38, 0.3)",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: "#DC2626", marginBottom: "4px" }}>
                Wipe Entire System Database
              </div>
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "16px" }}>
                Deletes all project requests, active orders, and non-admin users. Requires 6-digit Secret PIN verification.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: "#DC2626",
                color: "#fff",
                border: "none",
                width: "100%",
              }}
              onClick={promptClearEntireDatabase}
            >
              <AlertTriangle size={14} /> Wipe System Database (PIN)
            </button>
          </div>
        </div>
      </div>

      {/* Security PIN Authorization Modal (PIN: 927624) */}
      <SecurityPinModal
        isOpen={pinModal.isOpen}
        title={pinModal.title}
        description={pinModal.description}
        confirmLabel="Authorize Deletion"
        onConfirm={handlePinConfirmed}
        onClose={() => setPinModal({ ...pinModal, isOpen: false })}
      />
    </div>
  );
}
