import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Send, ShoppingBag, CheckCircle2, Clock, FolderOpen,
  Cpu, Wrench, Layers, ArrowRight, UploadCloud, FileText,
  ExternalLink, QrCode, ShieldCheck, Plus, Sparkles, Check,
  AlertCircle, X, ShieldAlert, Award, BookOpen, Video
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  getClientRequests,
  submitPaymentScreenshot,
  requestProjectAddon,
  submitProjectRequest,
  ADDON_SERVICES,
  PROGRESS_STAGES,
  ORDER_STATUS
} from "../../../services/orderService";
import { uploadToCloudinary } from "../../../services/cloudinaryService";

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

export default function ClientHome() {
  const { userProfile, currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState(null);

  // Payment Upload Modal State
  const [paymentModal, setPaymentModal] = useState(null); // 'advance' | 'final'
  const [paymentFile, setPaymentFile] = useState(null);
  const [paymentTxnId, setPaymentTxnId] = useState("");
  const [paymentFileError, setPaymentFileError] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Add-on Request State
  const [addonLoading, setAddonLoading] = useState(null);

  // New Idea Submission Modal State
  const [newIdeaModal, setNewIdeaModal] = useState(false);
  const [newIdeaForm, setNewIdeaForm] = useState({
    projectTitle: "",
    shortDescription: "",
    requirements: "",
    hasComponents: "no",
    deliverySpeed: "normal",
  });
  const [ideaServices, setIdeaServices] = useState(["hardware_prototype"]);
  const [ideaPcbTool, setIdeaPcbTool] = useState("Altium Designer");
  const [ideaSimTool, setIdeaSimTool] = useState("ANSYS HFSS");
  const [newIdeaFile, setNewIdeaFile] = useState(null);
  const [newIdeaFileError, setNewIdeaFileError] = useState("");
  const [newIdeaSubmitting, setNewIdeaSubmitting] = useState(false);

  const [notification, setNotification] = useState({ type: "", text: "" });

  const fetchClientData = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const data = await getClientRequests(currentUser.uid, currentUser.email);
      setRequests(data);
      // Pick first active or approved request as the hero project
      const approvedOrActive = data.find((r) => r.status === "Approved" || r.status === "In Progress" || r.status === "Completed") || data[0];
      setActiveRequest(approvedOrActive || null);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [currentUser?.uid]);

  // Handle Payment Screenshot Upload
  const handlePaymentFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setPaymentFileError(
        `File is ${(file.size / (1024 * 1024)).toFixed(2)} MB. Maximum allowed size is 5 MB. Please upload a smaller screenshot.`
      );
      setPaymentFile(null);
      e.target.value = "";
      return;
    }
    setPaymentFileError("");
    setPaymentFile(file);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentFile || !activeRequest) {
      setPaymentFileError("Please select your payment screenshot first.");
      return;
    }

    setPaymentSubmitting(true);
    try {
      const uploadRes = await uploadToCloudinary(paymentFile, "projifyra/payments");
      await submitPaymentScreenshot(activeRequest.id, {
        type: paymentModal,
        screenshotUrl: uploadRes.url,
        transactionId: paymentTxnId.trim(),
      });

      setNotification({
        type: "success",
        text: "Payment screenshot submitted! Admin will verify and activate your project development.",
      });
      setPaymentModal(null);
      setPaymentFile(null);
      setPaymentTxnId("");
      fetchClientData();
    } catch (err) {
      setPaymentFileError("Upload failed: " + err.message);
    } finally {
      setPaymentSubmitting(false);
      setTimeout(() => setNotification({ type: "", text: "" }), 5000);
    }
  };

  // Handle Add-on Service Request
  const handleAddonRequest = async (addon) => {
    if (!activeRequest) return;
    setAddonLoading(addon.id);
    try {
      await requestProjectAddon(activeRequest.id, addon);
      setNotification({
        type: "success",
        text: `Requested "${addon.name}" for ₹${addon.price}! Our team has been notified.`,
      });
      fetchClientData();
    } catch (err) {
      setNotification({ type: "error", text: "Failed to request add-on: " + err.message });
    } finally {
      setAddonLoading(null);
      setTimeout(() => setNotification({ type: "", text: "" }), 4000);
    }
  };

  // Handle New Idea Submission from Dashboard
  const handleNewIdeaFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setNewIdeaFileError(`File exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please choose a file within 5MB.`);
      setNewIdeaFile(null);
      e.target.value = "";
      return;
    }
    setNewIdeaFileError("");
    setNewIdeaFile(file);
  };

  const handleNewIdeaSubmit = async (e) => {
    e.preventDefault();
    if (!newIdeaForm.projectTitle.trim() || !newIdeaForm.shortDescription.trim() || !newIdeaForm.requirements.trim()) {
      setNewIdeaFileError("Please fill in project title, description, and requirements.");
      return;
    }

    setNewIdeaSubmitting(true);
    try {
      let documentUrl = "";
      let documentName = "";
      let documentSize = 0;

      if (newIdeaFile) {
        const uploadRes = await uploadToCloudinary(newIdeaFile, "projifyra/documents");
        documentUrl = uploadRes.url;
        documentName = newIdeaFile.name;
        documentSize = newIdeaFile.size;
      }

      const addonsRequested = ideaServices
        .map((id) => AVAILABLE_SERVICES.find((s) => s.id === id))
        .filter((s) => s && s.isAddon)
        .map((s) => s.name);

      const addonTotal = ideaServices
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
        ...newIdeaForm,
        selectedServices: ideaServices,
        pcbTool: ideaServices.includes("pcb_design") ? ideaPcbTool : "",
        simulationTool: ideaServices.includes("simulation") ? ideaSimTool : "",
        addonsRequested,
        addonTotal,
        documentUrl,
        documentName,
        documentSize,
      });

      setNotification({
        type: "success",
        text: "New idea submitted successfully to the Admin & Officer pool!",
      });
      setNewIdeaModal(false);
      setNewIdeaForm({
        projectTitle: "",
        shortDescription: "",
        requirements: "",
        hasComponents: "no",
        deliverySpeed: "normal",
      });
      setIdeaServices(["hardware_prototype"]);
      setNewIdeaFile(null);
      fetchClientData();
    } catch (err) {
      setNewIdeaFileError("Failed to submit idea: " + err.message);
    } finally {
      setNewIdeaSubmitting(false);
      setTimeout(() => setNotification({ type: "", text: "" }), 5000);
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div className="flex-between" style={{ marginBottom: "var(--space-6)", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text)" }}>
            Welcome back, {typeof userProfile?.fullName === "string" && userProfile.fullName.trim() ? userProfile.fullName.trim().split(" ")[0] : (currentUser?.displayName?.split(" ")[0] || "Student")}!
          </h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "2px" }}>
            {userProfile?.department ? `${userProfile.department} • Reg: ${userProfile.registerNumber || "Verified"}` : "PROJIFYRA Project Dashboard"}
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setNewIdeaModal(true)}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Plus size={18} /> Submit Another Project / Idea
        </button>
      </div>

      {notification.text && (
        <div className={`alert alert-${notification.type}`} style={{ marginBottom: "var(--space-5)" }}>
          {notification.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {notification.text}
        </div>
      )}

      {loading ? (
        <div className="flex-center" style={{ minHeight: 300 }}>
          <div className="spinner spinner-primary" />
        </div>
      ) : !activeRequest ? (
        /* Empty State */
        <div className="card card-body" style={{ textAlign: "center", padding: "var(--space-12)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-primary-light)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-4)" }}>
            <FolderOpen size={32} />
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "var(--space-2)" }}>
            No Active Projects Yet
          </h3>
          <p style={{ color: "var(--color-text-secondary)", maxWidth: "480px", margin: "0 auto var(--space-6)", fontSize: "14px" }}>
            Submit your first engineering project idea or academic requirement with document/PPT (&le; 5MB). Our officers and admin will review and build it for you.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => setNewIdeaModal(true)}>
            Submit Your Idea Now
          </button>
        </div>
      ) : (
        /* Dynamic Transformed Project Tracker */
        <div>
          {/* Multiple Projects Switcher if user has > 1 */}
          {requests.length > 1 && (
            <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "10px", marginBottom: "var(--space-6)" }}>
              {requests.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setActiveRequest(r)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    border: `1.5px solid ${activeRequest.id === r.id ? "var(--color-primary)" : "var(--color-border)"}`,
                    background: activeRequest.id === r.id ? "var(--color-primary-light)" : "var(--color-surface)",
                    color: activeRequest.id === r.id ? "var(--color-primary)" : "var(--color-text)",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  {r.projectTitle || "Project"} &bull; {r.completionPercentage || 0}%
                </button>
              ))}
            </div>
          )}

          {/* ======================================================== */}
          {/* HERO PROJECT TRACKER CARD                                */}
          {/* ======================================================== */}
          <div className="card" style={{ marginBottom: "var(--space-8)", overflow: "hidden", border: "1px solid var(--color-border)" }}>
            <div style={{
              background: "linear-gradient(135deg, rgba(99,91,255,0.08) 0%, rgba(37,99,235,0.04) 100%)",
              padding: "var(--space-6) var(--space-8)",
              borderBottom: "1px solid var(--color-border)"
            }}>
              <div className="flex-between" style={{ flexWrap: "wrap", gap: "var(--space-4)" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span className="badge badge-primary" style={{ textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em" }}>
                      Active Project Tracker
                    </span>
                    <span className={`badge ${activeRequest.status === "Approved" || activeRequest.status === "In Progress" ? "badge-success" : "badge-info"}`}>
                      {activeRequest.status || "Under Review"}
                    </span>
                    {activeRequest.deliverySpeed === "express" && (
                      <span className="badge badge-warning" style={{ fontWeight: 700 }}>
                        ⚡ 1-Day Express Delivery
                      </span>
                    )}
                  </div>

                  <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
                    {activeRequest.projectTitle}
                  </h1>

                  {/* Deliverables Badges */}
                  {Array.isArray(activeRequest.selectedServices) && activeRequest.selectedServices.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                      {activeRequest.selectedServices.map((s, sIdx) => {
                        let label = "";
                        if (typeof s === "string") {
                          if (s === "pcb" || s === "pcb_design") label = `PCB: ${activeRequest.pcbTool || "Altium Designer"}`;
                          else if (s === "simulation") label = `Simulation: ${activeRequest.simulationTool || "ANSYS HFSS"}`;
                          else if (s === "hardware" || s === "hardware_prototype") label = "Hardware Prototype";
                          else if (s === "firmware" || s === "firmware_iot") label = "IoT Firmware";
                          else if (s === "software" || s === "software_app") label = "Software App";
                          else if (s === "ppt") label = "PPT Presentation";
                          else if (s === "document") label = "Report Documentation";
                          else if (s === "paper") label = "Research Paper";
                          else if (s === "mentoring") label = "Mentoring Session";
                          else label = s;
                        } else if (s && typeof s === "object") {
                          label = s.name || s.title || s.id || "Deliverable";
                        } else {
                          label = "Deliverable";
                        }
                        return (
                          <span key={typeof s === "string" ? s : sIdx} className="badge badge-primary" style={{ fontSize: "11px" }}>
                            {label}
                          </span>
                        );
                      })}
                      {Number(activeRequest.addonTotal || 0) > 0 && (
                        <span className="badge badge-warning" style={{ fontSize: "11px" }}>
                          Add-ons: ₹{Number(activeRequest.addonTotal).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  )}

                  <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "8px", maxWidth: "680px" }}>
                    {activeRequest.shortDescription}
                  </p>
                </div>

                {/* Big Live Completion Percentage Ring */}
                <div style={{ textAlign: "center", minWidth: "140px" }}>
                  <div style={{ fontSize: "2.8rem", fontWeight: 900, color: "var(--color-primary)", lineHeight: 1 }}>
                    {activeRequest.completionPercentage || 0}%
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                    Completed
                  </div>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div style={{ marginTop: "var(--space-6)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: "6px" }}>
                  <span>Development Stage</span>
                  <span style={{ color: "var(--color-primary)" }}>
                    {activeRequest.completionPercentage >= 100
                      ? "100% — Project Completed & Ready for Delivery"
                      : activeRequest.completionPercentage >= 75
                      ? "75% — Testing & Quality Check"
                      : activeRequest.completionPercentage >= 50
                      ? "50% — Hardware/Software Assembly"
                      : activeRequest.completionPercentage >= 25
                      ? "25% — Prototype & Firmware Development"
                      : activeRequest.status === "Approved"
                      ? "Idea Approved — Awaiting 30% Advance"
                      : "Under Review by Admin Desk"}
                  </span>
                </div>
                <div style={{ height: "12px", width: "100%", background: "var(--color-surface-hover)", borderRadius: "999px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${activeRequest.completionPercentage || (activeRequest.status === "Approved" ? 10 : 5)}%`,
                      background: "linear-gradient(90deg, #635BFF 0%, #2563EB 50%, #10B981 100%)",
                      borderRadius: "999px",
                      transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
                    }}
                  />
                </div>
              </div>

              {/* Feasibility Verdict Banner from Admin */}
              {activeRequest.adminFeasibilityNotes && (
                <div style={{
                  marginTop: "var(--space-6)",
                  padding: "16px 18px",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.28)",
                  borderRadius: "14px",
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start"
                }}>
                  <CheckCircle2 size={22} color="#10B981" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "#10B981", letterSpacing: "0.05em" }}>
                      PROJIFYRA Feasibility Review & Scope Verdict (What can be done vs limitations)
                    </div>
                    <div style={{ fontSize: "14px", color: "var(--color-text)", marginTop: "4px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                      {activeRequest.adminFeasibilityNotes}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Project Milestones Grid */}
            <div style={{ padding: "var(--space-6) var(--space-8)", borderBottom: "1px solid var(--color-border)" }}>
              <div className="progress-timeline" style={{ margin: 0 }}>
                {PROGRESS_STAGES.map((stage, idx) => {
                  let isDone = false;
                  let isCurrent = false;

                  if (idx === 0) {
                    isDone = activeRequest.status === "Approved" || activeRequest.status === "In Progress" || activeRequest.status === "Completed";
                  } else if (idx === 1) {
                    isDone = activeRequest.advancePaymentStatus === "Verified";
                    isCurrent = activeRequest.status === "Approved" && activeRequest.advancePaymentStatus !== "Verified";
                  } else if (idx === 2) {
                    isDone = (activeRequest.completionPercentage || 0) >= 50;
                    isCurrent = (activeRequest.completionPercentage || 0) > 0 && (activeRequest.completionPercentage || 0) < 50;
                  } else if (idx === 3) {
                    isDone = (activeRequest.completionPercentage || 0) >= 90;
                    isCurrent = (activeRequest.completionPercentage || 0) >= 50 && (activeRequest.completionPercentage || 0) < 90;
                  } else if (idx === 4) {
                    isDone = (activeRequest.completionPercentage || 0) >= 100;
                    isCurrent = (activeRequest.completionPercentage || 0) >= 90;
                  }

                  return (
                    <div key={stage} className={`progress-step${isDone ? " done" : ""}${isCurrent ? " current" : ""}`}>
                      <div className="progress-step-dot">{isDone ? "✓" : idx + 1}</div>
                      <div className="progress-step-label">{stage}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Specs & Team Breakdown */}
            <div style={{ padding: "var(--space-6) var(--space-8)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)", fontSize: "13px" }}>
              <div style={{ padding: "12px", background: "var(--color-bg)", borderRadius: "12px" }}>
                <span style={{ color: "var(--color-text-secondary)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                  Components Status
                </span>
                <div style={{ fontWeight: 700, marginTop: "4px", color: activeRequest.hasComponents === "yes" ? "var(--color-success)" : "var(--color-text)" }}>
                  {activeRequest.hasComponents === "yes" ? "Client Provided (2-3 days turnaround)" : "PROJIFYRA Sourced & Supplied"}
                </div>
              </div>

              <div style={{ padding: "12px", background: "var(--color-bg)", borderRadius: "12px" }}>
                <span style={{ color: "var(--color-text-secondary)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                  Assigned Lead Officer
                </span>
                <div style={{ fontWeight: 700, marginTop: "4px" }}>
                  {activeRequest.assignedOfficerName || "Pending Admin Allocation"}
                </div>
              </div>

              <div style={{ padding: "12px", background: "var(--color-bg)", borderRadius: "12px" }}>
                <span style={{ color: "var(--color-text-secondary)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                  Uploaded Documentation (&le; 5MB)
                </span>
                <div style={{ marginTop: "4px" }}>
                  {activeRequest.documentUrl ? (
                    <a
                      href={activeRequest.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--color-primary)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      <FileText size={14} /> {activeRequest.documentName || "View File"} <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span style={{ color: "var(--color-text-tertiary)" }}>None uploaded</span>
                  )}
                </div>
              </div>

              <div style={{ padding: "12px", background: "var(--color-bg)", borderRadius: "12px" }}>
                <span style={{ color: "var(--color-text-secondary)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>
                  Total Project Cost
                </span>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", marginTop: "2px", color: "var(--color-text)" }}>
                  {Number(activeRequest.projectAmount || 0) > 0 ? `₹${Number(activeRequest.projectAmount).toLocaleString("en-IN")}` : "Awaiting Admin Pricing"}
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION: 30% ADVANCE PAYMENT GATEWAY & QR CODE           */}
          {/* ======================================================== */}
          {Number(activeRequest.projectAmount || 0) > 0 && (
            <div className="card" style={{ marginBottom: "var(--space-8)", border: "1px solid var(--color-border)" }}>
              <div className="card-body">
                <div className="flex-between" style={{ flexWrap: "wrap", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
                  <div>
                    <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text)" }}>
                      Payment Milestones (30% Upfront Requirement)
                    </h3>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "2px" }}>
                      As per PROJIFYRA policy, work officially begins after the 30% initial advance is confirmed.
                    </p>
                  </div>

                  <span className={`badge ${
                    activeRequest.advancePaymentStatus === "Verified"
                      ? "badge-success"
                      : activeRequest.advancePaymentStatus === "Submitted"
                      ? "badge-warning"
                      : "badge-error"
                  }`} style={{ fontSize: "13px", padding: "6px 14px" }}>
                    {activeRequest.advancePaymentStatus === "Verified"
                      ? "✓ 30% Advance Verified & Active"
                      : activeRequest.advancePaymentStatus === "Submitted"
                      ? "⏳ Screenshot Submitted — Verifying"
                      : "30% Advance Pending"}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-6)", alignItems: "center" }}>
                  {/* Left: QR Code from public/payment_QR.png */}
                  <div style={{ textAlign: "center", padding: "16px", background: "var(--color-bg)", borderRadius: "16px", border: "1px solid var(--color-border)" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "10px", color: "var(--color-text)" }}>
                      Scan UPI QR to Pay
                    </div>
                    <img
                      src="/payment_QR.png"
                      alt="PROJIFYRA Payment QR"
                      style={{ width: "190px", height: "190px", objectFit: "contain", borderRadius: "12px", background: "#fff", padding: "8px", boxShadow: "var(--shadow-sm)" }}
                    />
                    <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "10px", fontWeight: 600 }}>
                      UPI / GPay / PhonePe / Paytm
                    </div>
                  </div>

                  {/* Right: Payment Details & Upload Trigger */}
                  <div>
                    <div style={{ background: "var(--color-surface-hover)", padding: "16px", borderRadius: "14px", marginBottom: "var(--space-4)" }}>
                      <div className="flex-between" style={{ marginBottom: "8px" }}>
                        <span style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>Total Project Value:</span>
                        <strong style={{ fontSize: "15px" }}>₹{Number(activeRequest.projectAmount || 0).toLocaleString("en-IN")}</strong>
                      </div>
                      <div className="flex-between" style={{ marginBottom: "8px" }}>
                        <span style={{ color: "var(--color-text)", fontWeight: 700, fontSize: "14px" }}>Required 30% Initial Advance:</span>
                        <strong style={{ color: "var(--color-primary)", fontSize: "1.2rem", fontWeight: 900 }}>
                          ₹{Number(activeRequest.advancePaymentRequired || Math.round(Number(activeRequest.projectAmount || 0) * 0.3)).toLocaleString("en-IN")}
                        </strong>
                      </div>
                      <div className="flex-between">
                        <span style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>Remaining 70% Balance upon Completion:</span>
                        <strong style={{ fontSize: "14px" }}>
                          ₹{Math.round(Number(activeRequest.projectAmount || 0) * 0.7).toLocaleString("en-IN")}
                        </strong>
                      </div>
                    </div>

                    {activeRequest.advancePaymentStatus === "Verified" ? (
                      <div style={{ padding: "12px 16px", background: "rgba(16, 185, 129, 0.12)", color: "#10B981", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px", fontWeight: 700, fontSize: "14px" }}>
                        <CheckCircle2 size={20} />
                        Your 30% advance has been verified. The team is actively developing your project!
                      </div>
                    ) : activeRequest.advancePaymentStatus === "Submitted" ? (
                      <div style={{ padding: "12px 16px", background: "rgba(245, 158, 11, 0.12)", color: "#D97706", borderRadius: "12px", fontSize: "13px" }}>
                        <div style={{ fontWeight: 700, marginBottom: "4px" }}>Screenshot Submitted for Verification</div>
                        <div>Our admin desk is checking your transaction. Work begins immediately upon confirmation.</div>
                      </div>
                    ) : (
                      <div>
                        <button
                          className="btn btn-primary btn-lg btn-full"
                          onClick={() => {
                            setPaymentModal("advance");
                            setPaymentFile(null);
                            setPaymentTxnId("");
                            setPaymentFileError("");
                          }}
                        >
                          <UploadCloud size={18} /> Upload 30% Advance Screenshot (&le; 5MB)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SECTION: ADD-ON SERVICES (PPT, DOCS, PAPER, MENTORING)    */}
          {/* ======================================================== */}
          <div style={{ marginBottom: "var(--space-8)" }}>
            <div style={{ marginBottom: "var(--space-4)" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text)" }}>
                Add-on Services & Guidance
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>
                Need PPT slides, complete IEEE documentation, conference paper editing, or viva mentoring? Request them anytime below:
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-4)" }}>
              {ADDON_SERVICES.map((addon) => {
                const isRequested = Array.isArray(activeRequest.addonsRequested) && activeRequest.addonsRequested.some((a) => {
                  if (!a) return false;
                  if (typeof a === "string") return a === addon.id || a === addon.name;
                  return a?.id === addon.id || a?.name === addon.name;
                });

                return (
                  <div key={addon.id} className="card card-body" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div className="flex-between" style={{ marginBottom: "8px" }}>
                        <span className="badge badge-primary" style={{ fontSize: "11px" }}>{addon.badge}</span>
                        <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-primary)" }}>
                          ₹{addon.price}
                        </span>
                      </div>
                      <h4 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "6px", color: "var(--color-text)" }}>
                        {addon.name}
                      </h4>
                      <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: "1.5", marginBottom: "14px" }}>
                        {addon.description}
                      </p>
                    </div>

                    <button
                      className={`btn btn-sm ${isRequested ? "btn-outline" : "btn-primary"}`}
                      onClick={() => handleAddonRequest(addon)}
                      disabled={isRequested || addonLoading === addon.id}
                      style={{ width: "100%", justifyContent: "center" }}
                    >
                      {isRequested ? "✓ Added to Project" : addonLoading === addon.id ? "Requesting..." : `Request for ₹${addon.price}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: UPLOAD PAYMENT SCREENSHOT (&le; 5MB)              */}
      {/* ======================================================== */}
      {paymentModal && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-card animate-fade-up" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "18px", width: "100%", maxWidth: "480px", padding: "24px", boxShadow: "var(--shadow-xl)" }}>
            <div className="flex-between" style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                Upload 30% Advance Screenshot
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setPaymentModal(null)}>
                <X size={18} />
              </button>
            </div>

            {paymentFileError && (
              <div className="alert alert-error" style={{ marginBottom: "14px", fontSize: "12px" }}>
                <ShieldAlert size={16} /> {paymentFileError}
              </div>
            )}

            <form onSubmit={handlePaymentSubmit}>
              <div style={{ textAlign: "center", padding: "12px", background: "var(--color-bg)", borderRadius: "12px", marginBottom: "16px" }}>
                <img
                  src="/payment_QR.png"
                  alt="QR"
                  style={{ width: "140px", height: "140px", objectFit: "contain", background: "#fff", padding: "6px", borderRadius: "10px" }}
                />
                <div style={{ fontWeight: 800, fontSize: "15px", color: "var(--color-primary)", marginTop: "6px" }}>
                  Amount to Pay: ₹{(activeRequest?.advancePaymentRequired || Math.round((activeRequest?.projectAmount || 1000) * 0.3)).toLocaleString("en-IN")}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label">Transaction Reference / UTR Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 429812904812"
                  value={paymentTxnId}
                  onChange={(e) => setPaymentTxnId(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Upload Screenshot</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-primary)" }}>Max: 5 MB</span>
                </label>

                {!paymentFile ? (
                  <label
                    style={{
                      border: "2px dashed var(--color-border)",
                      borderRadius: "12px",
                      padding: "20px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer",
                      background: "var(--color-surface)"
                    }}
                  >
                    <UploadCloud size={28} color="var(--color-primary)" />
                    <span style={{ fontSize: "13px", fontWeight: 600, marginTop: "6px" }}>Click to select screenshot</span>
                    <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>PNG, JPG, JPEG (&le; 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePaymentFileSelect}
                      style={{ display: "none" }}
                    />
                  </label>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--color-surface-hover)", borderRadius: "10px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>{paymentFile.name} ({(paymentFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPaymentFile(null)}>
                      <X size={15} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setPaymentModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={paymentSubmitting}>
                  {paymentSubmitting ? "Uploading..." : "Submit for Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: SUBMIT ANOTHER PROJECT / IDEA                   */}
      {/* ======================================================== */}
      {newIdeaModal && (
        <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-card animate-fade-up" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "18px", width: "100%", maxWidth: "580px", maxHeight: "90vh", overflowY: "auto", padding: "24px", boxShadow: "var(--shadow-xl)" }}>
            <div className="flex-between" style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
                Submit New Project Idea
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setNewIdeaModal(false)}>
                <X size={18} />
              </button>
            </div>

            {newIdeaFileError && (
              <div className="alert alert-error" style={{ marginBottom: "14px", fontSize: "12px" }}>
                <ShieldAlert size={16} /> {newIdeaFileError}
              </div>
            )}

            <form onSubmit={handleNewIdeaSubmit}>
              <div className="form-group">
                <label className="form-label">Project / Idea Title <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Smart IoT Agriculture System"
                  value={newIdeaForm.projectTitle}
                  onChange={(e) => setNewIdeaForm((f) => ({ ...f, projectTitle: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Short Description / Problem Statement <span className="required">*</span></label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="Explain your concept, goals, and expected functionality..."
                  value={newIdeaForm.shortDescription}
                  onChange={(e) => setNewIdeaForm((f) => ({ ...f, shortDescription: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Components & Tools Required <span className="required">*</span></label>
                <textarea
                  rows={2}
                  className="form-control"
                  placeholder="Microcontroller, sensors, modules, languages..."
                  value={newIdeaForm.requirements}
                  onChange={(e) => setNewIdeaForm((f) => ({ ...f, requirements: e.target.value }))}
                  required
                />
              </div>

              {/* Deliverables & Software Suite Selection */}
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Select Required Deliverables (Multiple Allowed)
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "8px", marginTop: "6px" }}>
                  {AVAILABLE_SERVICES.map((srv) => {
                    const isChecked = ideaServices.includes(srv.id);
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
                              setIdeaServices(ideaServices.filter((x) => x !== srv.id));
                            } else {
                              setIdeaServices([...ideaServices, srv.id]);
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
              {ideaServices.includes("pcb_design") && (
                <div className="form-group" style={{ background: "var(--color-bg)", padding: "12px", borderRadius: "10px", marginBottom: "12px" }}>
                  <label className="form-label" style={{ fontSize: "12px", fontWeight: 700 }}>
                    Target PCB Design EDA Tool
                  </label>
                  <select
                    className="form-control"
                    value={ideaPcbTool}
                    onChange={(e) => setIdeaPcbTool(e.target.value)}
                  >
                    <option value="Altium Designer">Altium Designer (Professional Multi-Layer)</option>
                    <option value="Cadence Allegro / OrCAD">Cadence Allegro / OrCAD (High-Speed & Industry standard)</option>
                    <option value="KiCad 8.0">KiCad 8.0 (Open-Source Hardware Standard)</option>
                    <option value="EasyEDA Pro">EasyEDA Pro (Rapid JLCPCB Fab Integration)</option>
                  </select>
                </div>
              )}

              {/* Simulation Tool Selector */}
              {ideaServices.includes("simulation") && (
                <div className="form-group" style={{ background: "var(--color-bg)", padding: "12px", borderRadius: "10px", marginBottom: "12px" }}>
                  <label className="form-label" style={{ fontSize: "12px", fontWeight: 700 }}>
                    Target Simulation Suite
                  </label>
                  <select
                    className="form-control"
                    value={ideaSimTool}
                    onChange={(e) => setIdeaSimTool(e.target.value)}
                  >
                    <option value="ANSYS HFSS">ANSYS HFSS (Electromagnetics & RF Antenna)</option>
                    <option value="COMSOL Multiphysics">COMSOL Multiphysics (Thermal & Multiphysics FEA)</option>
                    <option value="MATLAB & Simulink">MATLAB & Simulink (Control Systems & DSP)</option>
                    <option value="Proteus VSM">Proteus VSM (Microcontroller Circuit Simulation)</option>
                    <option value="CST Studio Suite">CST Studio Suite (3D EM Simulation)</option>
                  </select>
                </div>
              )}

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Do you have components?</label>
                  <select
                    className="form-control"
                    value={newIdeaForm.hasComponents}
                    onChange={(e) => setNewIdeaForm((f) => ({ ...f, hasComponents: e.target.value }))}
                  >
                    <option value="no">No, PROJIFYRA supplies them</option>
                    <option value="yes">Yes, I provide components (2–3 days delivery)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery Timeline Preference</label>
                  <select
                    className="form-control"
                    value={newIdeaForm.deliverySpeed}
                    onChange={(e) => setNewIdeaForm((f) => ({ ...f, deliverySpeed: e.target.value }))}
                  >
                    <option value="normal">Normal (2–3 Days)</option>
                    <option value="express">⚡ Priority Express (1 Day)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label className="form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Upload Document / PPT / Abstract / Diagram</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-primary)" }}>Max: 5 MB</span>
                </label>

                {!newIdeaFile ? (
                  <label
                    style={{
                      border: "2px dashed var(--color-border)",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer",
                      background: "var(--color-surface)"
                    }}
                  >
                    <UploadCloud size={24} color="var(--color-primary)" />
                    <span style={{ fontSize: "12px", fontWeight: 600, marginTop: "4px" }}>Choose File (&le; 5MB)</span>
                    <input
                      type="file"
                      accept=".ppt,.pptx,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={handleNewIdeaFileSelect}
                      style={{ display: "none" }}
                    />
                  </label>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--color-surface-hover)", borderRadius: "10px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>{newIdeaFile.name} ({(newIdeaFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setNewIdeaFile(null)}>
                      <X size={15} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setNewIdeaModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={newIdeaSubmitting}>
                  {newIdeaSubmitting ? "Submitting Idea..." : "Submit Idea to Admin Pool"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
