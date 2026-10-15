import React, { useState } from "react";
import {
  X, CheckCircle2, Clock, AlertCircle, ShieldCheck, DollarSign,
  FileText, ExternalLink, Cpu, Wrench, Layers, User, Star,
  Award, QrCode, ArrowRight, UploadCloud, Check, ShieldAlert
} from "lucide-react";
import { Link } from "react-router-dom";
import { PROGRESS_STAGES, ORDER_STATUS } from "../../services/orderService";

export default function ProjectMiniProfileModal({ project, isOpen, onClose, onOpenPayment, onWriteReview }) {
  if (!isOpen || !project) return null;

  const totalAmount = Number(project.projectAmount || project.price || 0);
  const compCost = Number(project.componentCost || 0);
  const makeCost = Number(project.makingCost || (totalAmount > 0 ? totalAmount - compCost - (project.addonTotal || 0) : 0));
  const addonCost = Number(project.addonTotal || 0);
  const advanceAmount = Number(project.advancePaymentRequired || Math.round(totalAmount * 0.3));
  const balanceAmount = Math.max(0, totalAmount - advanceAmount);

  const isAdvanceVerified = project.advancePaymentStatus === "Verified";
  const isFinalVerified = project.finalPaymentStatus === "Verified";
  const isAdvanceSubmitted = project.advancePaymentStatus === "Submitted";
  const isFinalSubmitted = project.finalPaymentStatus === "Submitted";
  const isDelivered = project.status === ORDER_STATUS.DELIVERED || project.status === "Delivered";
  const isReadyForDelivery = project.status === ORDER_STATUS.READY_FOR_DELIVERY || project.status === "Ready for Delivery";
  const is100Pct = Number(project.completionPercentage || 0) >= 100;

  const [acknowledged, setAcknowledged] = useState(true);

  return (
    <div
      className="modal-backdrop animate-fade-in"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 15, 29, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto"
      }}
      onClick={onClose}
    >
      <div
        className="modal-card animate-scale-up"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "760px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "28px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          position: "relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex-between" style={{ alignItems: "flex-start", marginBottom: "20px", borderBottom: "1px solid var(--color-border)", paddingBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
              <span className="badge badge-primary" style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Project Mini Profile
              </span>
              <span className={`badge ${
                isDelivered ? "badge-success" :
                isReadyForDelivery ? "badge-success" :
                project.status === "Approved" || project.status === "In Progress" ? "badge-primary" : "badge-info"
              }`}>
                {project.status || "Under Review"}
              </span>
              {project.deliverySpeed === "express" && (
                <span className="badge badge-warning" style={{ fontWeight: 700 }}>
                  ⚡ 1-Day Express
                </span>
              )}
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                ID: {(project.id || "").slice(0, 10).toUpperCase()}
              </span>
            </div>

            <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--color-text)", margin: 0, lineHeight: 1.3 }}>
              {project.projectTitle || project.title || "Custom Engineering Project"}
            </h2>
          </div>

          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ borderRadius: "50%", width: 36, height: 36, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Deliverables Badges */}
        {Array.isArray(project.selectedServices) && project.selectedServices.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "18px" }}>
            {project.selectedServices.map((s, idx) => (
              <span key={typeof s === "string" ? s : idx} className="badge badge-outline" style={{ fontSize: "11px" }}>
                {s === "pcb_design" ? `PCB (${project.pcbTool || "Altium"})` :
                 s === "simulation" ? `Simulation (${project.simulationTool || "ANSYS"})` :
                 s === "hardware_prototype" ? "Hardware Prototype" :
                 s === "firmware_iot" ? "IoT Firmware" :
                 s === "software_app" ? "Software App" : s}
              </span>
            ))}
            {addonCost > 0 && (
              <span className="badge badge-warning" style={{ fontSize: "11px", fontWeight: 700 }}>
                Includes Add-ons (₹{addonCost})
              </span>
            )}
          </div>
        )}

        {/* Celebratory Delivery / Ready Status Banner */}
        {isDelivered && (
          <div style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)",
            border: "1.5px solid #10B981",
            borderRadius: "14px",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#10B981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Check size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "15px", color: "var(--color-text)" }}>
                  🎉 Project Officially Delivered!
                </div>
                <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                  Your physical/digital deliverables are completed. We wish you great success in your project viva!
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                onClose();
                if (onWriteReview) onWriteReview(project);
              }}
              style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}
            >
              <Star size={16} fill="#F59E0B" color="#F59E0B" /> Share Your Review
            </button>
          </div>
        )}

        {isReadyForDelivery && !isDelivered && (
          <div style={{
            background: "linear-gradient(135deg, rgba(99, 91, 255, 0.12) 0%, rgba(37, 99, 235, 0.08) 100%)",
            border: "1.5px solid var(--color-primary)",
            borderRadius: "14px",
            padding: "16px 20px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Award size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "15px", color: "var(--color-text)" }}>
                📦 100% Completed & Ready for Delivery!
              </div>
              <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                Our engineering team has thoroughly tested and verified your hardware & documentation. Your package is prepared for dispatch/pickup.
              </div>
            </div>
          </div>
        )}

        {/* Progress Milestone Bar */}
        <div style={{ marginBottom: "22px", background: "var(--color-bg)", padding: "16px", borderRadius: "14px" }}>
          <div className="flex-between" style={{ fontSize: "12px", fontWeight: 700, marginBottom: "8px" }}>
            <span style={{ color: "var(--color-text-secondary)" }}>Project Lifecycle Progress</span>
            <span style={{ color: "var(--color-primary)", fontSize: "14px", fontWeight: 900 }}>
              {project.completionPercentage || 0}% Completed
            </span>
          </div>

          <div style={{ height: "10px", width: "100%", background: "var(--color-surface)", borderRadius: "999px", overflow: "hidden", border: "1px solid var(--color-border)", marginBottom: "12px" }}>
            <div
              style={{
                height: "100%",
                width: `${project.completionPercentage || (project.status === "Approved" ? 10 : 5)}%`,
                background: "linear-gradient(90deg, #635BFF 0%, #2563EB 50%, #10B981 100%)",
                borderRadius: "999px",
                transition: "width 0.8s ease"
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "6px", textAlign: "center", fontSize: "11px" }}>
            {PROGRESS_STAGES.map((stg, i) => {
              const isDone = (project.completionPercentage >= 100 && i <= 4) ||
                (isDelivered && i === 5) ||
                (isReadyForDelivery && i <= 4) ||
                (isAdvanceVerified && i <= 1) ||
                (project.status === "Approved" && i === 0);
              return (
                <div key={stg} style={{ padding: "4px", color: isDone ? "var(--color-primary)" : "var(--color-text-tertiary)", fontWeight: isDone ? 700 : 500 }}>
                  <div style={{ fontSize: "13px", marginBottom: "2px" }}>{isDone ? "✓" : i + 1}</div>
                  {stg}
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* FINANCIAL LEDGER & BREAKDOWN                             */}
        {/* ======================================================== */}
        <div style={{ marginBottom: "24px" }}>
          <div className="flex-between" style={{ marginBottom: "10px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-text)", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              <DollarSign size={18} color="var(--color-primary)" /> Pricing Breakdown & Transparent Ledger
            </h3>
            <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
              Formula Verified
            </span>
          </div>

          <div style={{
            background: "var(--color-surface-hover)",
            border: "1px solid var(--color-border)",
            borderRadius: "14px",
            padding: "18px",
          }}>
            {/* 3 Component Parts Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px", paddingBottom: "14px", borderBottom: "1px dashed var(--color-border)" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                  Hardware Components
                </span>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-text)", marginTop: "2px" }}>
                  ₹{compCost.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                  {project.hasComponents === "yes" ? "Client Provided (₹0)" : "Sourced by Projifyra"}
                </div>
              </div>

              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                  Development & Making Cost
                </span>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-text)", marginTop: "2px" }}>
                  ₹{makeCost.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                  Engineering & coding
                </div>
              </div>

              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                  Add-on Deliverables
                </span>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-warning)", marginTop: "2px" }}>
                  ₹{addonCost.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                  PPT, Reports, Paper, Viva
                </div>
              </div>
            </div>

            {/* Total Formula Equation Banner */}
            <div className="flex-between" style={{ marginBottom: "14px", padding: "10px 14px", background: "var(--color-bg)", borderRadius: "10px", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text)" }}>
                Total Quoted Project Value (Comp + Dev + Add-ons):
              </span>
              <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--color-primary)" }}>
                ₹{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Already Paid vs Remaining Balance Equation */}
            <div style={{
              background: isFinalVerified ? "rgba(16, 185, 129, 0.1)" : isAdvanceVerified ? "rgba(99, 91, 255, 0.08)" : "var(--color-bg)",
              border: `1px solid ${isFinalVerified ? "#10B981" : isAdvanceVerified ? "rgba(99, 91, 255, 0.25)" : "var(--color-border)"}`,
              borderRadius: "12px",
              padding: "14px 16px",
              marginBottom: "16px"
            }}>
              <div className="flex-between" style={{ marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
                <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                  Initial 30% Advance Requirement:
                </span>
                <span style={{ fontSize: "14px", fontWeight: 800 }}>
                  ₹{advanceAmount.toLocaleString("en-IN")}
                  <span className={`badge ${isAdvanceVerified ? "badge-success" : isAdvanceSubmitted ? "badge-warning" : "badge-error"}`} style={{ marginLeft: "8px", fontSize: "10px" }}>
                    {isAdvanceVerified ? "✓ 30% Paid" : isAdvanceSubmitted ? "Verifying..." : "Pending"}
                  </span>
                </span>
              </div>

              {isAdvanceVerified ? (
                <div>
                  <div style={{ fontSize: "13px", color: "var(--color-success)", fontWeight: 700, marginTop: "6px" }}>
                    ✓ You have already paid ₹{advanceAmount.toLocaleString("en-IN")}.
                  </div>
                  <div className="flex-between" style={{ marginTop: "6px", paddingTop: "8px", borderTop: "1px dashed var(--color-border)" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text)" }}>
                      Remaining Balance to Pay (70%):
                    </span>
                    <span style={{ fontSize: "1.2rem", fontWeight: 900, color: isFinalVerified ? "var(--color-success)" : "var(--color-text)" }}>
                      {isFinalVerified ? "₹0 (Fully Cleared)" : `₹${balanceAmount.toLocaleString("en-IN")}`}
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                    Calculation: Total (₹{totalAmount}) − Paid Advance (₹{advanceAmount}) = Remaining (₹{isFinalVerified ? 0 : balanceAmount})
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                  Work begins immediately upon confirming the 30% initial advance of <strong>₹{advanceAmount.toLocaleString("en-IN")}</strong>.
                </div>
              )}
            </div>

            {/* Flexible Payment Action Buttons (Amazon / Meesho Style) */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {!isAdvanceVerified && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onClose();
                    if (onOpenPayment) onOpenPayment("advance", project);
                  }}
                  style={{ flex: 1, minWidth: "200px", justifyContent: "center" }}
                >
                  <UploadCloud size={16} /> Pay 30% Advance (₹{advanceAmount})
                </button>
              )}

              {isAdvanceVerified && !isFinalVerified && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onClose();
                    if (onOpenPayment) onOpenPayment("final", project);
                  }}
                  style={{ flex: 1, minWidth: "200px", justifyContent: "center" }}
                >
                  <UploadCloud size={16} /> Pay Remaining Balance (₹{balanceAmount})
                </button>
              )}

              {/* Flexible Full Payment Button (Always allowed in-between) */}
              {!isFinalVerified && (
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    onClose();
                    if (onOpenPayment) onOpenPayment("full", project);
                  }}
                  style={{ flex: 1, minWidth: "200px", justifyContent: "center" }}
                >
                  Pay Full Amount Anytime (₹{totalAmount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 100% MONEY-BACK GUARANTEE & ASSURANCE CARD              */}
        {/* ======================================================== */}
        <div style={{
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(99, 91, 255, 0.06) 100%)",
          border: "1.5px solid rgba(16, 185, 129, 0.35)",
          borderRadius: "16px",
          padding: "18px 20px",
          marginBottom: "22px"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(16, 185, 129, 0.18)", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--color-text)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>PROJIFYRA 100% Delivery Assurance & Money-Back Guarantee</span>
              </div>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.6", marginTop: "6px", margin: "6px 0 10px" }}>
                If our engineering team is unable to complete or deliver your project for any unforeseen technical reason, your 30% advance will be <strong>100% refunded immediately</strong> or your next project will be developed <strong>completely FREE of charge</strong>. We guarantee your academic and engineering success.
              </p>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--color-text)", fontWeight: 600, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  style={{ accentColor: "var(--color-primary)" }}
                />
                <span>I acknowledge the project scope, pricing transparency, and 100% money-back completion guarantee.</span>
              </label>
            </div>
          </div>
        </div>

        {/* Specifications & Assigned Officer */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "20px", fontSize: "13px" }}>
          <div style={{ padding: "12px", background: "var(--color-bg)", borderRadius: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
              Assigned Technical Officer
            </span>
            <div style={{ fontWeight: 700, marginTop: "2px", color: "var(--color-text)" }}>
              {project.assignedOfficerName || "PROJIFYRA Engineering Lead"}
            </div>
          </div>

          <div style={{ padding: "12px", background: "var(--color-bg)", borderRadius: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
              Target Turnaround Time
            </span>
            <div style={{ fontWeight: 700, marginTop: "2px", color: "var(--color-text)" }}>
              {project.deliverySpeed === "express" ? "⚡ 1-Day Express" : "2-3 Business Days"}
            </div>
          </div>

          <div style={{ padding: "12px", background: "var(--color-bg)", borderRadius: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
              Project Documentation
            </span>
            <div style={{ marginTop: "2px" }}>
              {project.documentUrl ? (
                <a
                  href={project.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--color-primary)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <FileText size={14} /> View Document (&le;5MB) <ExternalLink size={11} />
                </a>
              ) : (
                <span style={{ color: "var(--color-text-tertiary)" }}>None attached</span>
              )}
            </div>
          </div>
        </div>

        {/* Problem Statement & Requirements */}
        {project.shortDescription && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>
              Idea & Scope Description
            </div>
            <div style={{ fontSize: "13px", marginTop: "4px", lineHeight: "1.6", color: "var(--color-text)" }}>
              {project.shortDescription}
            </div>
          </div>
        )}

        {project.adminFeasibilityNotes && (
          <div style={{
            padding: "12px 14px",
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "10px",
            marginBottom: "16px"
          }}>
            <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#10B981" }}>
              Admin Feasibility Verdict & Scope Guidelines
            </div>
            <div style={{ fontSize: "13px", marginTop: "4px", lineHeight: "1.5", color: "var(--color-text)", whiteSpace: "pre-wrap" }}>
              {project.adminFeasibilityNotes}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--color-border)", paddingTop: "16px", marginTop: "16px" }}>
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          {isDelivered && (
            <button
              className="btn btn-primary"
              onClick={() => {
                onClose();
                if (onWriteReview) onWriteReview(project);
              }}
            >
              <Star size={16} fill="currentColor" /> Share Feedback & Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
