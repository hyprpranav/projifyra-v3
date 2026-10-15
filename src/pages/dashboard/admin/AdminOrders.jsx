import React, { useEffect, useState } from "react";
import {
  ShoppingBag, Search, CheckCircle2, Clock, AlertCircle, RefreshCw,
  Edit, ChevronRight, Check
} from "lucide-react";
import { getAllOrders, updateOrder, PROGRESS_STAGES, ORDER_STATUS } from "../../../services/orderService";
import ProjifyraLoader from "../../../components/common/ProjifyraLoader";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
      setFilteredOrders(data);
    } catch (err) {
      setMsg({ text: "Failed to load orders: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    let result = orders;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.title?.toLowerCase().includes(q) ||
          o.clientName?.toLowerCase().includes(q) ||
          o.clientEmail?.toLowerCase().includes(q)
      );
    }
    if (stageFilter !== "all") {
      result = result.filter((o) => o.stage === stageFilter || o.status === stageFilter);
    }
    setFilteredOrders(result);
  }, [search, stageFilter, orders]);

  const handleUpdateStage = async (orderId, newStage) => {
    setActionLoading(orderId);
    try {
      const updates = { stage: newStage };
      if (newStage === "Delivered" || newStage === "Delivered & Feedback") {
        updates.status = ORDER_STATUS.DELIVERED;
        updates.completionPercentage = 100;
      } else if (newStage === "Ready for Delivery") {
        updates.status = ORDER_STATUS.READY_FOR_DELIVERY;
        updates.completionPercentage = 100;
      } else if (newStage === "Completed") {
        updates.status = ORDER_STATUS.COMPLETED;
      } else if (newStage.includes("Development") || newStage.includes("Testing")) {
        updates.status = ORDER_STATUS.IN_PROGRESS;
      }
      await updateOrder(orderId, updates);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o))
      );
      setMsg({ text: `Order updated to stage "${newStage}".`, type: "success" });
    } catch (err) {
      setMsg({ text: "Failed to update order: " + err.message, type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setActionLoading(orderId);
    try {
      await updateOrder(orderId, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setMsg({ text: `Order status set to "${newStatus}".`, type: "success" });
    } catch (err) {
      setMsg({ text: "Failed to update order status: " + err.message, type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="admin-orders">
      {msg.text && (
        <div className={`alert ${msg.type === "error" ? "alert-error" : "alert-success"}`} style={{ marginBottom: "var(--space-4)" }}>
          <AlertCircle size={18} />
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
        <div style={{ display: "flex", gap: "var(--space-3)", flex: 1, minWidth: "260px" }}>
          <div style={{ position: "relative", flex: 1 }}>
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
              style={{ paddingLeft: "38px", height: "42px" }}
              placeholder="Search by client or project title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: "170px", height: "42px" }}
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="all">All Stages</option>
            {PROGRESS_STAGES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <button className="btn btn-outline btn-sm" onClick={loadOrders} disabled={loading}>
          <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Orders List */}
      <div className="data-table-wrap">
        <div className="data-table-header">
          <div>
            <h3>Active & Delivered Project Orders ({filteredOrders.length})</h3>
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
              Lifecycle stages, milestones, development tracking, and delivery status.
            </p>
          </div>
        </div>

        {loading ? (
          <ProjifyraLoader label="Loading confirmed client orders & stages..." />
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
            No orders found in database. Convert accepted requests from the Requests page.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order / Title</th>
                  <th>Client</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Progress Stage</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((ord) => {
                  const currentStageIdx = PROGRESS_STAGES.indexOf(ord.stage || "Accepted");
                  return (
                    <tr key={ord.id}>
                      <td>
                        <div style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-text)" }}>
                          {ord.title || "Project Order"}
                        </div>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                          ID: {ord.id.slice(0, 8)}...
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: "var(--font-weight-medium)" }}>{ord.clientName || "Student"}</div>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                          {ord.clientEmail || ord.clientPhone || ""}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary">{ord.category || "General"}</span>
                      </td>
                      <td style={{ fontWeight: "var(--font-weight-semibold)" }}>
                        {ord.price ? (isNaN(ord.price) ? ord.price : `₹${ord.price}`) : "Custom"}
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ padding: "4px 8px", fontSize: "12px", height: "30px", width: "130px" }}
                          value={ord.stage || "Accepted"}
                          onChange={(e) => handleUpdateStage(ord.id, e.target.value)}
                          disabled={actionLoading === ord.id}
                        >
                          {PROGRESS_STAGES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ padding: "4px 8px", fontSize: "12px", height: "30px", width: "120px" }}
                          value={ord.status || "In Progress"}
                          onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                          disabled={actionLoading === ord.id}
                        >
                          {Object.values(ORDER_STATUS).map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                        {ord.createdAt?.toDate ? ord.createdAt.toDate().toLocaleDateString() : "Recent"}
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
