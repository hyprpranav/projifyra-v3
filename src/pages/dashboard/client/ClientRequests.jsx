import React, { useEffect, useState } from "react";
import {
  Send, AlertCircle, CheckCircle2, Plus, X, UploadCloud,
  FileText, ExternalLink, ShieldAlert, Sparkles, DollarSign, Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { submitProjectRequest, getClientRequests, PROGRESS_STAGES } from "../../../services/orderService";
import { uploadToCloudinary } from "../../../services/cloudinaryService";
import ProjectMiniProfileModal from "../../../components/common/ProjectMiniProfileModal";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // Strict 5MB limit

const AVAILABLE_SERVICES = [
  { id: "hardware_prototype", name: "Hardware Prototype & Assembly", desc: "Physical component wiring, sensors & breadboard/soldered prototype", feeText: "Feasibility Quoted" },
  { id: "pcb_design", name: "PCB Design & Schematic Layout", desc: "Schematic capture, multi-layer routing, Gerber & 3D STEP", isPcb: true, feeText: "Feasibility Quoted" },
  { id: "simulation", name: "Engineering Simulation & Analysis", desc: "ANSYS HFSS, COMSOL Multiphysics, MATLAB & Simulink, Proteus CAE/FEA", isSim: true, feeText: "Feasibility Quoted" },
  { id: "firmware_iot", name: "Embedded Firmware & IoT Cloud", desc: "ESP32 / STM32 / Arduino C++, MQTT, dashboard telemetry & cloud APIs", feeText: "Feasibility Quoted" },
  { id: "software_app", name: "Software App / Web / AI-ML", desc: "Fullstack web portal, mobile app interface, or ML model integration", feeText: "Feasibility Quoted" },
  { id: "addon_ppt", name: "Project Presentation PPT Deck", desc: "Professional animated slides, block diagrams & architecture overview", isAddon: true, price: 149, feeText: "₹149" },
  { id: "addon_doc", name: "Project Report & IEEE Documentation", desc: "Complete academic report, literature survey, testing results & appendices", isAddon: true, price: 249, feeText: "₹249" },
  { id: "addon_paper", name: "Conference Research Paper Drafting", desc: "IEEE/Scopus format paper writing, abstract, methodology & citations", isAddon: true, price: 999, feeText: "₹999" },
  { id: "addon_mentoring", name: "1-on-1 Viva / Mentoring Session", desc: "Direct hands-on code explanation & viva defense rehearsal with engineers", isAddon: true, price: 99, feeText: "₹99" },
];

const INITIAL_FORM = {
  projectTitle: "",
  shortDescription: "",
  requirements: "",
  hasComponents: "no", // "yes" | "no"
  deliverySpeed: "normal", // "normal" | "express"
};

export default function ClientRequests() {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedServices, setSelectedServices] = useState(["hardware_prototype"]);
  const [pcbTool, setPcbTool] = useState("Altium Designer");
  const [simulationTool, setSimulationTool] = useState("ANSYS HFSS");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const [selected, setSelected] = useState(null);
  const [miniProfileProject, setMiniProfileProject] = useState(null);

  // File Upload State (&le; 5MB)
  const [docFile, setDocFile] = useState(null);
  const [fileError, setFileError] = useState("");

  const fetchRequests = () => {
    if (!currentUser?.uid) return;
    getClientRequests(currentUser.uid, currentUser.email)
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, [currentUser?.uid]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (formError) setFormError("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`File is ${(file.size / (1024 * 1024)).toFixed(2)} MB. Maximum allowed is 5 MB.`);
      setDocFile(null);
      e.target.value = "";
      return;
    }
    setFileError("");
    setDocFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectTitle.trim()) {
      setFormError("Please enter a project title.");
      return;
    }
    if (!form.shortDescription.trim()) {
      setFormError("Please describe your project idea.");
      return;
    }
    if (!form.requirements.trim()) {
      setFormError("Please list required components or tools.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      let documentUrl = "";
      let documentName = "";
      let documentSize = 0;

      if (docFile) {
        const uploadRes = await uploadToCloudinary(docFile, "projifyra/documents");
        documentUrl = uploadRes.url;
        documentName = docFile.name;
        documentSize = docFile.size;
      }

      const addonsRequested = selectedServices
        .map((id) => AVAILABLE_SERVICES.find((s) => s.id === id))
        .filter((s) => s && s.isAddon)
        .map((s) => s.name);

      const addonTotal = selectedServices
        .map((id) => AVAILABLE_SERVICES.find((s) => s.id === id))
        .filter((s) => s && s.isAddon)
        .reduce((sum, s) => sum + (s.price || 0), 0);

      await submitProjectRequest(currentUser.uid, {
        fullName: userProfile?.fullName || currentUser?.displayName || "Student",
        registerNumber: userProfile?.registerNumber || "",
        phone: userProfile?.phone || "",
        email: currentUser?.email || "",
        college: userProfile?.college || "",
        department: userProfile?.department || "",
        year: userProfile?.year || "",
        projectTitle: form.projectTitle.trim(),
        shortDescription: form.shortDescription.trim(),
        requirements: form.requirements.trim(),
        hasComponents: form.hasComponents,
        deliverySpeed: form.deliverySpeed,
        selectedServices,
        pcbTool: selectedServices.includes("pcb_design") ? pcbTool : "",
        simulationTool: selectedServices.includes("simulation") ? simulationTool : "",
        addonsRequested,
        addonTotal,
        documentUrl,
        documentName,
        documentSize,
      });

      setFormSuccess(true);
      setShowForm(false);
      setForm(INITIAL_FORM);
      setSelectedServices(["hardware_prototype"]);
      setDocFile(null);
      fetchRequests();
    } catch (err) {
      setFormError("Failed to submit request: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = {
    "Under Review": "badge-info",
    "Officer Proposed": "badge-warning",
    "Approved": "badge-success",
    "In Progress": "badge-primary",
    "Testing": "badge-warning",
    "Ready for Delivery": "badge-primary",
    "Delivered": "badge-success",
    "Completed": "badge-success",
    "Cancelled": "badge-error",
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: "var(--space-6)", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div>
          <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 800 }}>My Project Requests</h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "2px" }}>
            Track your submitted ideas, review officer proposals, and follow admin approval.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setFormSuccess(false); }}>
          <Plus size={18} /> Submit New Request
        </button>
      </div>

      {formSuccess && (
        <div className="alert alert-success" style={{ marginBottom: "var(--space-5)" }} role="status">
          <CheckCircle2 size={18} />
          Request submitted successfully! Our officers and admin desk will review it shortly.
        </div>
      )}

      {/* Submit Form Modal */}
      {showForm && (
        <div className="card" style={{ marginBottom: "var(--space-6)", border: "1.5px solid var(--color-primary)" }}>
          <div className="card-body">
            <div className="flex-between" style={{ marginBottom: "var(--space-5)" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Submit Project Request</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)} aria-label="Close form">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="alert alert-error" style={{ marginBottom: "var(--space-4)" }} role="alert">
                <AlertCircle size={18} /> {formError}
              </div>
            )}

            {fileError && (
              <div className="alert alert-error" style={{ marginBottom: "var(--space-4)" }} role="alert">
                <ShieldAlert size={18} /> {fileError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group" style={{ marginBottom: "var(--space-4)" }}>
                <label className="form-label" htmlFor="req-title">
                  Project Title <span className="required">*</span>
                </label>
                <input
                  id="req-title"
                  name="projectTitle"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Smart Grid Power Monitoring"
                  value={form.projectTitle}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: "var(--space-4)" }}>
                <label className="form-label" htmlFor="req-desc">
                  Short Description & Problem Statement <span className="required">*</span>
                </label>
                <textarea
                  id="req-desc"
                  name="shortDescription"
                  className="form-control"
                  placeholder="Describe your requirements, system architecture, and goals..."
                  value={form.shortDescription}
                  onChange={handleChange}
                  required
                  rows={3}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "var(--space-4)" }}>
                <label className="form-label" htmlFor="req-reqs">
                  Required Components & Technologies <span className="required">*</span>
                </label>
                <textarea
                  id="req-reqs"
                  name="requirements"
                  className="form-control"
                  placeholder="List sensors, microcontroller (ESP32/Arduino), frameworks..."
                  value={form.requirements}
                  onChange={handleChange}
                  required
                  rows={2}
                />
              </div>

              {/* Deliverables & Software Suite Selection */}
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Select Required Deliverables (Multiple Allowed)
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "8px", marginTop: "6px" }}>
                  {AVAILABLE_SERVICES.map((srv) => {
                    const isChecked = selectedServices.includes(srv.id);
                    return (
                      <label
                        key={srv.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "8px",
                          padding: "10px",
                          borderRadius: "10px",
                          border: `1.5px solid ${isChecked ? "var(--color-primary)" : "var(--color-border)"}`,
                          background: isChecked ? "var(--color-primary-light)" : "var(--color-surface)",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedServices(selectedServices.filter((x) => x !== srv.id));
                            } else {
                              setSelectedServices([...selectedServices, srv.id]);
                            }
                          }}
                          style={{ marginTop: "2px", accentColor: "var(--color-primary)" }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
                            <span>{srv.name}</span>
                            <span style={{ color: srv.price ? "var(--color-primary)" : "var(--color-text-tertiary)", fontSize: "11px" }}>{srv.feeText}</span>
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                            {srv.desc}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* PCB Tool Selector */}
              {selectedServices.includes("pcb_design") && (
                <div className="form-group" style={{ background: "var(--color-bg)", padding: "12px", borderRadius: "10px", marginBottom: "12px" }}>
                  <label className="form-label" style={{ fontSize: "12px", fontWeight: 700 }}>
                    Target PCB Design EDA Tool
                  </label>
                  <select
                    className="form-control"
                    value={pcbTool}
                    onChange={(e) => setPcbTool(e.target.value)}
                  >
                    <option value="Altium Designer">Altium Designer (Professional Multi-Layer)</option>
                    <option value="Cadence Allegro / OrCAD">Cadence Allegro / OrCAD (High-Speed & Industry standard)</option>
                    <option value="KiCad 8.0">KiCad 8.0 (Open-Source Hardware Standard)</option>
                    <option value="EasyEDA Pro">EasyEDA Pro (Rapid JLCPCB Fab Integration)</option>
                  </select>
                </div>
              )}

              {/* Simulation Tool Selector */}
              {selectedServices.includes("simulation") && (
                <div className="form-group" style={{ background: "var(--color-bg)", padding: "12px", borderRadius: "10px", marginBottom: "12px" }}>
                  <label className="form-label" style={{ fontSize: "12px", fontWeight: 700 }}>
                    Target Simulation Suite
                  </label>
                  <select
                    className="form-control"
                    value={simulationTool}
                    onChange={(e) => setSimulationTool(e.target.value)}
                  >
                    <option value="ANSYS HFSS">ANSYS HFSS (Electromagnetics & RF Antenna)</option>
                    <option value="COMSOL Multiphysics">COMSOL Multiphysics (Thermal & Multiphysics FEA)</option>
                    <option value="MATLAB & Simulink">MATLAB & Simulink (Control Systems & DSP)</option>
                    <option value="Proteus VSM">Proteus VSM (Microcontroller Circuit Simulation)</option>
                    <option value="CST Studio Suite">CST Studio Suite (3D EM Simulation)</option>
                  </select>
                </div>
              )}

              <div className="form-grid-2" style={{ marginBottom: "var(--space-4)" }}>
                <div className="form-group">
                  <label className="form-label">Component Ownership</label>
                  <select
                    name="hasComponents"
                    className="form-control"
                    value={form.hasComponents}
                    onChange={handleChange}
                  >
                    <option value="no">No, PROJIFYRA supplies components</option>
                    <option value="yes">Yes, I have my components (2–3 days delivery)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery Timeline Mode</label>
                  <select
                    name="deliverySpeed"
                    className="form-control"
                    value={form.deliverySpeed}
                    onChange={handleChange}
                  >
                    <option value="normal">Normal Turnaround (2–3 Days)</option>
                    <option value="express">⚡ Priority Express (1 Day Turnaround)</option>
                  </select>
                </div>
              </div>

              {/* Document Upload (&le; 5MB) */}
              <div className="form-group" style={{ marginBottom: "var(--space-6)" }}>
                <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Upload PPT / Abstract / Diagram / Specs</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-primary)" }}>Max: 5 MB</span>
                </label>

                {!docFile ? (
                  <label
                    style={{
                      border: "2px dashed var(--color-border)",
                      borderRadius: "12px",
                      padding: "18px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer",
                      background: "var(--color-surface)",
                      textAlign: "center"
                    }}
                  >
                    <UploadCloud size={28} color="var(--color-primary)" />
                    <span style={{ fontSize: "13px", fontWeight: 600, marginTop: "6px" }}>Click to select file</span>
                    <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>PPT, PDF, DOCX, PNG, JPG (Strictly &le; 5MB)</span>
                    <input
                      type="file"
                      accept=".ppt,.pptx,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </label>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--color-surface-hover)", borderRadius: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FileText size={18} color="var(--color-primary)" />
                      <span style={{ fontSize: "13px", fontWeight: 600 }}>{docFile.name} ({(docFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDocFile(null)}>
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Submitting Idea..." : "Submit to Admin Desk"}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="flex-center" style={{ minHeight: 200 }}>
          <div className="spinner spinner-primary" />
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Send size={28} /></div>
          <h3>No requests yet</h3>
          <p>Submit your first project request and our team will review it shortly.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {requests.map((req) => (
            <div
              key={req.id}
              className="card card-body"
              style={{ cursor: "pointer", transition: "all 0.2s ease" }}
              onClick={() => setSelected(selected?.id === req.id ? null : req)}
            >
              <div className="flex-between" style={{ marginBottom: "var(--space-3)", flexWrap: "wrap", gap: "var(--space-2)" }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "4px" }}>
                    {req.projectTitle || "Custom Project"}
                  </div>
                  {/* Deliverables Badges */}
                  {req.selectedServices?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "4px" }}>
                      {req.selectedServices.map((s) => (
                        <span key={s} className="badge badge-primary" style={{ fontSize: "10px", padding: "2px 6px" }}>
                          {s === "pcb_design" ? `PCB (${req.pcbTool || "Altium"})` :
                           s === "simulation" ? `Sim (${req.simulationTool || "ANSYS"})` :
                           s === "hardware_prototype" ? "Hardware" :
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
                  <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                    Submitted: {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString("en-IN") : "Recent"}
                    {req.deliverySpeed === "express" && <span style={{ color: "var(--color-warning)", fontWeight: 700, marginLeft: "8px" }}>⚡ 1-Day Express</span>}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  {req.projectAmount > 0 && (
                    <span style={{ fontWeight: 800, fontSize: "15px", color: "var(--color-primary)" }}>
                      ₹{req.projectAmount.toLocaleString("en-IN")}
                    </span>
                  )}
                  <span className={`badge ${statusBadge[req.status] || "badge-neutral"}`}>{req.status || "Under Review"}</span>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMiniProfileProject(req);
                    }}
                    style={{ fontSize: "11px", padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <Eye size={12} /> Details & Ledger
                  </button>
                </div>
              </div>

              {/* Progress Summary */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--color-bg)", padding: "8px 12px", borderRadius: "8px", fontSize: "12px" }}>
                <span>Completion: <strong style={{ color: "var(--color-primary)" }}>{req.completionPercentage || 0}%</strong></span>
                <span>&bull;</span>
                <span>Components: <strong>{req.hasComponents === "yes" ? "Client Provided" : "Projifyra Sourced"}</strong></span>
                <span>&bull;</span>
                <span>Officer: <strong>{req.assignedOfficerName || "Pending Allocation"}</strong></span>
              </div>

              {/* Expanded details */}
              {selected?.id === req.id && (
                <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--color-border)" }}>
                  <div style={{ marginBottom: "var(--space-3)" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>Problem Statement</div>
                    <div style={{ fontSize: "13px", marginTop: "2px", lineHeight: "1.5" }}>{req.shortDescription}</div>
                  </div>

                  {/* Deliverables & Tools Details */}
                  {req.selectedServices?.length > 0 && (
                    <div style={{ marginBottom: "var(--space-3)", padding: "10px", background: "var(--color-bg)", borderRadius: "8px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: "4px" }}>
                        Selected Deliverables & Tools
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {req.selectedServices.map((s) => (
                          <span key={s} className="badge badge-primary" style={{ fontSize: "11px" }}>
                            {s === "pcb_design" ? `PCB: ${req.pcbTool || "Altium Designer"}` :
                             s === "simulation" ? `Sim: ${req.simulationTool || "ANSYS HFSS"}` :
                             s === "hardware_prototype" ? "Hardware Prototype" :
                             s === "firmware_iot" ? "IoT Firmware" :
                             s === "software_app" ? "Software App" : s}
                          </span>
                        ))}
                      </div>
                      {req.addonsRequested?.length > 0 && (
                        <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                          Add-ons: {req.addonsRequested.join(", ")}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feasibility Verdict Banner */}
                  {req.adminFeasibilityNotes && (
                    <div style={{
                      marginBottom: "var(--space-3)",
                      padding: "12px 14px",
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      borderRadius: "10px"
                    }}>
                      <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#10B981" }}>
                        Admin Feasibility Verdict & Scope Summary
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--color-text)", marginTop: "4px", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
                        {req.adminFeasibilityNotes}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: "var(--space-3)" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>Components Required</div>
                    <div style={{ fontSize: "13px", marginTop: "2px", fontWeight: 600 }}>{req.requirements}</div>
                  </div>

                  {req.documentUrl && (
                    <div style={{ marginTop: "var(--space-3)" }}>
                      <a
                        href={req.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileText size={15} color="var(--color-primary)" />
                        {req.documentName || "View Uploaded Document (&le; 5MB)"}
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMiniProfileProject(req);
                      }}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <Eye size={14} /> View Mini Profile & Financial Ledger
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Mini Profile Modal */}
      <ProjectMiniProfileModal
        project={miniProfileProject}
        isOpen={!!miniProfileProject}
        onClose={() => setMiniProfileProject(null)}
        onOpenPayment={() => {
          setMiniProfileProject(null);
          navigate("/dashboard");
        }}
        onWriteReview={() => navigate("/dashboard/reviews")}
      />
    </div>
  );
}
