import React, { useEffect, useState } from "react";
import {
  HelpCircle, Search, CheckCircle2, Clock, Trash2, AlertCircle,
  RefreshCw, MessageSquare, Phone, Mail, User, Check, Send
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  getAllIssues,
  updateIssueStatus,
  deleteIssue
} from "../../../services/issueService";

const CATEGORY_COLORS = {
  "Idea Approval Inquiry": "badge-primary",
  "Website Issue": "badge-error",
  "Payment Query": "badge-warning",
  "General Issue": "badge-neutral",
};

export default function AdminIssues() {
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "open" | "in_progress" | "resolved"
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const loadIssues = async () => {
    setLoading(true);
    try {
      const data = await getAllIssues();
      setIssues(data);
      setFilteredIssues(data);
    } catch (err) {
      setMsg({ text: "Failed to load client issues: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  useEffect(() => {
    let result = issues;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.name?.toLowerCase().includes(q) ||
          i.email?.toLowerCase().includes(q) ||
          i.phone?.toLowerCase().includes(q) ||
          i.message?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((i) => i.status === statusFilter);
    }
    setFilteredIssues(result);
  }, [search, statusFilter, issues]);

  const handleStatusChange = async (issueId, newStatus) => {
    setActionLoading(issueId);
    try {
      await updateIssueStatus(issueId, { status: newStatus });
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i))
      );
      setMsg({ text: `Issue status updated to ${newStatus}.`, type: "success" });
    } catch (err) {
      setMsg({ text: "Failed to update status: " + err.message, type: "error" });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMsg({ text: "", type: "" }), 4000);
    }
  };

  const handleDelete = async (issueId) => {
    if (!window.confirm("Permanently delete this support message?")) return;
    setActionLoading(issueId);
    try {
      await deleteIssue(issueId);
      setIssues((prev) => prev.filter((i) => i.id !== issueId));
      setMsg({ text: "Support message deleted.", type: "info" });
    } catch (err) {
      setMsg({ text: "Failed to delete: " + err.message, type: "error" });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMsg({ text: "", type: "" }), 4000);
    }
  };

  const openCount = issues.filter((i) => i.status === "open").length;
  const inProgressCount = issues.filter((i) => i.status === "in_progress").length;
  const resolvedCount = issues.filter((i) => i.status === "resolved").length;

  return (
    <div className="admin-issues">
      <div className="flex-between" style={{ marginBottom: "var(--space-6)", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div>
          <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 800 }}>Client Issues & Chat Corner</h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "2px" }}>
            Incoming messages, idea approval queries, website support, and client inquiries.
          </p>
        </div>
      </div>

      {msg.text && (
        <div
          className={`alert ${msg.type === "error" ? "alert-error" : msg.type === "info" ? "alert-info" : "alert-success"}`}
          style={{ marginBottom: "var(--space-6)" }}
        >
          {msg.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === "all" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setStatusFilter("all")}
          >
            All Messages ({issues.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === "open" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setStatusFilter("open")}
            style={{ position: "relative" }}
          >
            Open / Pending ({openCount})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === "in_progress" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setStatusFilter("in_progress")}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === "resolved" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setStatusFilter("resolved")}
          >
            Resolved ({resolvedCount})
          </button>
        </div>

        <div style={{ display: "flex", gap: "var(--space-3)", flex: 1, minWidth: "260px", justifyContent: "flex-end" }}>
          <div style={{ position: "relative", maxWidth: "340px", width: "100%" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-tertiary)",
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: "38px", height: "38px" }}
              placeholder="Search by client, email, message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="btn btn-outline btn-sm" onClick={loadIssues} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Messages List / Table */}
      <div className="data-table-wrap">
        <div className="data-table-header">
          <div>
            <h3>Support Inquiries & Chat Messages ({filteredIssues.length})</h3>
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
              Messages submitted by students awaiting idea approval or experiencing website issues.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
            Loading support messages...
          </div>
        ) : filteredIssues.length === 0 ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
            No support inquiries found matching this filter.
          </div>
        ) : (
          <div style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {filteredIssues.map((issue) => {
              const isOpen = issue.status === "open";
              const isInProgress = issue.status === "in_progress";
              const isResolved = issue.status === "resolved";

              return (
                <div
                  key={issue.id}
                  style={{
                    background: "var(--color-bg)",
                    border: `1.5px solid ${isOpen ? "rgba(245, 158, 11, 0.4)" : isResolved ? "rgba(16, 185, 129, 0.3)" : "var(--color-border)"}`,
                    borderRadius: "14px",
                    padding: "var(--space-5)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-3)",
                  }}
                >
                  <div className="flex-between" style={{ flexWrap: "wrap", gap: "var(--space-3)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: "var(--color-primary-light)",
                          color: "var(--color-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                        }}
                      >
                        {(issue.name || "C")[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--color-text)", fontSize: "15px" }}>
                          {issue.name || "Client"}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          {issue.email && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Mail size={12} /> {issue.email}
                            </span>
                          )}
                          {issue.phone && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Phone size={12} /> {issue.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span className={`badge ${CATEGORY_COLORS[issue.category] || "badge-neutral"}`} style={{ fontSize: "11px" }}>
                        {issue.category || "Inquiry"}
                      </span>
                      <span
                        className={`badge ${isOpen ? "badge-warning" : isInProgress ? "badge-info" : "badge-success"}`}
                        style={{ fontSize: "11px" }}
                      >
                        {isOpen ? "Open / Unresolved" : isInProgress ? "In Progress" : "Resolved"}
                      </span>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div
                    style={{
                      background: "var(--color-surface)",
                      padding: "14px 16px",
                      borderRadius: "10px",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      color: "var(--color-text)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    "{issue.message}"
                  </div>

                  {/* Actions Bar */}
                  <div className="flex-between" style={{ flexWrap: "wrap", gap: "var(--space-2)", marginTop: "4px" }}>
                    <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                      Submitted: {issue.createdAt?.toDate ? issue.createdAt.toDate().toLocaleString("en-IN") : "Recently"}
                    </div>

                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      {issue.category === "Idea Approval Inquiry" && (
                        <Link to="/admin/requests" className="btn btn-outline btn-sm" style={{ color: "var(--color-primary)" }}>
                          View in Requests
                        </Link>
                      )}

                      {isOpen && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => handleStatusChange(issue.id, "in_progress")}
                          disabled={actionLoading === issue.id}
                        >
                          <Clock size={14} /> In Progress
                        </button>
                      )}

                      {!isResolved && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStatusChange(issue.id, "resolved")}
                          disabled={actionLoading === issue.id}
                        >
                          <Check size={14} /> Mark Resolved
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ color: "#DC2626", borderColor: "rgba(220, 38, 38, 0.3)" }}
                        onClick={() => handleDelete(issue.id)}
                        disabled={actionLoading === issue.id}
                        title="Delete message"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
