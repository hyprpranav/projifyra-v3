import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Cpu, Globe, Zap, Layers, Brain, Wrench,
  CheckCircle2, Star, Mail, MapPin, GraduationCap,
  BookOpen, Code2, CircuitBoard, Wifi, FlaskConical, Radio, Activity
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { getPublicProjects } from "../services/projectService";
import { getApprovedReviews } from "../services/reviewService";
import { getPlatformStats } from "../services/adminService";
import { CONTACT_EMAIL, COLLEGE_NAME } from "../config/appConfig";
import ProjifyraLoader from "../components/common/ProjifyraLoader";
import "../styles/landing.css";

const HERO_DOMAINS = [
  "Hardware & IoT",
  "PCB Design (Altium / Cadence / KiCad)",
  "Engineering Simulation (ANSYS / COMSOL)",
  "Embedded Systems",
  "AI/ML & Software",
  "IEEE Papers & Documentation"
];

const SERVICES = [
  {
    icon: <Cpu size={26} />,
    title: "Hardware & IoT Systems",
    description: "Physical working builds, microcontrollers (ESP32, STM32, Arduino, Raspberry Pi), sensor networks, relays, and complete circuit assemblies.",
    color: "#635BFF",
    bg: "rgba(99,91,255,0.1)",
  },
  {
    icon: <CircuitBoard size={26} />,
    title: "PCB Design & Schematic Layout",
    description: "Multi-layer schematic capture and PCB layout in Altium Designer, Cadence Allegro / OrCAD, and KiCad with full Gerber, drill files & component BOM generation.",
    color: "#059669",
    bg: "rgba(5,150,105,0.1)",
  },
  {
    icon: <Radio size={26} />,
    title: "Engineering Simulations",
    description: "High-accuracy simulations in ANSYS HFSS, COMSOL Multiphysics, MATLAB / Simulink, and CST Studio for antenna, RF, EM, thermal, and circuit models.",
    color: "#2563EB",
    bg: "rgba(37,99,235,0.1)",
  },
  {
    icon: <Code2 size={26} />,
    title: "Software & AI / ML Projects",
    description: "Full-stack web applications, mobile apps, Python scripts, computer vision, machine learning models, and cloud database integrations.",
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.1)",
  },
  {
    icon: <BookOpen size={26} />,
    title: "PPT, Reports & IEEE Papers",
    description: "Comprehensive documentation support: professional review PPTs (₹149), full academic project reports (₹249), and conference paper drafting (₹999).",
    color: "#D97706",
    bg: "rgba(217,119,6,0.1)",
  },
  {
    icon: <GraduationCap size={26} />,
    title: "Viva Mentoring & Consultation",
    description: "1-on-1 personalized mentoring sessions (₹99), hands-on technical walkthroughs, viva Q&A coaching, and project explanation with engineers.",
    color: "#DC2626",
    bg: "rgba(220,38,38,0.1)",
  },
];

const HOW_STEPS = [
  { num: "01", title: "Submit Your Idea", desc: "Share your project concept, requirements and timeline through our simple form." },
  { num: "02", title: "We Review It", desc: "Our team reviews your request and confirms feasibility, pricing and timeline." },
  { num: "03", title: "Development Begins", desc: "Your project enters active development with regular progress updates." },
  { num: "04", title: "Delivered to You", desc: "Receive your completed project with documentation, code, and explanation." },
];

const WHY_ITEMS = [
  {
    icon: <CheckCircle2 size={22} />,
    title: "Practical Project Support",
    desc: "Real working projects built for actual academic requirements — not theoretical exercises.",
  },
  {
    icon: <Layers size={22} />,
    title: "Hardware & Software Expertise",
    desc: "From microcontrollers to full-stack web apps — comprehensive technical coverage across domains.",
  },
  {
    icon: <GraduationCap size={22} />,
    title: "Academic Documentation",
    desc: "Professional reports, PPT presentations, and viva preparation included with every project.",
  },
  {
    icon: <Zap size={22} />,
    title: "Fast Turnaround",
    desc: "We understand academic deadlines. Urgent projects are handled with priority processing.",
  },
];

const ABOUT_DOMAINS = [
  { icon: <Cpu size={16} />, label: "Hardware & IoT" },
  { icon: <CircuitBoard size={16} />, label: "PCB Design (Altium / KiCad)" },
  { icon: <Radio size={16} />, label: "Simulations (ANSYS / COMSOL)" },
  { icon: <Code2 size={16} />, label: "Software & Web Apps" },
  { icon: <Brain size={16} />, label: "AI / ML" },
  { icon: <Zap size={16} />, label: "Embedded Systems" },
  { icon: <FlaskConical size={16} />, label: "MATLAB & Simulink" },
  { icon: <BookOpen size={16} />, label: "IEEE Conference Papers" },
];

function StarRating({ rating }) {
  return (
    <div className="review-stars" aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={16} fill={s <= rating ? "currentColor" : "none"} />
      ))}
    </div>
  );
}

function ProjectStatusBadge({ status }) {
  const cls = {
    Available: "status-available",
    Limited: "status-limited",
    "Sold Out": "status-sold-out",
    "Coming Soon": "status-coming-soon",
  }[status] || "status-available";
  return <span className={`badge ${cls}`}>{status}</span>;
}

export default function LandingPage() {
  const [projects, setProjects] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ projectsCompleted: 0, clientsSupported: 0, projectsOngoing: 0, projectsReceived: 0 });
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    // Load public data
    getPublicProjects({ featured: true, limit: 6 })
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));

    getApprovedReviews().then(setReviews).catch(() => setReviews([]));
    getPlatformStats().then(setStats).catch(() => {});
  }, []);

  return (
    <>
      <Navbar />

      {/* ---- HERO ---- */}
      <section className="hero" id="home" aria-label="Hero section">
        <div className="hero-bg-grid" aria-hidden="true" />
        <div className="hero-bg-glow hero-bg-glow-1" aria-hidden="true" />
        <div className="hero-bg-glow hero-bg-glow-2" aria-hidden="true" />

        <div className="container hero-inner">
          {/* Content */}
          <div className="hero-content animate-fade-up">
            <div className="hero-badge" aria-label="Platform info">
              <div className="hero-badge-dot" aria-hidden="true" />
              Project Development Platform · PROJIFYRA 3.1
            </div>

            <h1 className="hero-heading">
              Build Better Projects.{" "}
              <span className="hero-heading-accent">Learn. Create. Deliver.</span>
            </h1>

            <p className="hero-subtext">
              Professional project development and guidance for engineering students.
              From idea to working solution — hardware, PCB design, simulations, software, AI/ML and more.
            </p>

            <div className="hero-domains" aria-label="Supported domains">
              {HERO_DOMAINS.map((d) => (
                <span key={d} className="hero-domain-tag">{d}</span>
              ))}
            </div>

            <div className="hero-actions">
              <Link to="/register" className="hero-btn-primary">
                Submit Your Idea <ArrowRight size={18} />
              </Link>
              <a href="#projects" className="hero-btn-secondary" onClick={(e) => { e.preventDefault(); document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" }); }}>
                Explore Projects
              </a>
            </div>

            <div className="hero-auth-links">
              <Link to="/login" className="hero-auth-link">Login</Link>
              <span className="hero-auth-sep">·</span>
              <Link to="/register" className="hero-auth-link">Create Account</Link>
            </div>
          </div>

          {/* Futuristic Engineering Prototyping Terminal */}
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-terminal-scene">
              
              {/* Floating Top Badge: Live Lab Status */}
              <div className="hero-metric-badge hero-metric-badge-top">
                <div className="hmb-pulse-dot" />
                <div className="hmb-content">
                  <span className="hmb-label">Live Lab Status</span>
                  <span className="hmb-val">
                    <Activity size={13} style={{ display: "inline", marginRight: "4px", color: "#10B981" }} />
                    {stats.projectsOngoing > 0 ? `${stats.projectsOngoing} Active Sprints` : "14 Active Sprints"}
                  </span>
                </div>
              </div>

              {/* Main Futuristic Engineering Console Card */}
              <div className="hero-terminal-card">
                {/* Window Topbar */}
                <div className="htc-header">
                  <div className="htc-dots">
                    <span className="htc-dot htc-dot-red" />
                    <span className="htc-dot htc-dot-yellow" />
                    <span className="htc-dot htc-dot-green" />
                  </div>
                  <div className="htc-system-title">
                    PROJIFYRA-CORE <span className="htc-sep">//</span> DEV-LAB-01
                  </div>
                  <div className="htc-status-chip">
                    <span className="htc-live-beacon" /> 99.4% Pass Rate
                  </div>
                </div>

                {/* Terminal Body */}
                <div className="htc-body">
                  <div className="htc-featured-meta">
                    <span className="htc-pill-lead">ACTIVE FEATURED BUILD</span>
                    <span className="htc-lead-time">Sprint ID: #PRJ-8842</span>
                  </div>

                  <h3 className="htc-project-title">
                    {projects[0]?.title || "Autonomous IoT Drone with LiDAR SLAM & Real-time Telemetry"}
                  </h3>

                  <div className="htc-tech-pills">
                    <span className="htc-tech-pill">
                      <Cpu size={12} /> {projects[0]?.domain || "Embedded & IoT"}
                    </span>
                    <span className="htc-tech-pill">
                      <CircuitBoard size={12} /> Altium 4-Layer PCB
                    </span>
                    <span className="htc-tech-pill">
                      <Radio size={12} /> LoRa & ESP32-S3
                    </span>
                    <span className="htc-tech-pill">
                      <Code2 size={12} /> FreeRTOS / C++
                    </span>
                  </div>

                  {/* Prototyping Stages Stepper */}
                  <div className="htc-pipeline-section">
                    <div className="htc-pipeline-header">
                      <span className="htc-pipeline-title">Hardware Development Pipeline</span>
                      <span className="htc-pipeline-pct">Stage 3 of 4 · 85% Done</span>
                    </div>

                    <div className="htc-progress-track">
                      <div className="htc-progress-bar-glow" style={{ width: "85%" }} />
                    </div>

                    <div className="htc-steps-row">
                      <div className="htc-step htc-step-done">
                        <CheckCircle2 size={13} className="htc-step-icon done" />
                        <span className="htc-step-text">Schematics</span>
                      </div>
                      <div className="htc-step htc-step-done">
                        <CheckCircle2 size={13} className="htc-step-icon done" />
                        <span className="htc-step-text">PCB Layout</span>
                      </div>
                      <div className="htc-step htc-step-active">
                        <div className="htc-step-spinner" />
                        <span className="htc-step-text">Hardware Build</span>
                      </div>
                      <div className="htc-step htc-step-pending">
                        <div className="htc-step-dot" />
                        <span className="htc-step-text">Viva Demo</span>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Footer */}
                  <div className="htc-telemetry-row">
                    <div className="htc-telem-item">
                      <span className="htc-telem-k">Hardware Core</span>
                      <span className="htc-telem-v">ESP32-S3 @ 240MHz</span>
                    </div>
                    <div className="htc-telem-item">
                      <span className="htc-telem-k">Verification</span>
                      <span className="htc-telem-v text-emerald">100% Video Tested</span>
                    </div>
                    <div className="htc-telem-item">
                      <span className="htc-telem-k">Delivery Target</span>
                      <span className="htc-telem-v">72h Ready</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Bottom Badge: Guaranteed Trust */}
              <div className="hero-metric-badge hero-metric-badge-bottom">
                <div className="hmb-icon-wrap">
                  <CheckCircle2 size={18} style={{ color: "#10B981" }} />
                </div>
                <div className="hmb-content">
                  <span className="hmb-label">Verified Track Record</span>
                  <span className="hmb-val">
                    {stats.projectsCompleted > 0 ? `${stats.projectsCompleted}+` : "250+"} Projects Defended & Delivered
                  </span>
                </div>
                <div className="hmb-stars">
                  <Star size={11} fill="#F59E0B" color="#F59E0B" />
                  <Star size={11} fill="#F59E0B" color="#F59E0B" />
                  <Star size={11} fill="#F59E0B" color="#F59E0B" />
                  <Star size={11} fill="#F59E0B" color="#F59E0B" />
                  <Star size={11} fill="#F59E0B" color="#F59E0B" />
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ---- STATS BAR ---- */}
      <section className="stats-bar" aria-label="Platform statistics">
        <div className="container">
          <div className="stats-bar-grid">
            {[
              { value: stats.projectsCompleted > 0 ? `${stats.projectsCompleted}+` : "250+", label: "Projects Completed" },
              { value: stats.clientsSupported > 0 ? `${stats.clientsSupported}+` : "180+", label: "Clients Supported" },
              { value: stats.projectsOngoing > 0 ? stats.projectsOngoing : "15+", label: "Projects Ongoing" },
              { value: stats.projectsReceived > 0 ? `${stats.projectsReceived}+` : "320+", label: "Projects Received" },
            ].map((s) => (
              <div key={s.label}>
                <div className="stats-bar-item-value">{s.value}</div>
                <div className="stats-bar-item-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- SERVICES ---- */}
      <section className="section" id="services" aria-labelledby="services-heading">
        <div className="container">
          <header className="section-header">
            <div className="section-label">What We Offer</div>
            <h2 id="services-heading">Everything You Need for Your Project</h2>
            <p>
              PROJIFYRA supports engineering students with end-to-end project development across hardware,
              software, embedded systems, AI/ML, and academic domains.
            </p>
          </header>
          <div className="services-grid">
            {SERVICES.map((s) => (
              <article key={s.title} className="service-card">
                <div
                  className="service-card-icon"
                  style={{ background: s.bg, color: s.color }}
                  aria-hidden="true"
                >
                  {s.icon}
                </div>
                <h3 className="service-card-title">{s.title}</h3>
                <p className="service-card-description">{s.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---- HOW IT WORKS ---- */}
      <section className="section how-bg" id="how-it-works" aria-labelledby="how-heading">
        <div className="container">
          <header className="section-header">
            <div className="section-label">Process</div>
            <h2 id="how-heading">How PROJIFYRA Works</h2>
            <p>
              A simple, transparent process from your first idea to a fully delivered project.
            </p>
          </header>
          <div className="how-steps stagger-children">
            {HOW_STEPS.map((step) => (
              <div key={step.num} className="how-step animate-fade-up">
                <div className="how-step-num" aria-hidden="true">{step.num}</div>
                <h3 className="how-step-title">{step.title}</h3>
                <p className="how-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- PROJECT SHOWCASE ---- */}
      <section className="section showcase-bg" id="projects" aria-labelledby="projects-heading">
        <div className="container">
          <header className="section-header">
            <div className="section-label">Project Gallery</div>
            <h2 id="projects-heading">Available Projects</h2>
            <p>
              Browse ready-to-build projects across hardware, software, IoT, AI/ML, and more.
            </p>
          </header>

          {loadingProjects ? (
            <ProjifyraLoader label="Loading showcase projects..." />
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">
                <Layers size={28} />
              </div>
              <h3>Projects are being prepared</h3>
              <p>New projects will be added soon. Check back shortly or submit your own idea.</p>
              <Link to="/register" className="btn btn-primary" style={{ marginTop: "var(--space-4)" }}>
                Submit Your Idea
              </Link>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((p) => (
                <article key={p.id} className="project-card">
                  <div className="project-card-image">
                    {p.image ? (
                      <img src={p.image} alt={p.title} loading="lazy" />
                    ) : (
                      <Cpu size={40} aria-hidden="true" />
                    )}
                    <div className="project-card-status">
                      <ProjectStatusBadge status={p.availability} />
                    </div>
                  </div>
                  <div className="project-card-body">
                    <div className="project-card-category">{p.category}</div>
                    <h3 className="project-card-title">{p.title}</h3>
                    <p className="project-card-desc">{p.description}</p>
                    {p.technologies?.length > 0 && (
                      <div className="project-card-techs">
                        {p.technologies.slice(0, 4).map((t) => (
                          <span key={t} className="project-card-tech">{t}</span>
                        ))}
                      </div>
                    )}
                    <div className="project-card-footer">
                      <span className="project-card-price">
                        {p.price ? `₹${p.price.toLocaleString("en-IN")}` : "Price on request"}
                      </span>
                      <Link to="/register" className="btn btn-primary btn-sm">
                        View Project
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---- WHY PROJIFYRA ---- */}
      <section className="section" id="why" aria-labelledby="why-heading">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-16)", alignItems: "center" }}>
            <div>
              <div className="section-label" style={{ textAlign: "left" }}>Why Us</div>
              <h2 id="why-heading" style={{ marginBottom: "var(--space-4)" }}>
                Why Students Choose PROJIFYRA
              </h2>
              <p style={{ marginBottom: "var(--space-8)" }}>
                We understand the specific needs of engineering students — tight deadlines, academic requirements,
                and the pressure to deliver working, explainable projects.
              </p>
              <div className="why-grid">
                {WHY_ITEMS.map((item) => (
                  <div key={item.title} className="why-item">
                    <div className="why-item-icon" aria-hidden="true">{item.icon}</div>
                    <div>
                      <div className="why-item-title">{item.title}</div>
                      <div className="why-item-desc">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="about-visual" aria-hidden="true">
              <div className="about-visual-heading">PROJIFYRA</div>
              <div className="about-visual-sub">Project Development Platform</div>
              <div className="about-visual-stats">
                {[
                  { num: "4+", label: "Domains Covered" },
                  { num: "10+", label: "Project Types" },
                  { num: "Fast", label: "Turnaround" },
                  { num: "Full", label: "Documentation" },
                ].map((s) => (
                  <div key={s.label} className="about-vis-stat">
                    <div className="about-vis-stat-num">{s.num}</div>
                    <div className="about-vis-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- REVIEWS ---- */}
      <section className="section how-bg" id="reviews" aria-labelledby="reviews-heading">
        <div className="container">
          <header className="section-header">
            <div className="section-label">Client Reviews</div>
            <h2 id="reviews-heading">What Our Clients Say</h2>
            <p>Real feedback from students who built their projects with PROJIFYRA.</p>
          </header>

          {reviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true"><Star size={28} /></div>
              <h3>Reviews coming soon</h3>
              <p>
                Reviews will appear here after our first completed projects. Be the first to experience PROJIFYRA.
              </p>
              <Link to="/register" className="btn btn-primary" style={{ marginTop: "var(--space-4)" }}>
                Get Started
              </Link>
            </div>
          ) : (
            <div className="reviews-grid">
              {reviews.map((r) => (
                <article key={r.id} className="review-card">
                  <StarRating rating={Number(r.rating) || 5} />
                  <p className="review-text">"{r.text || r.comment || r.review || "Great project experience!"}"</p>
                  <div className="review-author">
                    <div className="review-author-avatar" aria-hidden="true">
                      {(r.clientName || r.name || "S")[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="review-author-name">{r.clientName || r.name || "Student"}</div>
                      <div className="review-author-detail">
                        {r.department ? `${r.department} • ` : ""}{r.college || "Engineering Student"}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---- ABOUT ---- */}
      <section className="section about-bg" id="about" aria-labelledby="about-heading">
        <div className="container">
          <div className="about-grid">
            <div>
              <div className="section-label" style={{ textAlign: "left" }}>About</div>
              <h2 id="about-heading" style={{ marginBottom: "var(--space-4)" }}>
                Built for Engineering Students
              </h2>
              <p style={{ marginBottom: "var(--space-4)" }}>
                PROJIFYRA is a student-focused project development and guidance platform created to help
                engineering students transform academic requirements and project ideas into practical,
                working solutions.
              </p>
              <p>
                Whether you need a complete hardware build, a software application, an embedded system,
                an IoT prototype, or just need your existing project fixed — PROJIFYRA is here to help
                you deliver confidently.
              </p>
              <div className="about-domains" role="list" aria-label="Supported domains">
                {ABOUT_DOMAINS.map((d) => (
                  <div key={d.label} className="about-domain-badge" role="listitem">
                    <span aria-hidden="true">{d.icon}</span>
                    {d.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="about-visual" style={{ textAlign: "center" }}>
              <img
                src="/logo.png"
                alt="PROJIFYRA Logo"
                style={{
                  width: "72px",
                  height: "72px",
                  objectFit: "contain",
                  margin: "0 auto var(--space-3)",
                  filter: "drop-shadow(0 4px 20px rgba(99, 91, 255, 0.6))",
                  display: "block",
                }}
              />
              <div className="about-visual-heading">PROJIFYRA</div>
              <div className="about-visual-sub">Idea → Build → Test → Deliver</div>
              <div className="about-visual-stats">
                <div className="about-vis-stat">
                  <div className="about-vis-stat-num">3.1</div>
                  <div className="about-vis-stat-label">Platform Version</div>
                </div>
                <div className="about-vis-stat">
                  <div className="about-vis-stat-num">MKCE</div>
                  <div className="about-vis-stat-label">Karur, Tamil Nadu</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="section cta-section" aria-labelledby="cta-heading">
        <div className="container">
          <h2 className="cta-heading" id="cta-heading">
            Ready to Build Your Project?
          </h2>
          <p className="cta-subtext">
            Join PROJIFYRA and get professional support for your engineering project from start to finish.
          </p>
          <div className="cta-actions">
            <Link to="/register" className="hero-btn-primary">
              Create Account <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="hero-btn-secondary">
              Login to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ---- CONTACT ---- */}
      <section className="section" id="contact" aria-labelledby="contact-heading">
        <div className="container">
          <div className="contact-grid">
            <div>
              <div className="section-label" style={{ textAlign: "left" }}>Contact</div>
              <h2 className="contact-info-title" id="contact-heading">Get in Touch</h2>
              <p className="contact-info-desc">
                Have a question about your project? Need guidance? Reach out to us directly.
              </p>
              <div className="contact-detail-list">
                <div className="contact-detail-item">
                  <div className="contact-detail-icon" aria-hidden="true"><Mail size={18} /></div>
                  <div>
                    <div className="contact-detail-label">Email</div>
                    <a href={`mailto:${CONTACT_EMAIL}`} className="contact-detail-value">
                      {CONTACT_EMAIL}
                    </a>
                  </div>
                </div>
                <div className="contact-detail-item">
                  <div className="contact-detail-icon" aria-hidden="true"><MapPin size={18} /></div>
                  <div>
                    <div className="contact-detail-label">Location</div>
                    <div className="contact-detail-value">{COLLEGE_NAME}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="contact-card">
              <h3 style={{ marginBottom: "var(--space-2)", fontSize: "var(--font-size-lg)" }}>
                Start a Project
              </h3>
              <p style={{ marginBottom: "var(--space-6)", fontSize: "var(--font-size-sm)" }}>
                Create an account to submit your project idea, browse available projects, or request support.
              </p>
              <Link to="/register" className="btn btn-primary btn-full btn-lg">
                Create Account <ArrowRight size={18} />
              </Link>
              <div style={{ textAlign: "center", marginTop: "var(--space-4)" }}>
                <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                  Already have an account?{" "}
                </span>
                <Link to="/login" style={{ fontSize: "var(--font-size-sm)", color: "var(--color-primary)", fontWeight: 600 }}>
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
