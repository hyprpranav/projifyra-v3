import React, { useEffect, useState } from "react";
import {
  BarChart3, RefreshCw, Save, CheckCircle2, AlertCircle,
  TrendingUp, Award, Users, ShoppingBag
} from "lucide-react";
import { getPlatformStats, updatePlatformStats, getAllUsers } from "../../../services/adminService";
import { getAllRequests, getAllOrders } from "../../../services/orderService";
import { getPublicProjects } from "../../../services/projectService";

export default function AdminStats() {
  const [stats, setStats] = useState({
    projectsCompleted: 0,
    clientsSupported: 0,
    projectsOngoing: 0,
    projectsReceived: 0,
  });
  const [dbCounts, setDbCounts] = useState({
    users: 0,
    projects: 0,
    requests: 0,
    orders: 0,
    completedOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const loadData = async () => {
    setLoading(true);
    try {
      const [platformData, users, projects, requests, orders] = await Promise.all([
        getPlatformStats(),
        getAllUsers(),
        getPublicProjects(),
        getAllRequests(),
        getAllOrders(),
      ]);

      setStats({
        projectsCompleted: platformData.projectsCompleted ?? 120,
        clientsSupported: platformData.clientsSupported ?? 250,
        projectsOngoing: platformData.projectsOngoing ?? 18,
        projectsReceived: platformData.projectsReceived ?? 300,
      });

      const completed = orders.filter((o) => o.status === "Completed" || o.stage === "Completed").length;

      setDbCounts({
        users: users.length,
        projects: projects.length,
        requests: requests.length,
        orders: orders.length,
        completedOrders: completed,
      });
    } catch (err) {
      setMsg({ text: "Failed to load platform stats: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePlatformStats({
        projectsCompleted: Number(stats.projectsCompleted) || 0,
        clientsSupported: Number(stats.clientsSupported) || 0,
        projectsOngoing: Number(stats.projectsOngoing) || 0,
        projectsReceived: Number(stats.projectsReceived) || 0,
      });
      setMsg({ text: "Platform display stats updated successfully!", type: "success" });
    } catch (err) {
      setMsg({ text: "Failed to save stats: " + err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncWithDb = () => {
    setStats({
      projectsCompleted: Math.max(dbCounts.completedOrders, 120),
      clientsSupported: Math.max(dbCounts.users, 250),
      projectsOngoing: Math.max(dbCounts.orders - dbCounts.completedOrders, 18),
      projectsReceived: Math.max(dbCounts.requests, 300),
    });
    setMsg({ text: "Numbers synced with current live Firestore collection counts. Click Save to persist.", type: "info" });
  };

  return (
    <div className="admin-stats">
      {msg.text && (
        <div className={`alert ${msg.type === "error" ? "alert-error" : msg.type === "info" ? "alert-info" : "alert-success"}`} style={{ marginBottom: "var(--space-4)" }}>
          <AlertCircle size={18} />
          <span>{msg.text}</span>
        </div>
      )}

      {/* Header */}
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
            Platform Statistics & Public Figures
          </h2>
          <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
            These figures are showcased across the homepage hero section, trust banners, and marketing blocks.
          </p>
        </div>

        <button className="btn btn-outline btn-sm" onClick={loadData} disabled={loading}>
          <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Live Firestore DB Baseline Preview */}
      <div className="stats-row" style={{ marginBottom: "var(--space-6)" }}>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(99, 91, 255, 0.1)", color: "var(--color-primary)" }}>
            <Award size={22} />
          </div>
          <div className="stat-card-value">{loading ? "..." : stats.projectsCompleted}+</div>
          <div className="stat-card-label">Projects Completed</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563EB" }}>
            <Users size={22} />
          </div>
          <div className="stat-card-value">{loading ? "..." : stats.clientsSupported}+</div>
          <div className="stat-card-label">Students & Clients Supported</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10B981" }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-card-value">{loading ? "..." : stats.projectsOngoing}</div>
          <div className="stat-card-label">Active Ongoing Projects</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#F59E0B" }}>
            <ShoppingBag size={22} />
          </div>
          <div className="stat-card-value">{loading ? "..." : stats.projectsReceived}+</div>
          <div className="stat-card-label">Total Submissions Received</div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="data-table-wrap" style={{ maxWidth: "700px" }}>
        <div className="data-table-header">
          <div>
            <h3>Update Showcase Counters</h3>
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
              Customize displayed statistics shown to visitors on the landing page.
            </p>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={handleSyncWithDb}>
            Sync with Database
          </button>
        </div>

        <form onSubmit={handleSave} style={{ padding: "var(--space-6)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            <div className="form-group">
              <label className="form-label">Projects Completed Counter</label>
              <input
                type="number"
                className="form-input"
                value={stats.projectsCompleted}
                onChange={(e) => setStats({ ...stats, projectsCompleted: e.target.value })}
                required
              />
              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                Database actual: {dbCounts.completedOrders}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Clients Supported Counter</label>
              <input
                type="number"
                className="form-input"
                value={stats.clientsSupported}
                onChange={(e) => setStats({ ...stats, clientsSupported: e.target.value })}
                required
              />
              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                Database actual: {dbCounts.users}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Ongoing Projects Counter</label>
              <input
                type="number"
                className="form-input"
                value={stats.projectsOngoing}
                onChange={(e) => setStats({ ...stats, projectsOngoing: e.target.value })}
                required
              />
              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                Active in pipeline: {dbCounts.orders - dbCounts.completedOrders}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Projects Received Counter</label>
              <input
                type="number"
                className="form-input"
                value={stats.projectsReceived}
                onChange={(e) => setStats({ ...stats, projectsReceived: e.target.value })}
                required
              />
              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                Total requests submitted: {dbCounts.requests}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-6)" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? "Saving Changes..." : "Save Public Statistics"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
