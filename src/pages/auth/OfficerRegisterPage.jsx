import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2,
  ShieldCheck, Wrench, Cpu, Sparkles, Building2
} from "lucide-react";
import { registerOfficer, friendlyAuthError } from "../../services/authService";
import "../../styles/auth.css";

const DEPARTMENTS = [
  "CSE", "ECE", "EEE", "Mechanical", "Civil", "IT", "AIDS", "AIML", "Cyber Security",
  "Biomedical", "Chemical", "Aerospace", "Other",
];

const SPECIALIZATIONS = [
  "Hardware & Circuit Design",
  "Embedded Systems & Microcontrollers (ESP32/Arduino)",
  "IoT & Smart Sensor Networks",
  "Full Stack Web & Mobile Development",
  "AI / ML & Computer Vision",
  "PCB Design & Fabrication",
  "Academic Documentation & IEEE Papers",
];

export default function OfficerRegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    department: "",
    specialization: "",
    college: "M. Kumarasamy College of Engineering, Karur",
    experienceNotes: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((err) => ({ ...err, [name]: "" }));
    if (globalError) setGlobalError("");
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    if (!form.email.trim()) e.email = "Officer email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Please enter a valid email address.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    else if (!/^\d{10}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "Please enter a valid 10-digit phone number.";
    if (!form.department) e.department = "Please select your department.";
    if (!form.specialization) e.specialization = "Please select your technical specialization.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";

    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }

    setLoading(true);
    setGlobalError("");

    try {
      await registerOfficer({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        department: form.department,
        specialization: form.specialization,
        college: form.college.trim(),
        experienceNotes: form.experienceNotes.trim(),
        password: form.password,
      });

      setSuccess(true);
    } catch (err) {
      setGlobalError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-right" style={{ justifyContent: "center", width: "100%", maxWidth: "580px", margin: "0 auto", padding: "var(--space-6)" }}>
          <div className="auth-form-card text-center animate-fade-up" style={{ padding: "var(--space-8)" }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: "50%",
                background: "rgba(124, 58, 237, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto var(--space-5)",
                color: "#7C3AED",
              }}
            >
              <ShieldCheck size={42} />
            </div>

            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", marginBottom: "var(--space-3)", color: "var(--color-text)" }}>
              Officer Application Submitted!
            </h1>

            <p style={{ color: "var(--color-text-secondary)", fontSize: "15px", lineHeight: "1.6", marginBottom: "var(--space-6)" }}>
              Thank you for applying, <strong>{form.fullName}</strong>. Your application has been directly dispatched to the <strong>Master Super Admin Desk</strong> for review.
            </p>

            <div
              style={{
                background: "var(--color-surface-hover)",
                border: "1px solid var(--color-border)",
                borderRadius: "14px",
                padding: "16px",
                marginBottom: "var(--space-6)",
                textAlign: "left",
                fontSize: "13px",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "6px", color: "var(--color-text)" }}>What Happens Next?</div>
              <ul style={{ paddingLeft: "18px", margin: 0, color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li>The Super Admin will review your technical specialization in <strong>{form.specialization}</strong>.</li>
                <li>Upon Admin approval, your account will be activated with Officer privileges.</li>
                <li>You will then be able to log in to the Officer Dashboard to view student ideas, submit cost proposals, and build projects.</li>
              </ul>
            </div>

            <Link to="/login" className="btn btn-primary btn-full btn-lg" style={{ height: "50px", fontSize: "16px" }}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      {/* Left Panel */}
      <div className="auth-left" aria-hidden="true" style={{ position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "var(--space-2)" }}>
          <img src="/logo.png" alt="PROJIFYRA" style={{ width: "42px", height: "42px", objectFit: "contain", filter: "drop-shadow(0 2px 10px rgba(99,91,255,0.4))" }} />
          <div>
            <div className="auth-brand-name" style={{ marginBottom: 0 }}>PROJIFYRA</div>
            <div className="auth-brand-tagline">Technical Officer Application</div>
          </div>
        </div>

        <h2 className="auth-left-heading" style={{ fontSize: "2rem", marginTop: "var(--space-4)" }}>
          Join the Engineering Technical Team
        </h2>

        <p className="auth-left-desc" style={{ fontSize: "15px", lineHeight: "1.6" }}>
          Become an official PROJIFYRA project officer. Review student problem statements, submit feasibility estimates, and lead hardware and software builds.
        </p>

        <div className="auth-features" style={{ marginTop: "var(--space-8)" }}>
          <div className="auth-feature">
            <div className="auth-feature-dot" style={{ background: "#7C3AED" }} />
            Browse all client project submissions in real-time
          </div>
          <div className="auth-feature">
            <div className="auth-feature-dot" style={{ background: "#7C3AED" }} />
            Submit component & making cost proposals to the Admin Desk
          </div>
          <div className="auth-feature">
            <div className="auth-feature-dot" style={{ background: "#7C3AED" }} />
            Lead assigned hardware & software projects
          </div>
          <div className="auth-feature">
            <div className="auth-feature-dot" style={{ background: "#7C3AED" }} />
            Super Admin approval required for verified platform access
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right" style={{ alignItems: "flex-start", paddingTop: "var(--space-8)", paddingBottom: "var(--space-12)" }}>
        <div className="auth-form-card animate-fade-up" style={{ maxWidth: "600px" }}>
          <div className="auth-form-header">
            <Link to="/login" className="auth-form-back">
              <ArrowLeft size={16} />
              Back to Login
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span className="badge badge-primary" style={{ background: "rgba(124, 58, 237, 0.12)", color: "#7C3AED", borderColor: "rgba(124, 58, 237, 0.2)" }}>
                Officer Registration
              </span>
            </div>
            <h1 className="auth-form-title" style={{ fontSize: "1.85rem", fontWeight: "800" }}>
              Apply as Technical Officer
            </h1>
            <p className="auth-form-subtitle">
              Submit your credentials to the Admin Desk for official authorization
            </p>
          </div>

          {globalError && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: "var(--space-6)" }}>
              <AlertCircle size={18} aria-hidden="true" />
              {globalError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="off-fullName">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  id="off-fullName"
                  name="fullName"
                  type="text"
                  className={`form-control${errors.fullName ? " error" : ""}`}
                  placeholder="Your full name"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
                {errors.fullName && <span className="form-error" style={{ color: "var(--color-error)", fontSize: "12px", marginTop: "4px" }}>{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="off-phone">
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  id="off-phone"
                  name="phone"
                  type="tel"
                  className={`form-control${errors.phone ? " error" : ""}`}
                  placeholder="10-digit number"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
                {errors.phone && <span className="form-error" style={{ color: "var(--color-error)", fontSize: "12px", marginTop: "4px" }}>{errors.phone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="off-email">
                Officer Email Address <span className="required">*</span>
              </label>
              <input
                id="off-email"
                name="email"
                type="email"
                className={`form-control${errors.email ? " error" : ""}`}
                placeholder="officer@email.com"
                value={form.email}
                onChange={handleChange}
                required
              />
              {errors.email && <span className="form-error" style={{ color: "var(--color-error)", fontSize: "12px", marginTop: "4px" }}>{errors.email}</span>}
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="off-department">
                  Department <span className="required">*</span>
                </label>
                <select
                  id="off-department"
                  name="department"
                  className={`form-control${errors.department ? " error" : ""}`}
                  value={form.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {errors.department && <span className="form-error" style={{ color: "var(--color-error)", fontSize: "12px", marginTop: "4px" }}>{errors.department}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="off-college">
                  College / Institution
                </label>
                <input
                  id="off-college"
                  name="college"
                  type="text"
                  className="form-control"
                  value={form.college}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="off-specialization">
                Primary Technical Specialization <span className="required">*</span>
              </label>
              <select
                id="off-specialization"
                name="specialization"
                className={`form-control${errors.specialization ? " error" : ""}`}
                value={form.specialization}
                onChange={handleChange}
                required
              >
                <option value="">Select Specialization</option>
                {SPECIALIZATIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.specialization && <span className="form-error" style={{ color: "var(--color-error)", fontSize: "12px", marginTop: "4px" }}>{errors.specialization}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="off-notes">
                Experience / Key Projects Handled <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>(Optional)</span>
              </label>
              <textarea
                id="off-notes"
                name="experienceNotes"
                className="form-control"
                rows={2}
                placeholder="Mention past hardware prototypes, coding languages, or academic projects..."
                value={form.experienceNotes}
                onChange={handleChange}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="off-password">
                  Password <span className="required">*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="off-password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    className={`form-control${errors.password ? " error" : ""}`}
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    required
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--color-text-secondary)",
                      cursor: "pointer",
                      display: "flex",
                      padding: "4px",
                    }}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="form-error" style={{ color: "var(--color-error)", fontSize: "12px", marginTop: "4px" }}>{errors.password}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="off-confirmPassword">
                  Confirm Password <span className="required">*</span>
                </label>
                <input
                  id="off-confirmPassword"
                  name="confirmPassword"
                  type={showPw ? "text" : "password"}
                  className={`form-control${errors.confirmPassword ? " error" : ""}`}
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {errors.confirmPassword && <span className="form-error" style={{ color: "var(--color-error)", fontSize: "12px", marginTop: "4px" }}>{errors.confirmPassword}</span>}
              </div>
            </div>

            <div style={{ padding: "12px 14px", background: "var(--color-bg)", borderRadius: "12px", fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
              <strong>Admin Gatekeeper Notice:</strong> All officer accounts require one-time approval by the Super Admin before login permissions are granted.
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ height: "50px", fontSize: "16px", fontWeight: 700, marginTop: "var(--space-2)" }}
            >
              {loading ? "Submitting Application to Admin..." : "Submit Officer Application"}
            </button>
          </form>

          <div className="auth-switch" style={{ marginTop: "var(--space-6)" }}>
            Looking to submit a project idea instead? <Link to="/register">Register as Student Client</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
