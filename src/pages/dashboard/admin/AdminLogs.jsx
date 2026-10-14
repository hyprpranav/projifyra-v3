import React, { useEffect, useState } from "react";
import { Activity, RefreshCw, AlertCircle, Clock, Filter, Shield } from "lucide-react";
import { getActivityLogs } from "../../../services/adminService";

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [msg, setMsg] = useState({ text: "", type: "" });

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getActivityLogs(100);
      setLogs(data);
    } catch (err) {
      setMsg({ text: "Failed to load audit logs: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const types = Array.from(new Set(logs.map((l) => l.type).filter(Boolean)));

  const filteredLogs = filterType === "all" ? logs : logs.filter((l) => l.type === filterType);

  return (
    <div className="admin-logs">
      {msg.text && (
        <div className={`alert ${msg.type === "error" ? "alert-error" : "alert-success"}`} style={{ marginBottom: "var(--space-4)" }}>
          <AlertCircle size={18} />
          <span>{msg.text}</span>
        </div>
      )}

      {/* Header and Toolbar */}
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
        <div>
          <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)" }}>
            Platform Activity & Security Audit Logs
          </h2>
          <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
            Real-time audit trails of project requests, status updates, administrative operations, and user events.
          </p>
        </div>

        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <select
            className="form-select"
            style={{ width: "180px", height: "38px" }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Event Types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <button className="btn btn-outline btn-sm" onClick={loadLogs} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="data-table-wrap">
        <div className="data-table-header">
          <div>
            <h3>Audit Events ({filteredLogs.length})</h3>
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
              Chronological ledger of platform activity
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
            Loading audit events...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
            No activity logs recorded yet. System operations will appear here automatically.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event Type</th>
                  <th>Activity Description</th>
                  <th>User / Initiator</th>
                  <th>Recorded Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const dateStr = log.timestamp?.toDate
                    ? log.timestamp.toDate().toLocaleString()
                    : "Just now";

                  const badgeClass =
                    log.type?.includes("submit") || log.type?.includes("create")
                      ? "badge-success"
                      : log.type?.includes("status") || log.type?.includes("update")
                      ? "badge-info"
                      : log.type?.includes("delete") || log.type?.includes("revoke")
                      ? "badge-danger"
                      : "badge-primary";

                  return (
                    <tr key={log.id}>
                      <td>
                        <span className={`badge ${badgeClass}`}>{log.type || "System Event"}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: "var(--font-weight-medium)", color: "var(--color-text)" }}>
                          {log.message || "Operation completed"}
                        </div>
                        {log.details && (
                          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                            {typeof log.details === "object" ? JSON.stringify(log.details) : log.details}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                          {log.userId || "System Daemon"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                          <Clock size={12} /> {dateStr}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
