import React, { useEffect, useState } from "react";
import {
  Send, AlertCircle, CheckCircle2, Eye, FileText, ExternalLink,
  DollarSign, Clock, Check, ChevronDown, User, Layers, Sparkles, X, Sliders
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  getAllRequests,
  submitOfficerProposal,
  updateCompletionPercentage,
  ORDER_STATUS
} from "../../../services/orderService";

const STATUS_BADGE = {
  "Under Review": "badge-info",
  "Officer Proposed": "badge-warning",
  "Approved": "badge-success",
  "In Progress": "badge-primary",
  "Testing": "badge-warning",
  "Completed": "badge-success",
  "Cancelled": "badge-error",
};

export default function OfficerRequests() {
  const { userProfile, currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [proposalModal, setProposalModal] = useState(null); // Request being proposed on
  const [progressModal, setProgressModal] = useState(null); // Request to update percentage on
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);

  // Proposal Form State
  const [proposalForm, setProposalForm] = useState({
    componentCost: 0,
    makingCost: 500,
    timelineDays: "2-3 Days",
    notes: "",
  });

  // Progress Update State
  const [newPercentage, setNewPercentage] = useState(0);
  const [progressNote, setProgressNote] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await getAllRequests();
      setRequests(data);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to load project requests." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openProposalModal = (req) => {
    setProposalModal(req);
    // If client already has components, default component cost to 0
    setProposalForm({
      componentCost: req.hasComponents === "yes" ? 0 : 350,
      makingCost: 650,
      timelineDays: req.deliverySpeed === "express" ? "1 Day (Express)" : "2-3 Days",
      notes: "",
    });
  };

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    if (!proposalModal) return;

    setSubmitting(true);
    const compCost = Number(proposalForm.componentCost || 0);
    const makeCost = Number(proposalForm.makingCost || 0);
    const totalEst = compCost + makeCost;

    try {
      await submitOfficerProposal(proposalModal.id, {
        officerId: currentUser?.uid || "officer",
        officerName: userProfile?.fullName || currentUser?.displayName || "Technical Officer",
        officerEmail: currentUser?.email || "",
        componentCost: compCost,
        makingCost: makeCost,
        totalEstimatedPrice: totalEst,
        timelineDays: proposalForm.timelineDays,
        notes: proposalForm.notes,
      });

      setMessage({
        type: "success",
        text: `Proposal for "${proposalModal.projectTitle}" submitted to Admin Desk for final approval!`
      });
      setProposalModal(null);
      fetchRequests();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to submit proposal: " + err.message });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    }
  };

  const handleProgressSubmit = async (e) => {
    e.preventDefault();
    if (!progressModal) return;

    setSubmitting(true);
    try {
      await updateCompletionPercentage(progressModal.id, newPercentage, progressNote);
      setMessage({
        type: "success",
        text: `Updated completion to ${newPercentage}% for "${progressModal.projectTitle}".`
      });
      setProgressModal(null);
      fetchRequests();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update progress: " + err.message });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 4000);
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: "var(--space-6)", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div>
          <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 800 }}>Officer Project Pool</h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "2px" }}>
            Browse all submitted student ideas, inspect specs & documents (&le; 5MB), and submit feasibility & cost proposals to the Admin Desk.
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchRequests} disabled={loading}>
          Refresh Pool
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: "var(--space-5)" }} role="status">
          {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex-center" style={{ minHeight: 250 }}>
          <div className="spinner spinner-primary" />
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Send size={28} /></div>
          <h3>No project ideas submitted yet</h3>
          <p>When clients register and submit their ideas, they will appear here in the pool.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-4)" }}>
          {requests.map((req) => {
            const hasMyProposal = req.officerProposals?.some(
              (p) => p.officerId === currentUser?.uid || p.officerEmail === currentUser?.email
            );
            const isAssignedToMe =
              req.assignedOfficer === currentUser?.uid ||
              req.assignedOfficer === "Team" ||
              req.assignedOfficerName?.includes(userProfile?.fullName || "");

            return (
              <div key={req.id} className="card card-body" style={{ transition: "all 0.2s ease" }}>
                <div className="flex-between" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--color-text)" }}>
                        {req.projectTitle || "Custom Project"}
                      </span>
                      <span className={`badge ${STATUS_BADGE[req.status] || "badge-info"}`}>
                        {req.status || "Under Review"}
                      </span>
                      {req.deliverySpeed === "express" && (
                        <span className="badge badge-warning" style={{ fontWeight: 700 }}>
                          ⚡ 1-Day Express
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                      Client: <strong>{req.fullName}</strong> ({req.registerNumber || "Reg No: —"}) &bull; {req.phone} &bull; {req.email}
                      {req.teamName && <span> &bull; Team: <strong>{req.teamName}</strong></span>}
                    </div>

                    {/* Deliverables Badges */}
                    {req.selectedServices?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                        {req.selectedServices.map((s) => (
                          <span key={s} className="badge badge-primary" style={{ fontSize: "10px", padding: "2px 6px" }}>
                            {s === "pcb_design" ? `PCB (${req.pcbTool || "Altium"})` :
                             s === "simulation" ? `Sim (${req.simulationTool || "ANSYS"})` :
                             s === "hardware_prototype" ? "Hardware Prototype" :
                             s === "firmware_iot" ? "IoT Firmware" :
                             s === "software_app" ? "Software App" : s}
                          </span>
                        ))}
                        {req.addonTotal > 0 && (
                          <span className="badge badge-warning" style={{ fontSize: "10px", padding: "2px 6px" }}>
                            +Add-ons ₹{req.addonTotal}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    {/* View Details button */}
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setSelectedRequest(selectedRequest?.id === req.id ? null : req)}
                    >
                      <Eye size={14} /> {selectedRequest?.id === req.id ? "Hide Details" : "View Specs"}
                    </button>

                    {/* Propose / Request to work button (if not already approved or if open) */}
                    {req.status !== "Completed" && req.status !== "Cancelled" && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openProposalModal(req)}
                        title="Submit cost estimation & proposal to Admin Desk"
                      >
                        <DollarSign size={14} />
                        {hasMyProposal ? "Update Proposal" : "Request to Work & Propose Cost"}
                      </button>
                    )}

                    {/* Update Progress Button if project is in progress and assigned to this officer or team */}
                    {(req.status === "Approved" || req.status === "In Progress" || req.status === "Testing") && isAssignedToMe && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setProgressModal(req);
                          setNewPercentage(req.completionPercentage || 0);
                        }}
                      >
                        <Sliders size={14} /> Update Progress ({req.completionPercentage || 0}%)
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginTop: "8px", padding: "10px 14px", background: "var(--color-bg)", borderRadius: "10px", fontSize: "12px" }}>
                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>Components: </span>
                    <strong style={{ color: req.hasComponents === "yes" ? "var(--color-success)" : "var(--color-primary)" }}>
                      {req.hasComponents === "yes" ? "Client Provided" : "Projifyra Sourced"}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>Assigned: </span>
                    <strong>{req.assignedOfficerName || "Pending Admin Gatekeeper"}</strong>
                  </div>

                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>Live Progress: </span>
                    <strong style={{ color: "var(--color-primary)" }}>{req.completionPercentage || 0}% Completed</strong>
                  </div>

                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>Officer Proposals: </span>
                    <strong>{req.officerProposals?.length || 0} Submitted</strong>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedRequest?.id === req.id && (
                  <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--color-border)" }}>
                    <div style={{ marginBottom: "var(--space-3)" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-tertiary)", letterSpacing: "0.05em" }}>
                        Problem Statement / Description
                      </div>
                      <div style={{ fontSize: "14px", marginTop: "4px", lineHeight: "1.6", color: "var(--color-text)" }}>
                        {req.shortDescription || "No detailed description provided."}
                      </div>
                    </div>

                    {/* Selected Deliverables & Tools */}
                    {req.selectedServices?.length > 0 && (
                      <div style={{ marginBottom: "var(--space-3)", padding: "10px 14px", background: "var(--color-bg)", borderRadius: "8px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-tertiary)", letterSpacing: "0.05em", marginBottom: "4px" }}>
                          Selected Deliverables & Software Suites
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "4px" }}>
                          {req.selectedServices.map((s) => (
                            <span key={s} className="badge badge-primary" style={{ fontSize: "11px" }}>
                              {s === "pcb_design" ? `PCB: ${req.pcbTool || "Altium / Cadence / KiCad"}` :
                               s === "simulation" ? `Simulation: ${req.simulationTool || "ANSYS HFSS / COMSOL"}` :
                               s === "hardware_prototype" ? "Hardware Prototype" :
                               s === "firmware_iot" ? "IoT Firmware" :
                               s === "software_app" ? "Software App" : s}
                            </span>
                          ))}
                        </div>
                        {req.addonsRequested?.length > 0 && (
                          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                            Academic Add-ons Requested: {req.addonsRequested.join(", ")} (Est: ₹{req.addonTotal || 0})
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ marginBottom: "var(--space-3)" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-tertiary)", letterSpacing: "0.05em" }}>
                        Components & Technologies Requested
                      </div>
                      <div style={{ fontSize: "13px", marginTop: "4px", fontWeight: 600, color: "var(--color-text)" }}>
                        {req.requirements || "None specified."}
                      </div>
                    </div>

                    {/* Uploaded Document / PPT Preview */}
                    {req.documentUrl ? (
                      <div style={{ marginBottom: "var(--space-4)" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-tertiary)", letterSpacing: "0.05em", marginBottom: "6px" }}>
                          Supporting Document / Abstract / Circuit Diagram (&le; 5MB)
                        </div>
                        <a
                          href={req.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline btn-sm"
                          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                        >
                          <FileText size={16} color="var(--color-primary)" />
                          <span>{req.documentName || "View Uploaded File"}</span>
                          {req.documentSize > 0 && (
                            <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                              ({(req.documentSize / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                          )}
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginBottom: "var(--space-3)" }}>
                        No file uploaded with this idea.
                      </div>
                    )}

                    {/* Officer Proposals List */}
                    {req.officerProposals?.length > 0 && (
                      <div style={{ marginTop: "var(--space-4)" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text)", marginBottom: "8px" }}>
                          Proposals Submitted to Admin Desk ({req.officerProposals.length}):
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {req.officerProposals.map((prop, idx) => (
                            <div
                              key={idx}
                              style={{
                                padding: "10px 14px",
                                borderRadius: "8px",
                                background: "var(--color-surface-hover)",
                                border: "1px solid var(--color-border)",
                                fontSize: "12px",
                              }}
                            >
                              <div className="flex-between">
                                <strong>{prop.officerName} ({prop.officerEmail})</strong>
                                <span style={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "13px" }}>
                                  ₹{prop.totalEstimatedPrice} (Comp: ₹{prop.componentCost} + Making: ₹{prop.makingCost})
                                </span>
                              </div>
                              <div style={{ color: "var(--color-text-secondary)", marginTop: "4px" }}>
                                Timeline: {prop.timelineDays} &bull; {prop.notes || "No notes"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: SUBMIT FEASIBILITY & COST PROPOSAL TO ADMIN     */}
      {/* ======================================================== */}
      {proposalModal && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-card animate-fade-up" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "18px", width: "100%", maxWidth: "540px", padding: "24px", boxShadow: "var(--shadow-xl)" }}>
            <div className="flex-between" style={{ marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                  Submit Proposal to Admin Desk
                </h3>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                  For "{proposalModal.projectTitle}"
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setProposalModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProposalSubmit}>
              <div style={{ background: "var(--color-bg)", padding: "12px 14px", borderRadius: "12px", marginBottom: "16px", fontSize: "12px" }}>
                <div><strong>Client Component Status:</strong> {proposalModal.hasComponents === "yes" ? "Client provides components (Bill only making cost)" : "Projifyra must purchase components"}</div>
                <div><strong>Client Delivery Preference:</strong> {proposalModal.deliverySpeed === "express" ? "⚡ Express 1 Day" : "Normal 2-3 Days"}</div>
                {proposalModal.selectedServices?.length > 0 && (
                  <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px dashed var(--color-border)" }}>
                    <strong>Requested Scope:</strong>{" "}
                    {proposalModal.selectedServices.map((s) =>
                      s === "pcb_design" ? `PCB (${proposalModal.pcbTool || "Altium"})` :
                      s === "simulation" ? `Simulation (${proposalModal.simulationTool || "ANSYS HFSS"})` :
                      s.replace("_", " ")
                    ).join(", ")}
                  </div>
                )}
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Estimated Component Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={proposalForm.componentCost}
                    onChange={(e) => setProposalForm((f) => ({ ...f, componentCost: e.target.value }))}
                  />
                  <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                    {proposalModal.hasComponents === "yes" ? "₹0 (Client provides components)" : "Cost to buy sensors, MCU, etc."}
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Making / Development Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={proposalForm.makingCost}
                    onChange={(e) => setProposalForm((f) => ({ ...f, makingCost: e.target.value }))}
                    required
                  />
                  <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                    Assembly, coding & testing fee
                  </span>
                </div>
              </div>

              {/* Total Calculated Estimate */}
              <div style={{ background: "var(--color-primary-light)", padding: "12px 16px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--color-primary)" }}>Total Estimated Project Price:</span>
                <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--color-primary)" }}>
                  ₹{(Number(proposalForm.componentCost || 0) + Number(proposalForm.makingCost || 0)).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Proposed Delivery Timeline</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 2 Days / 1 Day Express"
                  value={proposalForm.timelineDays}
                  onChange={(e) => setProposalForm((f) => ({ ...f, timelineDays: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Technical & Feasibility Notes for Admin</label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="State components required, pin diagram feasibility, firmware complexity, or special considerations..."
                  value={proposalForm.notes}
                  onChange={(e) => setProposalForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setProposalModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Submitting..." : "Send Proposal to Admin Desk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: UPDATE COMPLETION PERCENTAGE (0% - 100%)        */}
      {/* ======================================================== */}
      {progressModal && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-card animate-fade-up" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "18px", width: "100%", maxWidth: "480px", padding: "24px", boxShadow: "var(--shadow-xl)" }}>
            <div className="flex-between" style={{ marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                  Update Completion Progress
                </h3>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                  For "{progressModal.projectTitle}"
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setProgressModal(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProgressSubmit}>
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
                <div className="flex-between" style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "4px" }}>
                  <span>0% (Approved)</span>
                  <span>25% (Prototyping)</span>
                  <span>50% (Assembly)</span>
                  <span>75% (Testing)</span>
                  <span>100% (Completed)</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Progress Note for Client</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Firmware flashed, sensor calibration ongoing..."
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setProgressModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Updating..." : "Save Progress"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
