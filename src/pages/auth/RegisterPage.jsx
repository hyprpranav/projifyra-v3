import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2,
  UploadCloud, FileText, Zap, Cpu, Sparkles, X, ShieldAlert,
  CircuitBoard, Radio, Layers, Code2, BookOpen
} from "lucide-react";
import { registerClient, friendlyAuthError } from "../../services/authService";
import { submitProjectRequest } from "../../services/orderService";
import { uploadToCloudinary } from "../../services/cloudinaryService";
import "../../styles/auth.css";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // Strict 5MB limit

const DEPARTMENTS = [
  "CSE", "ECE", "EEE", "Mechanical", "Civil", "IT", "AIDS", "AIML", "Cyber Security",
  "Biomedical", "Chemical", "Aerospace", "Other",
];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const AVAILABLE_SERVICES = [
  {
    id: "hardware",
    name: "Hardware Prototype & Assembly",
    badge: "Core Engineering",
    desc: "Physical build, microcontrollers (ESP32 / Arduino / STM32 / RPi), sensor interfacing, circuit wiring & live testing.",
    priceTag: "Feasibility Quoted",
    isAddon: false,
    price: 0,
    icon: <Cpu size={18} />,
  },
  {
    id: "pcb",
    name: "PCB Design & Schematic Layout",
    badge: "EDA Design",
    desc: "Schematic capture, multi-layer routing, design rule checks, Gerber & drill generation in professional EDA tools.",
    priceTag: "Feasibility Quoted",
    isAddon: false,
    price: 0,
    icon: <CircuitBoard size={18} />,
    hasToolSelector: true,
    tools: ["Altium Designer", "Cadence Allegro / OrCAD", "KiCad", "EasyEDA", "Other / Any"],
  },
  {
    id: "simulation",
    name: "Engineering Simulation & Analysis",
    badge: "CAE Simulation",
    desc: "High-frequency electromagnetic, RF, antenna, multiphysics, thermal, or circuit simulation with complete plots & result data.",
    priceTag: "Feasibility Quoted",
    isAddon: false,
    price: 0,
    icon: <Radio size={18} />,
    hasToolSelector: true,
    tools: ["ANSYS HFSS", "COMSOL Multiphysics", "MATLAB & Simulink", "Keysight ADS", "Proteus", "CST Studio", "Other / Any"],
  },
  {
    id: "firmware",
    name: "Embedded Firmware & IoT Cloud Dashboard",
    badge: "Firmware / IoT",
    desc: "Clean C/C++/Python code, cloud telemetry, MQTT/HTTP dashboards, and sensor calibration.",
    priceTag: "Feasibility Quoted",
    isAddon: false,
    price: 0,
    icon: <Layers size={18} />,
  },
  {
    id: "software",
    name: "Full-Stack Web App / Mobile App / AI-ML",
    badge: "Software",
    desc: "React/Node.js web portals, Flutter/Android apps, or machine learning model training & inference.",
    priceTag: "Feasibility Quoted",
    isAddon: false,
    price: 0,
    icon: <Code2 size={18} />,
  },
  {
    id: "ppt",
    name: "PPT Presentation Deck",
    badge: "Academic Add-on",
    desc: "Tailored slide deck designed specifically for your project reviews, viva examination, and panel demonstrations.",
    priceTag: "₹149",
    isAddon: true,
    price: 149,
    icon: <BookOpen size={18} />,
  },
  {
    id: "document",
    name: "Project Report & Documentation",
    badge: "Academic Add-on",
    desc: "Comprehensive documentation covering literature survey, block diagrams, circuit schematics, algorithm & output analysis.",
    priceTag: "₹249",
    isAddon: true,
    price: 249,
    icon: <FileText size={18} />,
  },
  {
    id: "paper",
    name: "Conference / Research Paper Drafting",
    badge: "Academic Add-on",
    desc: "Publication-ready research paper draft tailored to IEEE / Springer conference template with plagiarism-conscious writing.",
    priceTag: "₹999",
    isAddon: true,
    price: 999,
    icon: <Sparkles size={18} />,
  },
  {
    id: "mentoring",
    name: "1-on-1 Mentoring & Project Consultation",
    badge: "Consultation",
    desc: "Direct virtual consultation session with lead engineers for viva Q&A coaching, code walkthrough, and technical doubt clearance.",
    priceTag: "₹99",
    isAddon: true,
    price: 99,
    icon: <CheckCircle2 size={18} />,
  },
];

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <span className="form-error" role="alert" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--color-error)", marginTop: "4px" }}>
      <AlertCircle size={13} aria-hidden="true" /> {msg}
    </span>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();

  // Registration & Idea Form State
  const [form, setForm] = useState({
    // Client identity
    fullName: "",
    teamName: "",
    registerNumber: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    college: "",
    department: "",
    year: "",

    // Project Idea Details
    projectTitle: "",
    shortDescription: "",
    requirements: "",
    hasComponents: "no", // "yes" (Client has) | "no" (Projifyra buys)
    deliverySpeed: "normal", // "normal" (2-3 days) | "express" (1 day)
  });

  // Project Deliverables & Specialized Services Multi-Select
  const [selectedServices, setSelectedServices] = useState(["hardware", "pcb"]);
  const [pcbTool, setPcbTool] = useState("Altium Designer");
  const [simulationTool, setSimulationTool] = useState("ANSYS HFSS");

  const toggleService = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const calculateAddonTotal = () => {
    return selectedServices.reduce((total, id) => {
      const s = AVAILABLE_SERVICES.find((item) => item.id === id);
      return total + (s?.isAddon ? s.price : 0);
    }, 0);
  };

  // Document Upload State
  const [docFile, setDocFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(false);

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

  // Handle file selection with STRICT 5MB limit validation
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(
        `File is ${(file.size / (1024 * 1024)).toFixed(2)} MB. Maximum allowed file size is strictly 5 MB. Please choose a smaller file.`
      );
      setDocFile(null);
      e.target.value = "";
      return;
    }

    setFileError("");
    setDocFile(file);
  };

  const removeFile = () => {
    setDocFile(null);
    setFileError("");
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    if (!form.registerNumber.trim()) e.registerNumber = "Register number is mandatory.";
    if (!form.phone.trim()) e.phone = "Phone number is required for contact.";
    else if (!/^\d{10}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "Please enter a valid 10-digit phone number.";
    if (!form.email.trim()) e.email = "Email address is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Please enter a valid email address.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";

    // Idea details
    if (!form.projectTitle.trim()) e.projectTitle = "Project / Idea title is required.";
    if (!form.shortDescription.trim()) e.shortDescription = "Please provide a short description / problem statement.";
    if (!form.requirements.trim()) e.requirements = "Please specify components, technologies, or tools you need.";
    if (selectedServices.length === 0) e.services = "Please select at least one engineering deliverable or service.";

    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length > 0) {
      setErrors(v);
      const firstErrorKey = Object.keys(v)[0];
      const el = document.getElementById(`reg-${firstErrorKey}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);
    setGlobalError("");
    setUploadProgress(true);

    try {
      // 1. Upload Document to Cloudinary if provided (< 5MB verified)
      let documentUrl = "";
      let documentName = "";
      let documentSize = 0;

      if (docFile) {
        const uploadRes = await uploadToCloudinary(docFile, "projifyra/documents");
        documentUrl = uploadRes.url;
        documentName = docFile.name;
        documentSize = docFile.size;
      }

      // 2. Register client in Firebase Auth & Firestore
      const { user } = await registerClient({
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        teamName: form.teamName.trim(),
        phone: form.phone.trim(),
        registerNumber: form.registerNumber.trim(),
        college: form.college.trim(),
        department: form.department,
        year: form.year,
      });

      // 3. Submit Project Idea immediately linked to the new client UID
      await submitProjectRequest(user.uid, {
        fullName: form.fullName.trim(),
        teamName: form.teamName.trim(),
        registerNumber: form.registerNumber.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        college: form.college.trim(),
        department: form.department,
        year: form.year,
        projectTitle: form.projectTitle.trim(),
        shortDescription: form.shortDescription.trim(),
        requirements: form.requirements.trim(),
        hasComponents: form.hasComponents,
        deliverySpeed: form.deliverySpeed,
        selectedServices,
        pcbTool: selectedServices.includes("pcb") ? pcbTool : "",
        simulationTool: selectedServices.includes("simulation") ? simulationTool : "",
        addonsRequested: selectedServices.filter((s) => ["ppt", "document", "paper", "mentoring"].includes(s)),
        addonTotal: calculateAddonTotal(),
        documentUrl,
        documentName,
        documentSize,
      });

      setSuccess(true);
    } catch (err) {
      setGlobalError(friendlyAuthError(err));
    } finally {
      setLoading(false);
      setUploadProgress(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-right" style={{ justifyContent: "center", width: "100%", maxWidth: "600px", margin: "0 auto", padding: "var(--space-6)" }}>
          <div className="auth-form-card text-center animate-fade-up" style={{ padding: "var(--space-8)" }}>
            <div style={{
              width: 76, height: 76, borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.12)", display: "flex",
              alignItems: "center", justifyContent: "center",
              margin: "0 auto var(--space-5)",
              color: "#10B981"
            }}>
              <CheckCircle2 size={42} />
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", marginBottom: "var(--space-3)", color: "var(--color-text)" }}>
              Idea Submitted Successfully!
            </h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "15px", lineHeight: "1.6", marginBottom: "var(--space-6)" }}>
              Welcome to PROJIFYRA, <strong>{form.fullName}</strong>. Your account has been created and your project idea <strong>"{form.projectTitle}"</strong> is now securely placed on the <strong>Admin & Officer Desk</strong>.
            </p>
            
            <div style={{
              background: "var(--color-surface-hover)",
              border: "1px solid var(--color-border)",
              borderRadius: "14px",
              padding: "16px",
              marginBottom: "var(--space-6)",
              textAlign: "left",
              fontSize: "13px"
            }}>
              <div style={{ fontWeight: 700, marginBottom: "6px", color: "var(--color-text)" }}>Next Steps:</div>
              <ul style={{ paddingLeft: "18px", margin: 0, color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li>Our technical officers will review your components and problem statement.</li>
                <li>The Admin Desk will finalize project pricing, delivery dates, and assigned officer.</li>
                <li>Once approved, your dashboard will display live progress percentage and initial 30% advance payment details.</li>
              </ul>
            </div>

            <Link to="/dashboard" className="btn btn-primary btn-full btn-lg" style={{ height: "50px", fontSize: "16px" }}>
              Enter Client Dashboard
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
            <div className="auth-brand-tagline">Projects · Guidance · Delivery</div>
          </div>
        </div>
        <h2 className="auth-left-heading" style={{ fontSize: "2rem", marginTop: "var(--space-4)" }}>
          Submit Your Idea & Start Building
        </h2>
        <p className="auth-left-desc" style={{ fontSize: "15px", lineHeight: "1.6" }}>
          Share your project requirements, circuit abstract, or documentation. Our engineering team and admin desk review and convert your concept into a real working build.
        </p>

        <div className="auth-features" style={{ marginTop: "var(--space-8)" }}>
          <div className="auth-feature">
            <div className="auth-feature-dot" />
            Direct submission to Admin & Officer review pool
          </div>
          <div className="auth-feature">
            <div className="auth-feature-dot" />
            2-3 days fast turnaround if you provide components
          </div>
          <div className="auth-feature">
            <div className="auth-feature-dot" />
            ⚡ 1-Day Express Delivery available for urgent deadlines
          </div>
          <div className="auth-feature">
            <div className="auth-feature-dot" />
            Secure Cloud storage for PPTs, Abstracts & Diagrams (&le; 5MB)
          </div>
          <div className="auth-feature">
            <div className="auth-feature-dot" />
            Live completion percentage tracking once approved
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right" style={{ alignItems: "flex-start", paddingTop: "var(--space-8)", paddingBottom: "var(--space-12)" }}>
        <div className="auth-form-card animate-fade-up" style={{ maxWidth: "680px" }}>
          <div className="auth-form-header">
            <Link to="/" className="auth-form-back">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
            <h1 className="auth-form-title" style={{ fontSize: "1.85rem", fontWeight: "800" }}>
              Register & Submit Your Idea
            </h1>
            <p className="auth-form-subtitle">
              Fill in your contact details and project requirements below
            </p>
          </div>

          {globalError && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: "var(--space-6)" }}>
              <AlertCircle size={18} aria-hidden="true" />
              {globalError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            
            {/* ========================================== */}
            {/* SECTION 1: CLIENT & TEAM REGISTRATION      */}
            {/* ========================================== */}
            <div style={{ marginBottom: "var(--space-6)", paddingBottom: "var(--space-4)", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-primary-light)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px" }}>1</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>Client & Contact Details</h3>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-fullName">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    id="reg-fullName"
                    name="fullName"
                    type="text"
                    className={`form-control${errors.fullName ? " error" : ""}`}
                    placeholder="Enter your full name"
                    value={form.fullName}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                  />
                  <FieldError msg={errors.fullName} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-teamName">
                    Team Name <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <input
                    id="reg-teamName"
                    name="teamName"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Innovators Group / Solo"
                    value={form.teamName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-registerNumber">
                    Register Number <span className="required">*</span>
                  </label>
                  <input
                    id="reg-registerNumber"
                    name="registerNumber"
                    type="text"
                    className={`form-control${errors.registerNumber ? " error" : ""}`}
                    placeholder="e.g. 927621104001"
                    value={form.registerNumber}
                    onChange={handleChange}
                    required
                  />
                  <FieldError msg={errors.registerNumber} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-phone">
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    id="reg-phone"
                    name="phone"
                    type="tel"
                    className={`form-control${errors.phone ? " error" : ""}`}
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                    required
                  />
                  <FieldError msg={errors.phone} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  className={`form-control${errors.email ? " error" : ""}`}
                  placeholder="Primary email for project updates"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
                <FieldError msg={errors.email} />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-department">Department</label>
                  <select
                    id="reg-department"
                    name="department"
                    className="form-control"
                    value={form.department}
                    onChange={handleChange}
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-year">Academic Year</label>
                  <select
                    id="reg-year"
                    name="year"
                    className="form-control"
                    value={form.year}
                    onChange={handleChange}
                  >
                    <option value="">Select Year</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-password">
                    Password <span className="required">*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="reg-password"
                      name="password"
                      type={showPw ? "text" : "password"}
                      className={`form-control${errors.password ? " error" : ""}`}
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      required
                      style={{ paddingRight: "2.5rem" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      style={{
                        position: "absolute", right: "0.75rem", top: "50%",
                        transform: "translateY(-50%)", background: "none",
                        border: "none", color: "var(--color-text-secondary)", cursor: "pointer", display: "flex", padding: "4px",
                      }}
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <FieldError msg={errors.password} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-confirmPassword">
                    Confirm Password <span className="required">*</span>
                  </label>
                  <input
                    id="reg-confirmPassword"
                    name="confirmPassword"
                    type={showPw ? "text" : "password"}
                    className={`form-control${errors.confirmPassword ? " error" : ""}`}
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                  <FieldError msg={errors.confirmPassword} />
                </div>
              </div>
            </div>

            {/* ========================================== */}
            {/* SECTION 2: PROJECT IDEA & REQUIREMENTS     */}
            {/* ========================================== */}
            <div style={{ marginBottom: "var(--space-6)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-primary-light)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px" }}>2</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>Project Idea & Requirements</h3>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-projectTitle">
                  Project / Idea Title <span className="required">*</span>
                </label>
                <input
                  id="reg-projectTitle"
                  name="projectTitle"
                  type="text"
                  className={`form-control${errors.projectTitle ? " error" : ""}`}
                  placeholder="e.g. IoT Smart EV Battery Management System"
                  value={form.projectTitle}
                  onChange={handleChange}
                  required
                />
                <FieldError msg={errors.projectTitle} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-shortDescription">
                  Short Description / Problem Statement <span className="required">*</span>
                </label>
                <textarea
                  id="reg-shortDescription"
                  name="shortDescription"
                  className={`form-control${errors.shortDescription ? " error" : ""}`}
                  placeholder="Briefly explain the problem you are solving, core objectives, and expected output..."
                  value={form.shortDescription}
                  onChange={handleChange}
                  rows={3}
                  required
                />
                <FieldError msg={errors.shortDescription} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-requirements">
                  Required Components & Technologies <span className="required">*</span>
                </label>
                <textarea
                  id="reg-requirements"
                  name="requirements"
                  className={`form-control${errors.requirements ? " error" : ""}`}
                  placeholder="List hardware, sensors, microcontrollers (ESP32/Arduino), software tech stack, libraries..."
                  value={form.requirements}
                  onChange={handleChange}
                  rows={3}
                  required
                />
                <FieldError msg={errors.requirements} />
              </div>

              {/* Deliverables & Engineering Services Multi-Select */}
              <div className="form-group" style={{ marginBottom: "var(--space-6)" }} id="reg-services">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--space-2)" }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Select Deliverables & Engineering Services <span className="required">*</span>
                  </label>
                  <span style={{ fontSize: "11px", color: "var(--color-primary)", fontWeight: 700 }}>
                    Select all that apply
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)" }}>
                  Choose whether you need a physical hardware build, custom PCB design layout, CAE simulation, software, or academic documentation.
                </p>

                {errors.services && (
                  <div className="alert alert-error" style={{ marginBottom: "var(--space-3)", padding: "8px 12px", fontSize: "12px" }}>
                    <AlertCircle size={14} />
                    <span>{errors.services}</span>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                  {AVAILABLE_SERVICES.map((s) => {
                    const isChecked = selectedServices.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => toggleService(s.id)}
                        style={{
                          border: `2px solid ${isChecked ? "var(--color-primary)" : "var(--color-border)"}`,
                          background: isChecked ? "var(--color-primary-light)" : "var(--color-surface)",
                          borderRadius: "14px",
                          padding: "14px 16px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // Controlled by parent container click
                              style={{ width: "18px", height: "18px", marginTop: "2px", accentColor: "var(--color-primary)", cursor: "pointer" }}
                            />
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                <span style={{ color: "var(--color-primary)", display: "flex", alignItems: "center" }}>
                                  {s.icon}
                                </span>
                                <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-text)" }}>
                                  {s.name}
                                </span>
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: "10px",
                                    padding: "2px 6px",
                                    background: s.isAddon ? "rgba(245, 158, 11, 0.15)" : "rgba(99, 91, 255, 0.12)",
                                    color: s.isAddon ? "#D97706" : "var(--color-primary)",
                                    fontWeight: 700,
                                  }}
                                >
                                  {s.badge}
                                </span>
                              </div>
                              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "4px", marginBottom: 0, lineHeight: 1.4 }}>
                                {s.desc}
                              </p>
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 800,
                                color: s.isAddon ? "var(--color-primary)" : "var(--color-text-secondary)",
                                background: "var(--color-surface-hover)",
                                padding: "4px 8px",
                                borderRadius: "8px",
                                border: "1px solid var(--color-border)",
                              }}
                            >
                              {s.priceTag}
                            </span>
                          </div>
                        </div>

                        {/* Tool Selector Dropdown for PCB Design */}
                        {isChecked && s.id === "pcb" && (
                          <div
                            style={{
                              marginTop: "12px",
                              paddingTop: "10px",
                              borderTop: "1px dashed rgba(99, 91, 255, 0.25)",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              flexWrap: "wrap",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-primary)" }}>
                              Target PCB Tool:
                            </label>
                            <select
                              className="form-control"
                              style={{ width: "auto", minWidth: "220px", height: "34px", fontSize: "12px", padding: "0 10px" }}
                              value={pcbTool}
                              onChange={(e) => setPcbTool(e.target.value)}
                            >
                              {s.tools.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                            <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                              (Schematic, layout & Gerber exports will be delivered in this tool)
                            </span>
                          </div>
                        )}

                        {/* Tool Selector Dropdown for Engineering Simulation */}
                        {isChecked && s.id === "simulation" && (
                          <div
                            style={{
                              marginTop: "12px",
                              paddingTop: "10px",
                              borderTop: "1px dashed rgba(99, 91, 255, 0.25)",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              flexWrap: "wrap",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-primary)" }}>
                              Simulation Suite:
                            </label>
                            <select
                              className="form-control"
                              style={{ width: "auto", minWidth: "220px", height: "34px", fontSize: "12px", padding: "0 10px" }}
                              value={simulationTool}
                              onChange={(e) => setSimulationTool(e.target.value)}
                            >
                              {s.tools.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                            <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                              (Simulation reports, 3D field plots & source files included)
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Selected Requirements & Pricing Summary Box */}
                <div
                  style={{
                    marginTop: "16px",
                    padding: "16px",
                    borderRadius: "14px",
                    background: "var(--color-surface-hover)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ fontWeight: 800, fontSize: "13px", color: "var(--color-text)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <CheckCircle2 size={16} color="var(--color-success)" />
                      Selected Scope Summary ({selectedServices.length} items)
                    </div>
                    {calculateAddonTotal() > 0 && (
                      <span style={{ fontWeight: 800, fontSize: "13px", color: "var(--color-primary)" }}>
                        Add-ons Total: ₹{calculateAddonTotal()}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                    {selectedServices.map((id) => {
                      const item = AVAILABLE_SERVICES.find((s) => s.id === id);
                      if (!item) return null;
                      let label = item.name;
                      if (id === "pcb") label = `PCB Design (${pcbTool})`;
                      if (id === "simulation") label = `Simulation (${simulationTool})`;
                      if (item.isAddon) label = `${item.name} (+₹${item.price})`;
                      return (
                        <span
                          key={id}
                          className="badge"
                          style={{
                            fontSize: "11px",
                            padding: "4px 8px",
                            background: item.isAddon ? "rgba(245, 158, 11, 0.15)" : "rgba(99, 91, 255, 0.15)",
                            color: item.isAddon ? "#D97706" : "var(--color-primary)",
                            fontWeight: 700,
                          }}
                        >
                          ✓ {label}
                        </span>
                      );
                    })}
                  </div>

                  <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", lineHeight: 1.5, borderTop: "1px dashed var(--color-border)", paddingTop: "8px" }}>
                    <strong>Feasibility & Price Proposal:</strong> Our technical team will review what can be done vs limitations, verify your hardware, PCB, and simulation requirements, and submit a transparent price breakdown to your dashboard.
                  </div>
                </div>
              </div>

              {/* Component Ownership Option */}
              <div className="form-group" style={{ marginBottom: "var(--space-4)" }}>
                <label className="form-label">
                  Component Ownership
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                  <label
                    style={{
                      border: `2px solid ${form.hasComponents === "yes" ? "var(--color-primary)" : "var(--color-border)"}`,
                      background: form.hasComponents === "yes" ? "var(--color-primary-light)" : "var(--color-surface)",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="radio"
                      name="hasComponents"
                      value="yes"
                      checked={form.hasComponents === "yes"}
                      onChange={handleChange}
                      style={{ marginTop: "3px" }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "13px" }}>I Have My Components</div>
                      <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                        Delivered within 2–3 days (or 1-day express). Only making/dev charges apply.
                      </div>
                    </div>
                  </label>

                  <label
                    style={{
                      border: `2px solid ${form.hasComponents === "no" ? "var(--color-primary)" : "var(--color-border)"}`,
                      background: form.hasComponents === "no" ? "var(--color-primary-light)" : "var(--color-surface)",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <input
                      type="radio"
                      name="hasComponents"
                      value="no"
                      checked={form.hasComponents === "no"}
                      onChange={handleChange}
                      style={{ marginTop: "3px" }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "13px" }}>PROJIFYRA Supplies Them</div>
                      <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                        Our team purchases all components & bills total cost in the proposal.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Delivery Speed Option */}
              <div className="form-group" style={{ marginBottom: "var(--space-5)" }}>
                <label className="form-label">
                  Delivery Speed Preference
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                  <label
                    style={{
                      border: `2px solid ${form.deliverySpeed === "normal" ? "var(--color-primary)" : "var(--color-border)"}`,
                      background: form.deliverySpeed === "normal" ? "var(--color-primary-light)" : "var(--color-surface)",
                      borderRadius: "12px",
                      padding: "10px 14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="radio"
                      name="deliverySpeed"
                      value="normal"
                      checked={form.deliverySpeed === "normal"}
                      onChange={handleChange}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>Normal Delivery (2–3 Days)</span>
                  </label>

                  <label
                    style={{
                      border: `2px solid ${form.deliverySpeed === "express" ? "var(--color-warning)" : "var(--color-border)"}`,
                      background: form.deliverySpeed === "express" ? "rgba(245, 158, 11, 0.1)" : "var(--color-surface)",
                      borderRadius: "12px",
                      padding: "10px 14px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="radio"
                      name="deliverySpeed"
                      value="express"
                      checked={form.deliverySpeed === "express"}
                      onChange={handleChange}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-warning)" }}>
                      ⚡ Express Delivery (1 Day)
                    </span>
                  </label>
                </div>
              </div>

              {/* Document Upload (PPT, Abstract, PDF, DOCX, Diagram Image) - Strictly <= 5MB */}
              <div className="form-group">
                <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Upload PPT / Abstract / Diagram / Document</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-primary)" }}>Max: 5 MB</span>
                </label>

                {fileError && (
                  <div className="alert alert-error" style={{ marginBottom: "var(--space-3)", padding: "8px 12px", fontSize: "12px" }}>
                    <ShieldAlert size={16} />
                    {fileError}
                  </div>
                )}

                {!docFile ? (
                  <label
                    style={{
                      border: "2px dashed var(--color-border)",
                      borderRadius: "14px",
                      padding: "24px 16px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      background: "var(--color-surface)",
                      transition: "all 0.2s ease",
                      textAlign: "center"
                    }}
                  >
                    <UploadCloud size={32} color="var(--color-primary)" style={{ marginBottom: "8px" }} />
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--color-text)" }}>
                      Click to upload document or diagram
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                      Supports PPT, PPTX, PDF, DOC, DOCX, PNG, JPG (Strictly up to 5MB)
                    </div>
                    <input
                      type="file"
                      accept=".ppt,.pptx,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </label>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      background: "var(--color-surface-hover)",
                      border: "1px solid var(--color-border)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <FileText size={24} color="var(--color-primary)" />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text)" }}>
                          {docFile.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                          {(docFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready for Cloudinary
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: "4px 8px", color: "var(--color-error)" }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              aria-busy={loading}
              style={{ height: "52px", fontSize: "16px", fontWeight: 700 }}
            >
              {loading ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  {uploadProgress ? "Uploading Document & Submitting Idea..." : "Creating Account..."}
                </>
              ) : (
                "Submit Project Idea & Create Account"
              )}
            </button>
          </form>

          <div className="auth-switch" style={{ marginTop: "var(--space-6)" }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
