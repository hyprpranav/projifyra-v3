import React, { useEffect, useState } from "react";
import { Send, Users, CheckCircle2, Clock } from "lucide-react";
import { getAllRequests } from "../../../services/orderService";
import { getAllUsers } from "../../../services/adminService";
import ProjifyraLoader from "../../../components/common/ProjifyraLoader";

export default function OfficerHome() {
  const [requests, setRequests] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllRequests(), getAllUsers("client")])
      .then(([reqs, clients]) => { setRequests(reqs); setClients(clients); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pending = requests.filter((r) => r.status === "New" || r.status === "Reviewing");
  const active = requests.filter((r) => ["Accepted", "In Progress", "Testing"].includes(r.status));
  const completed = requests.filter((r) => r.status === "Completed");

  const stats = [
    { label: "Total Requests", value: requests.length, icon: <Send size={20} />, color: "#635BFF", bg: "rgba(99,91,255,0.1)" },
    { label: "Pending Review", value: pending.length, icon: <Clock size={20} />, color: "#D97706", bg: "rgba(217,119,6,0.1)" },
    { label: "Active Projects", value: active.length, icon: <CheckCircle2 size={20} />, color: "#2563EB", bg: "rgba(37,99,235,0.1)" },
    { label: "Total Clients", value: clients.length, icon: <Users size={20} />, color: "#059669", bg: "rgba(5,150,105,0.1)" },
  ];

  const statusBadge = {
    New: "badge-info", Reviewing: "badge-warning", Accepted: "badge-primary",
    "In Progress": "badge-primary", Testing: "badge-warning",
    Completed: "badge-success", Cancelled: "badge-error",
  };

  return (
    <div>
      <div style={{ marginBottom: "var(--space-8)" }}>
        <h2 style={{ fontSize: "var(--font-size-xl)", marginBottom: "var(--space-1)" }}>Officer Dashboard</h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
          Manage client requests and project assignments
        </p>
      </div>

      <div className="stats-row" style={{ marginBottom: "var(--space-8)" }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              <div className="stat-card-value">{loading ? "—" : s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Requests */}
      <div className="data-table-wrap">
        <div className="data-table-header">
          <h3>Recent Requests</h3>
        </div>
        {loading ? (
          <ProjifyraLoader label="Loading officer metrics & recent requests..." />
        ) : requests.length === 0 ? (
          <div className="empty-state"><p>No requests yet.</p></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.slice(0, 10).map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.projectTitle || "—"}</td>
                    <td><span className="badge badge-neutral">{r.requestType || "—"}</span></td>
                    <td><span className={`badge ${statusBadge[r.status] || "badge-neutral"}`}>{r.status}</span></td>
                    <td style={{ color: "var(--color-text-secondary)" }}>
                      {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString("en-IN") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
