import React, { useEffect, useState } from "react";
import { ShoppingBag, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { getClientOrders, PROGRESS_STAGES } from "../../../services/orderService";

const STATUS_BADGE = {
  "Under Review": "badge-info",
  "Officer Proposed": "badge-warning",
  "Approved": "badge-success",
  "In Progress": "badge-primary",
  "Testing": "badge-warning",
  "Completed": "badge-success",
  "Cancelled": "badge-error",
};

export default function ClientOrders() {
  const { userProfile, currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    getClientOrders(currentUser.uid, currentUser.email)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [currentUser?.uid]);

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 800 }}>My Orders & Projects</h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "2px" }}>
            Official confirmed builds and active deliverables.
          </p>
        </div>
        <Link to="/dashboard" className="btn btn-outline btn-sm">
          Go to Live Tracker
        </Link>
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: 200 }}>
          <div className="spinner spinner-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><ShoppingBag size={28} /></div>
          <h3>No confirmed orders yet</h3>
          <p>Once your submitted idea is approved by the Admin Desk, your active order will appear here.</p>
          <Link to="/dashboard/requests" className="btn btn-primary" style={{ marginTop: "14px" }}>
            View Submitted Requests
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {orders.map((order) => {
            const isExpanded = selected?.id === order.id;
            const amount = order.projectAmount || order.price || 0;
            const pct = order.completionPercentage || 0;

            return (
              <div
                key={order.id}
                className="card card-body"
                onClick={() => setSelected(isExpanded ? null : order)}
                style={{ cursor: "pointer" }}
              >
                <div className="flex-between" style={{ marginBottom: isExpanded ? "var(--space-4)" : 0, flexWrap: "wrap", gap: "var(--space-2)" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "2px" }}>
                      {order.title || order.projectTitle || "Project Order"}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                      ID: {order.id.slice(0, 8).toUpperCase()} &bull;{" "}
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("en-IN") : "Recent"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
                    {amount > 0 && (
                      <span style={{ fontWeight: 800, color: "var(--color-text)", fontSize: "15px" }}>
                        ₹{Number(amount).toLocaleString("en-IN")}
                      </span>
                    )}
                    <span className={`badge ${STATUS_BADGE[order.status] || "badge-primary"}`}>
                      {order.status || "Approved"}
                    </span>
                  </div>
                </div>

                {/* Progress bar preview */}
                <div style={{ marginTop: "10px" }}>
                  <div className="flex-between" style={{ fontSize: "11px", fontWeight: 700, marginBottom: "4px" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>Progress</span>
                    <span style={{ color: "var(--color-primary)" }}>{pct}% Completed</span>
                  </div>
                  <div style={{ height: "6px", width: "100%", background: "var(--color-bg)", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "var(--color-primary)", borderRadius: "999px" }} />
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--color-border)" }}>
                    <div className="progress-timeline">
                      {PROGRESS_STAGES.map((stage, i) => {
                        const isDone = (pct >= (i + 1) * 20) || (i === 0 && order.status === "Approved");
                        return (
                          <div key={stage} className={`progress-step${isDone ? " done" : ""}`}>
                            <div className="progress-step-dot">{isDone ? "✓" : i + 1}</div>
                            <div className="progress-step-label">{stage}</div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "14px" }}>
                      <Link to="/dashboard" className="btn btn-primary btn-sm">
                        Open Project Dashboard & Payment <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
