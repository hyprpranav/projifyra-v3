import React, { useEffect, useState } from "react";
import {
  TrendingUp, DollarSign, Cpu, ShoppingBag, CheckCircle2,
  AlertCircle, RefreshCw, Edit, Save, X, ArrowUpRight,
  ArrowDownRight, Layers, Award, Sparkles, Filter, ChevronRight
} from "lucide-react";
import {
  getAllOrders,
  getAllRequests,
  adminUpdateRequest,
  updateOrder,
  markOrderReadyForDelivery,
  markOrderDelivered,
  ORDER_STATUS
} from "../../../services/orderService";
import { getPlatformStats, updatePlatformStats } from "../../../services/adminService";

export default function AdminAnalytics() {
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  // Financial Override Modal State
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({
    componentCost: 0,
    makingCost: 0,
    addonTotal: 0,
    projectAmount: 0,
    adminNotes: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [ords, reqs] = await Promise.all([
        getAllOrders(),
        getAllRequests(),
      ]);
      setOrders(ords);
      setRequests(reqs);
    } catch (err) {
      setMsg({ text: "Failed to load financial data: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // --- FINANCIAL CALCULATIONS ---
  // A project is considered active if approved, in-progress, testing, ready for delivery, or delivered
  const activeProjects = orders.filter((o) =>
    o.status !== ORDER_STATUS.SUBMITTED &&
    o.status !== ORDER_STATUS.OFFICER_PROPOSED &&
    o.status !== ORDER_STATUS.CANCELLED
  );

  // 1. Total Quoted Pipeline Value
  const totalQuotedValue = activeProjects.reduce((sum, o) => sum + Number(o.projectAmount || 0), 0);

  // 2. Component Hardware Costs (Pass-through supplier expense — strictly deducted from profit)
  const totalComponentExpense = activeProjects.reduce((sum, o) => sum + Number(o.componentCost || 0), 0);

  // 3. Add-on Services Revenue (PPT, Reports, Paper, Mentoring — 100% margin)
  const totalAddonRevenue = activeProjects.reduce((sum, o) => sum + Number(o.addonTotal || 0), 0);

  // 4. Development / Making Charges
  const totalMakingRevenue = activeProjects.reduce((sum, o) => sum + Number(o.makingCost || (Number(o.projectAmount || 0) - Number(o.componentCost || 0) - Number(o.addonTotal || 0))), 0);

  // 5. Total Actual Cash Revenue Collected
  let totalRevenueCollected = 0;
  let totalOutstandingReceivables = 0;

  activeProjects.forEach((o) => {
    const total = Number(o.projectAmount || 0);
    const advance = Number(o.advancePaymentRequired || Math.round(total * 0.3));
    const balance = Math.max(0, total - advance);

    const isFinalDone = o.finalPaymentStatus === "Verified" || o.isFullPayment;
    const isAdvDone = o.advancePaymentStatus === "Verified";

    if (isFinalDone) {
      totalRevenueCollected += total;
    } else if (isAdvDone) {
      totalRevenueCollected += advance;
      totalOutstandingReceivables += balance;
    } else {
      totalOutstandingReceivables += total;
    }
  });

  // 6. Net Company Profit = Collected Cash - Component Expenses
  const netProfitRealized = Math.max(0, totalRevenueCollected - totalComponentExpense);
  const potentialTotalProfit = Math.max(0, totalQuotedValue - totalComponentExpense);

  // 7. Funnel counts
  const totalSubmitted = requests.length;
  const totalApproved = orders.filter((o) => o.status === ORDER_STATUS.APPROVED).length;
  const totalInBuild = orders.filter((o) => o.status === ORDER_STATUS.IN_PROGRESS || o.status === ORDER_STATUS.TESTING).length;
  const totalReadyForDelivery = orders.filter((o) => o.status === ORDER_STATUS.READY_FOR_DELIVERY).length;
  const totalDelivered = orders.filter((o) => o.status === ORDER_STATUS.DELIVERED || o.status === ORDER_STATUS.COMPLETED).length;

  // Filtered Table rows
  const filteredList = activeProjects.filter((item) => {
    const matchesSearch =
      (item.title || item.projectTitle || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.clientName || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.clientEmail || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      item.status === filterStatus ||
      (filterStatus === "Delivered" && (item.status === ORDER_STATUS.DELIVERED || item.status === ORDER_STATUS.COMPLETED));

    return matchesSearch && matchesStatus;
  });

  // Open Edit Financials Modal
  const openEditModal = (item) => {
    const comp = Number(item.componentCost || 0);
    const make = Number(item.makingCost || 0);
    const addon = Number(item.addonTotal || 0);
    const total = Number(item.projectAmount || (comp + make + addon));

    setEditModal(item);
    setEditForm({
      componentCost: comp,
      makingCost: make,
      addonTotal: addon,
      projectAmount: total,
      adminNotes: item.adminNotes || "",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModal) return;
    setSavingEdit(true);

    const comp = Number(editForm.componentCost || 0);
    const make = Number(editForm.makingCost || 0);
    const addon = Number(editForm.addonTotal || 0);
    const total = Number(editForm.projectAmount || (comp + make + addon));
    const advance = Math.round(total * 0.3);

    try {
      const updates = {
        componentCost: comp,
        makingCost: make,
        addonTotal: addon,
        projectAmount: total,
        advancePaymentRequired: advance,
        adminNotes: editForm.adminNotes,
      };

      // Update in projectRequests
      const reqId = editModal.requestId || editModal.id;
      if (reqId) {
        await adminUpdateRequest(reqId, updates);
      }
      // Update in orders
      if (editModal.id) {
        await updateOrder(editModal.id, updates).catch(() => {});
      }

      setMsg({ text: `Financial breakdown for "${editModal.title}" updated successfully!`, type: "success" });
      setEditModal(null);
      loadAnalyticsData();
    } catch (err) {
      setMsg({ text: "Failed to save financial changes: " + err.message, type: "error" });
    } finally {
      setSavingEdit(false);
      setTimeout(() => setMsg({ text: "", type: "" }), 4000);
    }
  };

  const handleQuickMarkDelivery = async (item, targetStatus) => {
    const targetId = item.requestId || item.id;
    try {
      if (targetStatus === "Ready for Delivery") {
        await markOrderReadyForDelivery(targetId);
        setMsg({ text: `Project "${item.title}" marked as Ready for Delivery!`, type: "success" });
      } else if (targetStatus === "Delivered") {
        await markOrderDelivered(targetId);
        setMsg({ text: `Project "${item.title}" marked as Officially Delivered! Client will be prompted for review.`, type: "success" });
      }
      loadAnalyticsData();
    } catch (err) {
      setMsg({ text: "Action failed: " + err.message, type: "error" });
    }
    setTimeout(() => setMsg({ text: "", type: "" }), 4000);
  };

  return (
    <div className="admin-analytics animate-fade-in">
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: "var(--space-6)", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text)", display: "flex", alignItems: "center", gap: "10px" }}>
            <TrendingUp size={28} color="var(--color-primary)" /> Profit & Financial Analytics
          </h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "2px" }}>
            Real-time financial tracking: Cash collected, pass-through component expenses, add-on profits, and receivables.
          </p>
        </div>

        <button
          className="btn btn-outline btn-sm"
          onClick={loadAnalyticsData}
          disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={15} className={loading ? "spinner" : ""} /> Refresh Financials
        </button>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: "var(--space-4)" }}>
          {msg.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        {/* Card 1: Net Profit Realized */}
        <div className="card card-body" style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.04) 100%)", border: "1.5px solid rgba(16, 185, 129, 0.35)" }}>
          <div className="flex-between" style={{ marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#10B981" }}>
              Net Realized Profit
            </span>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(16, 185, 129, 0.2)", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--color-text)", lineHeight: 1.1 }}>
            ₹{netProfitRealized.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "8px" }}>
            Collected Cash minus Component Expenses. Potential full profit: <strong>₹{potentialTotalProfit.toLocaleString("en-IN")}</strong>.
          </div>
        </div>

        {/* Card 2: Total Revenue Collected */}
        <div className="card card-body" style={{ background: "linear-gradient(135deg, rgba(99, 91, 255, 0.1) 0%, rgba(37, 99, 235, 0.04) 100%)", border: "1.5px solid rgba(99, 91, 255, 0.3)" }}>
          <div className="flex-between" style={{ marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-primary)" }}>
              Revenue Collected (Cash)
            </span>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--color-primary-light)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--color-text)", lineHeight: 1.1 }}>
            ₹{totalRevenueCollected.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "8px" }}>
            Verified 30% advances + final balances received in bank account.
          </div>
        </div>

        {/* Card 3: Component Hardware Expense (Deducted) */}
        <div className="card card-body" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <div className="flex-between" style={{ marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-secondary)" }}>
              Hardware Component Expense
            </span>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--color-bg)", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Cpu size={18} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--color-error)", lineHeight: 1.1 }}>
            ₹{totalComponentExpense.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "8px" }}>
            Pass-through costs paid to suppliers — <em>excluded from company profit</em>.
          </div>
        </div>

        {/* Card 4: Outstanding Receivables */}
        <div className="card card-body" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <div className="flex-between" style={{ marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#D97706" }}>
              Pending Receivables (70%)
            </span>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(245, 158, 11, 0.15)", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--color-text)", lineHeight: 1.1 }}>
            ₹{totalOutstandingReceivables.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "8px" }}>
            Remaining balances to be collected upon 100% completion & delivery.
          </div>
        </div>
      </div>

      {/* PROFIT STREAMS & ORDER FUNNEL BANNER */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-6)", marginBottom: "var(--space-8)" }}>
        {/* Left: Profit Breakdown by Revenue Source */}
        <div className="card card-body">
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "14px" }}>
            Income Streams & Margins
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div className="flex-between" style={{ padding: "10px 12px", background: "var(--color-bg)", borderRadius: "10px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>Development & Assembly Charges</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>Coding, wiring & testing engineering fee</div>
              </div>
              <strong style={{ fontSize: "15px", color: "var(--color-primary)" }}>₹{totalMakingRevenue.toLocaleString("en-IN")}</strong>
            </div>

            <div className="flex-between" style={{ padding: "10px 12px", background: "var(--color-bg)", borderRadius: "10px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>Add-on Services (100% Margin)</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>PPT decks, IEEE reports, paper drafting & mentoring</div>
              </div>
              <strong style={{ fontSize: "15px", color: "var(--color-warning)" }}>₹{totalAddonRevenue.toLocaleString("en-IN")}</strong>
            </div>

            <div className="flex-between" style={{ padding: "10px 12px", background: "rgba(239, 68, 68, 0.08)", borderRadius: "10px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-error)" }}>Less: Component Purchase Expense</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>Cost of electronics & sensors procured</div>
              </div>
              <strong style={{ fontSize: "15px", color: "var(--color-error)" }}>- ₹{totalComponentExpense.toLocaleString("en-IN")}</strong>
            </div>
          </div>
        </div>

        {/* Right: Project Funnel Numbers */}
        <div className="card card-body">
          <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "14px" }}>
            Project Lifecycle Volume Funnel
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", textAlign: "center" }}>
            <div style={{ padding: "12px 8px", background: "var(--color-bg)", borderRadius: "10px" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--color-text)" }}>{totalSubmitted}</div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", marginTop: "2px" }}>Submitted</div>
            </div>

            <div style={{ padding: "12px 8px", background: "var(--color-bg)", borderRadius: "10px" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--color-primary)" }}>{totalApproved}</div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", marginTop: "2px" }}>Approved</div>
            </div>

            <div style={{ padding: "12px 8px", background: "var(--color-bg)", borderRadius: "10px" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#D97706" }}>{totalInBuild}</div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", marginTop: "2px" }}>In Build</div>
            </div>

            <div style={{ padding: "12px 8px", background: "var(--color-bg)", borderRadius: "10px" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#2563EB" }}>{totalReadyForDelivery}</div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", marginTop: "2px" }}>Ready Delivery</div>
            </div>

            <div style={{ padding: "12px 8px", background: "var(--color-bg)", borderRadius: "10px" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#10B981" }}>{totalDelivered}</div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", marginTop: "2px" }}>Delivered</div>
            </div>

            <div style={{ padding: "12px 8px", background: "rgba(16, 185, 129, 0.12)", borderRadius: "10px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#10B981" }}>
                {activeProjects.length > 0 ? `${Math.round((totalDelivered / activeProjects.length) * 100)}%` : "0%"}
              </div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#10B981", textTransform: "uppercase", marginTop: "2px" }}>Delivery Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* INTERACTIVE PROJECTS PROFIT LEDGER TABLE                 */}
      {/* ======================================================== */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0 }}>
              Project-by-Project Financial Ledger
            </h3>
            <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
              Click "Adjust Financials" to fine-tune component expenses, making charges, or notes.
            </span>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search by student or title..."
              className="form-control form-control-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "200px" }}
            />

            <select
              className="form-control form-control-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: "150px" }}
            >
              <option value="all">All Statuses</option>
              <option value={ORDER_STATUS.APPROVED}>Approved</option>
              <option value={ORDER_STATUS.IN_PROGRESS}>In Progress</option>
              <option value={ORDER_STATUS.READY_FOR_DELIVERY}>Ready for Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ width: "100%", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "var(--color-bg)", textAlign: "left" }}>
                <th style={{ padding: "12px 16px" }}>Project & Student</th>
                <th style={{ padding: "12px 16px" }}>Total Quoted</th>
                <th style={{ padding: "12px 16px" }}>Component Expense</th>
                <th style={{ padding: "12px 16px" }}>Add-on Total</th>
                <th style={{ padding: "12px 16px" }}>Cash Collected</th>
                <th style={{ padding: "12px 16px" }}>Project Profit</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--color-text-secondary)" }}>
                    No matching project records found.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const total = Number(item.projectAmount || 0);
                  const comp = Number(item.componentCost || 0);
                  const addon = Number(item.addonTotal || 0);
                  const advance = Number(item.advancePaymentRequired || Math.round(total * 0.3));

                  const isFinal = item.finalPaymentStatus === "Verified" || item.isFullPayment;
                  const isAdv = item.advancePaymentStatus === "Verified";
                  const collected = isFinal ? total : isAdv ? advance : 0;
                  const projectProfit = Math.max(0, collected - comp);

                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 700, color: "var(--color-text)" }}>
                          {item.title || item.projectTitle || "Custom Project"}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                          {item.clientName || "Student"} &bull; {item.clientEmail || ""}
                        </div>
                      </td>

                      <td style={{ padding: "12px 16px", fontWeight: 800 }}>
                        ₹{total.toLocaleString("en-IN")}
                      </td>

                      <td style={{ padding: "12px 16px", color: "var(--color-error)", fontWeight: 700 }}>
                        ₹{comp.toLocaleString("en-IN")}
                      </td>

                      <td style={{ padding: "12px 16px", color: "var(--color-warning)", fontWeight: 700 }}>
                        {addon > 0 ? `₹${addon.toLocaleString("en-IN")}` : "—"}
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <strong style={{ color: isFinal ? "var(--color-success)" : isAdv ? "var(--color-primary)" : "var(--color-text-tertiary)" }}>
                          ₹{collected.toLocaleString("en-IN")}
                        </strong>
                        <div style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>
                          {isFinal ? "100% Paid" : isAdv ? "30% Advance" : "Unpaid"}
                        </div>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <strong style={{ color: "#10B981", fontSize: "14px" }}>
                          ₹{projectProfit.toLocaleString("en-IN")}
                        </strong>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <span className={`badge ${
                          item.status === ORDER_STATUS.DELIVERED ? "badge-success" :
                          item.status === ORDER_STATUS.READY_FOR_DELIVERY ? "badge-primary" :
                          item.status === ORDER_STATUS.IN_PROGRESS ? "badge-warning" : "badge-neutral"
                        }`} style={{ fontSize: "11px" }}>
                          {item.status || "Approved"}
                        </span>
                      </td>

                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openEditModal(item)}
                            title="Adjust costs and pricing"
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                          >
                            <Edit size={13} /> Adjust
                          </button>

                          {item.status !== ORDER_STATUS.READY_FOR_DELIVERY && item.status !== ORDER_STATUS.DELIVERED && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleQuickMarkDelivery(item, "Ready for Delivery")}
                              title="Mark Ready for Delivery"
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                            >
                              Ready
                            </button>
                          )}

                          {item.status !== ORDER_STATUS.DELIVERED && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleQuickMarkDelivery(item, "Delivered")}
                              title="Mark as Delivered"
                              style={{ padding: "4px 8px", fontSize: "11px", background: "#10B981", color: "#fff" }}
                            >
                              Delivered
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FINANCIAL OVERRIDE MODAL                                  */}
      {/* ======================================================== */}
      {editModal && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-card" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "18px", width: "100%", maxWidth: "520px", padding: "24px" }}>
            <div className="flex-between" style={{ marginBottom: "18px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                Adjust Project Financials
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: "14px", padding: "12px", background: "var(--color-bg)", borderRadius: "10px", fontSize: "13px" }}>
                <strong>{editModal.title || editModal.projectTitle}</strong>
                <div style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>
                  Client: {editModal.clientName || editModal.clientEmail}
                </div>
              </div>

              <div className="form-grid-2" style={{ marginBottom: "14px" }}>
                <div className="form-group">
                  <label className="form-label">Component Expense (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editForm.componentCost}
                    onChange={(e) => {
                      const comp = Number(e.target.value);
                      const total = comp + Number(editForm.makingCost) + Number(editForm.addonTotal);
                      setEditForm({ ...editForm, componentCost: comp, projectAmount: total });
                    }}
                    required
                  />
                  <small style={{ color: "var(--color-text-tertiary)", fontSize: "11px" }}>Deducted from profit</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Making / Dev Charge (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editForm.makingCost}
                    onChange={(e) => {
                      const make = Number(e.target.value);
                      const total = Number(editForm.componentCost) + make + Number(editForm.addonTotal);
                      setEditForm({ ...editForm, makingCost: make, projectAmount: total });
                    }}
                    required
                  />
                  <small style={{ color: "var(--color-text-tertiary)", fontSize: "11px" }}>Labor/coding charge</small>
                </div>
              </div>

              <div className="form-grid-2" style={{ marginBottom: "14px" }}>
                <div className="form-group">
                  <label className="form-label">Add-ons (PPT, etc.) (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editForm.addonTotal}
                    onChange={(e) => {
                      const addon = Number(e.target.value);
                      const total = Number(editForm.componentCost) + Number(editForm.makingCost) + addon;
                      setEditForm({ ...editForm, addonTotal: addon, projectAmount: total });
                    }}
                  />
                  <small style={{ color: "var(--color-text-tertiary)", fontSize: "11px" }}>100% margin service</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Total Quoted Amount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editForm.projectAmount}
                    onChange={(e) => setEditForm({ ...editForm, projectAmount: Number(e.target.value) })}
                    required
                  />
                  <small style={{ color: "var(--color-text-tertiary)", fontSize: "11px" }}>Auto-calculated sum</small>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "18px" }}>
                <label className="form-label">Internal Expense / Adjustment Notes</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="e.g. Extra sensor procured, 10% discount applied, etc."
                  value={editForm.adminNotes}
                  onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                  <Save size={16} /> {savingEdit ? "Saving..." : "Save Financial Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
