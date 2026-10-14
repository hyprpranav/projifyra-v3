import React, { useEffect, useState } from "react";
import {
  Send, Search, CheckCircle2, Clock, AlertCircle, RefreshCw,
  User, Check, ChevronDown, Eye, X, DollarSign, FileText,
  ExternalLink, ShieldCheck, Edit, Sliders, Users, AlertTriangle,
  Trash2
} from "lucide-react";
import {
  getAllRequests,
  adminApproveRequest,
  adminUpdateRequest,
  verifyPayment,
  updateCompletionPercentage,
  ORDER_STATUS
} from "../../../services/orderService";
import { getAllUsers, deleteRequestById } from "../../../services/adminService";
import SecurityPinModal from "../../../components/common/SecurityPinModal";

const STATUS_BADGE = {
  "Under Review": "badge-info",
  "Officer Proposed": "badge-warning",
  "Approved": "badge-success",
  "In Progress": "badge-primary",
  "Testing": "badge-warning",
  "Completed": "badge-success",
  "Cancelled": "badge-error",
};

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalModal, setApprovalModal] = useState(null); // Request to approve/edit
  const [verifyModal, setVerifyModal] = useState(null); // Request to verify payment
  const [progressModal, setProgressModal] = useState(null); // Request to update percentage
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });

  // Approval / Edit Form State
  const [approvalForm, setApprovalForm] = useState({
    componentCost: 0,
    makingCost: 1000,
    projectAmount: 1000,
    assignedOfficer: "Team",
    assignedOfficerName: "PROJIFYRA Engineering Team",
    deliverySpeed: "normal",
    adminNotes: "",
  });

  const [newPercentage, setNewPercentage] = useState(0);

  // Security PIN Modal State for Request Deletion (PIN: 927624)
  const [pinModal, setPinModal] = useState({
    isOpen: false,
    requestId: null,
    title: "",
  });

  const promptDeleteRequest = (req) => {
    setPinModal({
      isOpen: true,
      requestId: req.id,
      title: req.projectTitle || "Project Request",
    });
  };

  const handlePinConfirmed = async (pin) => {
    try {
      await deleteRequestById(pinModal.requestId, pin);
      setMsg({ text: `Project request "${pinModal.title}" deleted successfully.`, type: "success" });
      loadData();
    } catch (err) {
      setMsg({ text: "Failed to delete request: " + err.message, type: "error" });
    }
    setTimeout(() => setMsg({ text: "", type: "" }), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqs, users] = await Promise.all([getAllRequests(), getAllUsers("officer")]);
      setRequests(reqs);
      setOfficers(users);
    } catch (err) {
      setMsg({ text: "Failed to load requests: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openApprovalModal = (req) => {
    setApprovalModal(req);
    // Find highest or first officer bid if available
    const firstBid = req.officerProposals?.[0];
    const initialComp = req.componentCost || firstBid?.componentCost || (req.hasComponents === "yes" ? 0 : 350);
    const initialMake = req.makingCost || firstBid?.makingCost || 650;
    const initialTotal = req.projectAmount || (initialComp + initialMake);

    setApprovalForm({
      componentCost: initialComp,
      makingCost: initialMake,
      projectAmount: initialTotal,
      assignedOfficer: req.assignedOfficer || firstBid?.officerId || "Team",
      assignedOfficerName: req.assignedOfficerName || firstBid?.officerName || "PROJIFYRA Engineering Team",
      deliverySpeed: req.deliverySpeed || "normal",
      adminNotes: req.adminNotes || "",
      adminFeasibilityNotes: req.adminFeasibilityNotes || req.adminNotes || "",
    });
  };

  const handleApprovalSubmit = async (e) => {
    e.preventDefault();
    if (!approvalModal) return;

    setActionLoading(approvalModal.id);
    const compCost = Number(approvalForm.componentCost || 0);
    const makeCost = Number(approvalForm.makingCost || 0);
    const total = Number(approvalForm.projectAmount || compCost + makeCost);

    // Find officer name if specific officer selected
    let offName = "PROJIFYRA Engineering Team";
    if (approvalForm.assignedOfficer !== "Team") {
      const found = officers.find((o) => o.id === approvalForm.assignedOfficer);
      if (found) offName = found.fullName || found.email;
    }

    try {
      if (approvalModal.status === ORDER_STATUS.APPROVED || approvalModal.status === ORDER_STATUS.IN_PROGRESS) {
        // Edit existing project details
        await adminUpdateRequest(approvalModal.id, {
          componentCost: compCost,
          makingCost: makeCost,
          projectAmount: total,
          assignedOfficer: approvalForm.assignedOfficer,
          assignedOfficerName: offName,
          deliverySpeed: approvalForm.deliverySpeed,
          adminNotes: approvalForm.adminNotes,
          adminFeasibilityNotes: approvalForm.adminFeasibilityNotes,
        });
        setMsg({ text: `Project details updated for "${approvalModal.projectTitle}".`, type: "success" });
      } else {
        // Gatekeeper Initial Approval
        await adminApproveRequest(approvalModal.id, {
          clientId: approvalModal.clientId,
          clientName: approvalModal.fullName,
          clientEmail: approvalModal.email,
          clientPhone: approvalModal.phone,
          projectTitle: approvalModal.projectTitle,
          componentCost: compCost,
          makingCost: makeCost,
          projectAmount: total,
          assignedOfficer: approvalForm.assignedOfficer,
          assignedOfficerName: offName,
          deliverySpeed: approvalForm.deliverySpeed,
          adminNotes: approvalForm.adminNotes,
          adminFeasibilityNotes: approvalForm.adminFeasibilityNotes,
          hasComponents: approvalModal.hasComponents,
        });
        setMsg({
          text: `Project approved! 30% advance requirement (₹${Math.round(total * 0.3)}) is now active on Client Dashboard.`,
          type: "success",
        });
      }

      setApprovalModal(null);
      loadData();
    } catch (err) {
      setMsg({ text: "Failed to update project: " + err.message, type: "error" });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMsg({ text: "", type: "" }), 5000);
    }
  };

  const handleVerifyAdvancePayment = async (reqId) => {
    setActionLoading(reqId);
    try {
      await verifyPayment(reqId, "advance");
      setMsg({ text: "30% Advance Payment verified! Project is now moved to active development.", type: "success" });
      setVerifyModal(null);
      loadData();
    } catch (err) {
      setMsg({ text: "Failed to verify payment: " + err.message, type: "error" });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMsg({ text: "", type: "" }), 5000);
    }
  };

  const handleProgressUpdate = async (e) => {
    e.preventDefault();
    if (!progressModal) return;
    setActionLoading(progressModal.id);
    try {
      await updateCompletionPercentage(progressModal.id, newPercentage);
      setMsg({ text: `Completion percentage updated to ${newPercentage}%.`, type: "success" });
      setProgressModal(null);
      loadData();
    } catch (err) {
      setMsg({ text: "Failed to update progress: " + err.message, type: "error" });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMsg({ text: "", type: "" }), 4000);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesSearch =
      !search.trim() ||
      r.projectTitle?.toLowerCase().includes(search.toLowerCase()) ||
      r.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.registerNumber?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="admin-requests">
      {msg.text && (
        <div className={`alert ${msg.type === "error" ? "alert-error" : "alert-success"}`} style={{ marginBottom: "var(--space-4)" }}>
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
              placeholder="Search by student name, register no, title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: "180px", height: "42px" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Under Review">Under Review</option>
            <option value="Officer Proposed">Officer Proposed</option>
            <option value="Approved">Approved</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <button className="btn btn-outline btn-sm" onClick={loadData} disabled={loading}>
          <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Requests Table */}
      <div className="data-table-wrap">
        <div className="data-table-header">
          <div>
            <h3>Project Ideas & Approval Gatekeeper ({filteredRequests.length})</h3>
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
              Review client specifications, officer cost bids, assign lead officers, finalize project amount, and verify payments.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
            Loading ideas and proposals...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
            No project requests matching criteria.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Idea Title & Document</th>
                  <th>Student & Reg No</th>
                  <th>Components & Speed</th>
                  <th>Officer Proposals</th>
                  <th>Project Amount & 30% Adv</th>
                  <th>Progress / Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "var(--color-text)" }}>
                        {req.projectTitle || "Custom Project"}
                      </div>
                      {/* Deliverables Badges */}
                      {req.selectedServices?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                          {req.selectedServices.map((s) => (
                            <span key={s} className="badge badge-primary" style={{ fontSize: "10px", padding: "2px 6px" }}>
                              {s === "pcb_design" ? `PCB (${req.pcbTool || "Altium"})` :
                               s === "simulation" ? `Sim (${req.simulationTool || "ANSYS"})` :
                               s === "hardware_prototype" ? "Hardware" :
                               s === "firmware_iot" ? "IoT Firmware" :
                               s === "software_app" ? "Software/AI" : s}
                            </span>
                          ))}
                          {req.addonTotal > 0 && (
                            <span className="badge badge-warning" style={{ fontSize: "10px", padding: "2px 6px" }}>
                              +Add-ons ₹{req.addonTotal}
                            </span>
                          )}
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                        {req.documentUrl ? (
                          <a
                            href={req.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: "11px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              color: "var(--color-primary)",
                              fontWeight: 600
                            }}
                          >
                            <FileText size={12} />
                            {req.documentName || "View Document (&le; 5MB)"}
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>No document</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{req.fullName || "Student"}</div>
                      <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        Reg: <strong>{req.registerNumber || "—"}</strong>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                        {req.phone} &bull; {req.email}
                      </div>
                    </td>

                    <td>
                      <div>
                        <span className={`badge ${req.hasComponents === "yes" ? "badge-success" : "badge-neutral"}`} style={{ fontSize: "11px" }}>
                          {req.hasComponents === "yes" ? "Has Components" : "Needs Components"}
                        </span>
                      </div>
                      <div style={{ marginTop: "4px" }}>
                        <span className={`badge ${req.deliverySpeed === "express" ? "badge-warning" : "badge-neutral"}`} style={{ fontSize: "11px" }}>
                          {req.deliverySpeed === "express" ? "⚡ 1-Day Express" : "2-3 Days Normal"}
                        </span>
                      </div>
                    </td>

                    <td>
                      {req.officerProposals?.length > 0 ? (
                        <div>
                          <span className="badge badge-warning" style={{ fontWeight: 700 }}>
                            {req.officerProposals.length} Proposal(s)
                          </span>
                          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                            From: {req.officerProposals.map((p) => p.officerName.split(" ")[0]).join(", ")}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>No officer bids yet</span>
                      )}
                    </td>

                    <td>
                      {req.projectAmount > 0 ? (
                        <div>
                          <div style={{ fontWeight: 800, color: "var(--color-text)" }}>
                            ₹{req.projectAmount.toLocaleString("en-IN")}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--color-primary)", fontWeight: 700 }}>
                            30% Adv: ₹{req.advancePaymentRequired || Math.round(req.projectAmount * 0.3)}
                          </div>
                          <div style={{ fontSize: "10px", marginTop: "2px" }}>
                            {req.advancePaymentStatus === "Verified" ? (
                              <span style={{ color: "var(--color-success)", fontWeight: 700 }}>✓ Adv Paid</span>
                            ) : req.advancePaymentStatus === "Submitted" ? (
                              <span style={{ color: "var(--color-warning)", fontWeight: 700 }}>Screenshot Uploaded!</span>
                            ) : (
                              <span style={{ color: "var(--color-text-tertiary)" }}>Adv Pending</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>Not set yet</span>
                      )}
                    </td>

                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span className={`badge ${STATUS_BADGE[req.status] || "badge-info"}`}>
                          {req.status || "Under Review"}
                        </span>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-primary)" }}>
                          {req.completionPercentage || 0}% Complete
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                          {req.assignedOfficerName || "Unassigned"}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {/* View Specs */}
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelectedRequest(req)}
                          title="View Details"
                        >
                          <Eye size={13} /> Specs
                        </button>

                        {/* Approve or Edit Button */}
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => openApprovalModal(req)}
                          title={req.status === "Approved" || req.status === "In Progress" ? "Edit Project Details" : "Approve & Set Amount"}
                        >
                          <DollarSign size={13} />
                          {req.status === "Approved" || req.status === "In Progress" ? "Edit Pricing" : "Approve Idea"}
                        </button>

                        {/* Verify Payment Button (if client submitted screenshot) */}
                        {req.advancePaymentScreenshot && req.advancePaymentStatus === "Submitted" && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ background: "#10B981", color: "#fff", borderColor: "#10B981" }}
                            onClick={() => setVerifyModal(req)}
                            title="Verify Advance Payment"
                          >
                            <ShieldCheck size={13} /> Verify ₹
                          </button>
                        )}

                        {/* Update Percentage */}
                        {(req.status === "Approved" || req.status === "In Progress") && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setProgressModal(req);
                              setNewPercentage(req.completionPercentage || 0);
                            }}
                            title="Update Completion Percentage"
                          >
                            <Sliders size={13} />
                          </button>
                        )}

                        {/* Delete Request with PIN */}
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: "#DC2626" }}
                          onClick={() => promptDeleteRequest(req)}
                          title="Delete Request (Requires 6-Digit PIN)"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: ADMIN APPROVE & ASSIGN & EDIT PRICING           */}
      {/* ======================================================== */}
      {approvalModal && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-card animate-fade-up" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "18px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", padding: "24px", boxShadow: "var(--shadow-xl)" }}>
            <div className="flex-between" style={{ marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
                  {approvalModal.status === "Approved" || approvalModal.status === "In Progress"
                    ? "Edit Project Details & Pricing"
                    : "Final Gatekeeper Approval"}
                </h3>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                  For "{approvalModal.projectTitle}" by {approvalModal.fullName}
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setApprovalModal(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Officer Bids Summary if any */}
            {approvalModal.officerProposals?.length > 0 && (
              <div style={{ background: "var(--color-bg)", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px", fontSize: "12px" }}>
                <div style={{ fontWeight: 700, marginBottom: "6px", color: "var(--color-primary)" }}>
                  Officer Proposals Submitted ({approvalModal.officerProposals.length}):
                </div>
                {approvalModal.officerProposals.map((b, idx) => (
                  <div key={idx} style={{ padding: "6px 0", borderBottom: idx < approvalModal.officerProposals.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                    <strong>{b.officerName}:</strong> Total ₹{b.totalEstimatedPrice} (Comp: ₹{b.componentCost}, Making: ₹{b.makingCost}) &bull; {b.timelineDays}
                    {b.notes && <div style={{ color: "var(--color-text-secondary)", marginTop: "2px" }}>Note: {b.notes}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Client Requested Scope & Deliverables Strip */}
            {approvalModal.selectedServices?.length > 0 && (
              <div style={{ background: "rgba(99,91,255,0.06)", border: "1px solid rgba(99,91,255,0.2)", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px", fontSize: "12px" }}>
                <div style={{ fontWeight: 700, marginBottom: "6px", color: "var(--color-primary)" }}>
                  Student Requested Deliverables & Tools:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
                  {approvalModal.selectedServices.map((s) => (
                    <span key={s} className="badge badge-primary" style={{ fontSize: "11px" }}>
                      {s === "pcb_design" ? `PCB: ${approvalModal.pcbTool || "Altium/KiCad"}` :
                       s === "simulation" ? `Sim: ${approvalModal.simulationTool || "ANSYS/COMSOL"}` :
                       s === "hardware_prototype" ? "Hardware Prototype" :
                       s === "firmware_iot" ? "IoT Firmware" :
                       s === "software_app" ? "Software App" : s}
                    </span>
                  ))}
                  {approvalModal.addonTotal > 0 && (
                    <span className="badge badge-warning" style={{ fontSize: "11px" }}>
                      Add-ons Total: ₹{approvalModal.addonTotal}
                    </span>
                  )}
                </div>
                {approvalModal.addonsRequested?.length > 0 && (
                  <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    Academic Add-ons: {approvalModal.addonsRequested.join(", ")}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleApprovalSubmit}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Component Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={approvalForm.componentCost}
                    onChange={(e) => {
                      const comp = Number(e.target.value);
                      setApprovalForm((f) => ({
                        ...f,
                        componentCost: comp,
                        projectAmount: comp + Number(f.makingCost || 0)
                      }));
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                    {approvalModal.hasComponents === "yes" ? "Client provides components" : "Components to purchase"}
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Making / Development Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={approvalForm.makingCost}
                    onChange={(e) => {
                      const make = Number(e.target.value);
                      setApprovalForm((f) => ({
                        ...f,
                        makingCost: make,
                        projectAmount: Number(f.componentCost || 0) + make
                      }));
                    }}
                    required
                  />
                </div>
              </div>

              {/* Total Project Amount & 30% Advance Calculation */}
              <div style={{ background: "var(--color-primary-light)", padding: "14px 18px", borderRadius: "14px", marginBottom: "16px" }}>
                <div className="flex-between">
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-primary)" }}>Final Project Amount:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-primary)" }}>₹</span>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      style={{ width: "120px", height: "36px", fontWeight: 800, fontSize: "16px", color: "var(--color-primary)" }}
                      value={approvalForm.projectAmount}
                      onChange={(e) => setApprovalForm((f) => ({ ...f, projectAmount: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="flex-between" style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px dashed rgba(99,91,255,0.3)", fontSize: "13px" }}>
                  <span style={{ fontWeight: 600, color: "var(--color-text)" }}>Required 30% Upfront Advance:</span>
                  <strong style={{ fontSize: "15px", color: "var(--color-success)" }}>
                    ₹{Math.round(Number(approvalForm.projectAmount || 0) * 0.3).toLocaleString("en-IN")}
                  </strong>
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                  Client will see this exact 30% advance on their dashboard with the payment QR code.
                </div>
              </div>

              {/* Assign Officer or Team */}
              <div className="form-group">
                <label className="form-label">Assign Lead Officer</label>
                <select
                  className="form-control"
                  value={approvalForm.assignedOfficer}
                  onChange={(e) => setApprovalForm((f) => ({ ...f, assignedOfficer: e.target.value }))}
                >
                  <option value="Team">Open to Entire Engineering Team</option>
                  {officers.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.fullName || off.email} (Officer)
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                  You can assign to a requesting officer or leave open to the entire team.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Timeline Mode</label>
                <select
                  className="form-control"
                  value={approvalForm.deliverySpeed}
                  onChange={(e) => setApprovalForm((f) => ({ ...f, deliverySpeed: e.target.value }))}
                >
                  <option value="normal">Normal Turnaround (2–3 Days)</option>
                  <option value="express">⚡ Priority Express (1 Day Turnaround)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, color: "var(--color-primary)" }}>
                  Feasibility Verdict & Scope Summary (What can be done vs limitations)
                </label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="e.g. PCB 4-layer design in Altium Designer approved with Gerber & BOM. HFSS antenna simulation included. Testing ground plane provided by student."
                  value={approvalForm.adminFeasibilityNotes}
                  onChange={(e) => setApprovalForm((f) => ({ ...f, adminFeasibilityNotes: e.target.value }))}
                />
                <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                  This verdict is displayed directly to the client on their dashboard explaining deliverables feasibility.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Internal Admin Notes / Officer Instructions</label>
                <textarea
                  rows={2}
                  className="form-control"
                  placeholder="Specific internal notes for assigned officer..."
                  value={approvalForm.adminNotes}
                  onChange={(e) => setApprovalForm((f) => ({ ...f, adminNotes: e.target.value }))}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setApprovalModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading === approvalModal.id}>
                  {actionLoading === approvalModal.id ? "Saving..." : "Approve & Update Client Dashboard"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: VERIFY ADVANCE PAYMENT SCREENSHOT               */}
      {/* ======================================================== */}
      {verifyModal && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-card animate-fade-up" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "18px", width: "100%", maxWidth: "500px", padding: "24px", boxShadow: "var(--shadow-xl)" }}>
            <div className="flex-between" style={{ marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                  Verify 30% Advance Payment
                </h3>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                  Submitted by {verifyModal.fullName} (Reg: {verifyModal.registerNumber})
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setVerifyModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: "16px", padding: "12px", background: "var(--color-bg)", borderRadius: "12px", fontSize: "13px" }}>
              <div className="flex-between" style={{ marginBottom: "4px" }}>
                <span>Expected 30% Advance:</span>
                <strong>₹{verifyModal.advancePaymentRequired || Math.round(verifyModal.projectAmount * 0.3)}</strong>
              </div>
              {verifyModal.advancePaymentTxnId && (
                <div className="flex-between">
                  <span>Client Transaction UTR:</span>
                  <strong>{verifyModal.advancePaymentTxnId}</strong>
                </div>
              )}
            </div>

            {verifyModal.advancePaymentScreenshot && (
              <div style={{ textAlign: "center", marginBottom: "18px" }}>
                <a href={verifyModal.advancePaymentScreenshot} target="_blank" rel="noopener noreferrer">
                  <img
                    src={verifyModal.advancePaymentScreenshot}
                    alt="Payment Screenshot"
                    style={{ maxHeight: "250px", maxWidth: "100%", borderRadius: "12px", border: "1px solid var(--color-border)", objectFit: "contain" }}
                  />
                </a>
                <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "4px" }}>
                  Click image to view in full resolution
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setVerifyModal(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleVerifyAdvancePayment(verifyModal.id)}
                disabled={actionLoading === verifyModal.id}
              >
                {actionLoading === verifyModal.id ? "Verifying..." : "✓ Confirm & Start Project Development"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: VIEW FULL DETAILS MODAL                         */}
      {/* ======================================================== */}
      {selectedRequest && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-card animate-fade-up" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "18px", width: "100%", maxWidth: "580px", maxHeight: "90vh", overflowY: "auto", padding: "24px", boxShadow: "var(--shadow-xl)" }}>
            <div className="flex-between" style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                Project Idea Specifications
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedRequest(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <span className={`badge ${STATUS_BADGE[selectedRequest.status] || "badge-info"}`}>
                {selectedRequest.status || "Under Review"}
              </span>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginTop: "8px", color: "var(--color-text)" }}>
                {selectedRequest.projectTitle}
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px", padding: "12px", background: "var(--color-bg)", borderRadius: "12px", fontSize: "13px" }}>
              <div>
                <div style={{ color: "var(--color-text-secondary)", fontSize: "11px" }}>Client / Team</div>
                <div style={{ fontWeight: 700 }}>{selectedRequest.fullName}</div>
                {selectedRequest.teamName && <div style={{ fontSize: "11px" }}>Team: {selectedRequest.teamName}</div>}
                <div style={{ fontSize: "11px" }}>Reg: {selectedRequest.registerNumber}</div>
              </div>

              <div>
                <div style={{ color: "var(--color-text-secondary)", fontSize: "11px" }}>Contact Info</div>
                <div>{selectedRequest.phone}</div>
                <div>{selectedRequest.email}</div>
                <div style={{ fontSize: "11px" }}>{selectedRequest.department} {selectedRequest.year}</div>
              </div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>
                Problem Statement & Short Description
              </div>
              <div style={{ marginTop: "4px", fontSize: "13px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                {selectedRequest.shortDescription}
              </div>
            </div>

            {/* Selected Deliverables & Tools */}
            {selectedRequest.selectedServices?.length > 0 && (
              <div style={{ marginBottom: "14px", padding: "12px", background: "var(--color-bg)", borderRadius: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: "6px" }}>
                  Selected Deliverables & Software Tools
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "6px" }}>
                  {selectedRequest.selectedServices.map((s) => (
                    <span key={s} className="badge badge-primary" style={{ fontSize: "11px" }}>
                      {s === "pcb_design" ? `PCB: ${selectedRequest.pcbTool || "Altium/KiCad"}` :
                       s === "simulation" ? `Sim: ${selectedRequest.simulationTool || "ANSYS/COMSOL"}` :
                       s === "hardware_prototype" ? "Hardware Prototype" :
                       s === "firmware_iot" ? "IoT Firmware" :
                       s === "software_app" ? "Software App" : s}
                    </span>
                  ))}
                  {selectedRequest.addonTotal > 0 && (
                    <span className="badge badge-warning" style={{ fontSize: "11px" }}>
                      Add-ons: ₹{selectedRequest.addonTotal}
                    </span>
                  )}
                </div>
                {selectedRequest.addonsRequested?.length > 0 && (
                  <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    Academic Add-ons: {selectedRequest.addonsRequested.join(", ")}
                  </div>
                )}
              </div>
            )}

            {/* Feasibility Verdict if given */}
            {selectedRequest.adminFeasibilityNotes && (
              <div style={{ marginBottom: "14px", padding: "12px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-success)", marginBottom: "4px" }}>
                  Admin Feasibility Verdict & Scope
                </div>
                <div style={{ fontSize: "13px", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
                  {selectedRequest.adminFeasibilityNotes}
                </div>
              </div>
            )}

            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>
                Components & Requirements Needed
              </div>
              <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 600 }}>
                {selectedRequest.requirements}
              </div>
            </div>

            {selectedRequest.documentUrl && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: "4px" }}>
                  Attached Documentation / PPT (&le; 5MB)
                </div>
                <a
                  href={selectedRequest.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <FileText size={15} color="var(--color-primary)" />
                  {selectedRequest.documentName || "Download File"}
                  <ExternalLink size={12} />
                </a>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setSelectedRequest(null)}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSelectedRequest(null);
                  openApprovalModal(selectedRequest);
                }}
              >
                Approve / Edit Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: QUICK PERCENTAGE SLIDER UPDATE                  */}
      {/* ======================================================== */}
      {progressModal && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-card animate-fade-up" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "18px", width: "100%", maxWidth: "440px", padding: "24px", boxShadow: "var(--shadow-xl)" }}>
            <div className="flex-between" style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0 }}>
                Update Live Progress Percentage
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setProgressModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProgressUpdate}>
              <div style={{ textAlign: "center", margin: "20px 0" }}>
                <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--color-primary)" }}>
                  {newPercentage}%
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={newPercentage}
                  onChange={(e) => setNewPercentage(Number(e.target.value))}
                  style={{ width: "100%", height: "8px", marginTop: "12px", accentColor: "var(--color-primary)", cursor: "pointer" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setProgressModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading === progressModal.id}>
                  Save Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security PIN Authorization Modal (PIN: 927624) */}
      <SecurityPinModal
        isOpen={pinModal.isOpen}
        title={`Delete Request: ${pinModal.title}`}
        description="This will permanently delete this project idea request from the database. Enter the 6-digit Secret PIN to authorize."
        confirmLabel="Authorize Deletion"
        onConfirm={handlePinConfirmed}
        onClose={() => setPinModal({ ...pinModal, isOpen: false })}
      />
    </div>
  );
}
