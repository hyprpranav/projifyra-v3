import React, { useEffect, useState } from "react";
import {
  FolderOpen, Plus, Search, Edit3, Trash2, X, Check,
  AlertCircle, RefreshCw, Star, Tag, Layers, User,
  Sliders, FileText, CheckCircle2, Clock, DollarSign
} from "lucide-react";
import {
  getPublicProjects,
  createProject,
  updateProject,
  deleteProject,
  PROJECT_CATEGORIES,
  PROJECT_STATUS
} from "../../../services/projectService";
import {
  getAllRequests,
  updateCompletionPercentage,
  ORDER_STATUS
} from "../../../services/orderService";

const INITIAL_FORM = {
  title: "",
  category: "IoT",
  description: "",
  technologies: "",
  price: "",
  status: "Available",
  featured: false,
  difficulty: "Intermediate",
};

const STATUS_BADGE = {
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

export default function AdminProjects() {
  const [activeTab, setActiveTab] = useState("client_projects"); // "client_projects" | "showcase_catalog"

  // Client Projects (From Requests & Orders)
  const [clientProjects, setClientProjects] = useState([]);
  const [filteredClientProjects, setFilteredClientProjects] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientStatusFilter, setClientStatusFilter] = useState("all");
  const [progressModal, setProgressModal] = useState(null);
  const [newPercentage, setNewPercentage] = useState(0);
  const [progressNote, setProgressNote] = useState("");

  // Showcase Catalog Projects
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  // Common UI State
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [specsModal, setSpecsModal] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catalogData, requestsData] = await Promise.all([
        getPublicProjects(),
        getAllRequests(),
      ]);

      setProjects(catalogData);
      setFilteredProjects(catalogData);

      // Filter requests to those that are approved or in progress/testing/ready/delivered/completed
      const approvedOrActive = requestsData.filter(
        (r) =>
          r.status === ORDER_STATUS.APPROVED ||
          r.status === ORDER_STATUS.IN_PROGRESS ||
          r.status === ORDER_STATUS.TESTING ||
          r.status === ORDER_STATUS.READY_FOR_DELIVERY ||
          r.status === ORDER_STATUS.DELIVERED ||
          r.status === ORDER_STATUS.COMPLETED ||
          r.projectAmount > 0
      );
      setClientProjects(approvedOrActive);
      setFilteredClientProjects(approvedOrActive);
    } catch (err) {
      setMsg({ text: "Failed to load projects: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter client projects
  useEffect(() => {
    let result = clientProjects;
    if (clientSearch.trim()) {
      const q = clientSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.projectTitle?.toLowerCase().includes(q) ||
          p.fullName?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.registerNumber?.toLowerCase().includes(q) ||
          p.department?.toLowerCase().includes(q) ||
          p.assignedOfficerName?.toLowerCase().includes(q)
      );
    }
    if (clientStatusFilter !== "all") {
      result = result.filter((p) => p.status === clientStatusFilter);
    }
    setFilteredClientProjects(result);
  }, [clientSearch, clientStatusFilter, clientProjects]);

  // Filter catalog showcase projects
  useEffect(() => {
    let result = projects;
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.technologies?.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") {
      result = result.filter((p) => p.category === categoryFilter);
    }
    setFilteredProjects(result);
  }, [catalogSearch, categoryFilter, projects]);

  const handleUpdateProgressSubmit = async (e) => {
    e.preventDefault();
    if (!progressModal) return;

    setSaving(true);
    try {
      await updateCompletionPercentage(progressModal.id, newPercentage, progressNote);
      setMsg({ text: `Progress updated to ${newPercentage}% for "${progressModal.projectTitle}".`, type: "success" });
      setProgressModal(null);
      await loadData();
    } catch (err) {
      setMsg({ text: "Failed to update progress: " + err.message, type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg({ text: "", type: "" }), 5000);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingId(project.id);
    setFormData({
      title: project.title || "",
      category: project.category || "IoT",
      description: project.description || "",
      technologies: project.technologies || "",
      price: project.price || "",
      status: project.status || "Available",
      featured: Boolean(project.featured),
      difficulty: project.difficulty || "Intermediate",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData(INITIAL_FORM);
  };

  const handleSubmitCatalog = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setMsg({ text: "Project title is required", type: "error" });
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateProject(editingId, formData);
        setProjects((prev) =>
          prev.map((p) => (p.id === editingId ? { ...p, ...formData } : p))
        );
        setMsg({ text: "Showcase project updated successfully!", type: "success" });
      } else {
        const newId = await createProject(formData);
        setProjects((prev) => [{ id: newId, ...formData, createdAt: new Date() }, ...prev]);
        setMsg({ text: "New showcase project created successfully!", type: "success" });
      }
      closeModal();
    } catch (err) {
      setMsg({ text: "Failed to save project: " + err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCatalog = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setMsg({ text: `Project "${title}" deleted.`, type: "success" });
    } catch (err) {
      setMsg({ text: "Failed to delete project: " + err.message, type: "error" });
    }
  };

  return (
    <div className="admin-projects">
      {msg.text && (
        <div className={`alert ${msg.type === "error" ? "alert-error" : "alert-success"}`} style={{ marginBottom: "var(--space-4)" }}>
          <AlertCircle size={18} />
          <span>{msg.text}</span>
        </div>
      )}

      {/* TABS: Client Projects (Approved builds) vs Showcase Catalog */}
      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-6)", borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-2)" }}>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "client_projects" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setActiveTab("client_projects")}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <FolderOpen size={16} /> Client Projects & Approved Builds ({clientProjects.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "showcase_catalog" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setActiveTab("showcase_catalog")}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Layers size={16} /> Showcase Catalog ({projects.length})
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: CLIENT PROJECTS (APPROVED & ACTIVE BUILDS)         */}
      {/* ======================================================== */}
      {activeTab === "client_projects" && (
        <div>
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
                  placeholder="Search client projects by title, student, reg no, department..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: "180px", height: "42px" }}
                value={clientStatusFilter}
                onChange={(e) => setClientStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="In Progress">In Progress</option>
                <option value="Testing">Testing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <button className="btn btn-outline btn-sm" onClick={loadData} disabled={loading}>
              <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
            </button>
          </div>

          {/* Client Projects Table */}
          <div className="data-table-wrap">
            <div className="data-table-header">
              <div>
                <h3>Approved Client Projects & Live Orders ({filteredClientProjects.length})</h3>
                <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                  Verified student projects approved by the Admin Desk, active in engineering pipeline.
                </p>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
                Loading client projects...
              </div>
            ) : filteredClientProjects.length === 0 ? (
              <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
                No approved client projects found matching the filter.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Project Title & Deliverables</th>
                      <th>Student & Academic Info</th>
                      <th>Assigned Officer</th>
                      <th>Budget & 30% Advance</th>
                      <th>Completion %</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClientProjects.map((p) => {
                      const amount = Number(p.projectAmount || 0);
                      const advReq = Number(p.advancePaymentRequired || Math.round(amount * 0.3));
                      const advStatus = p.advancePaymentStatus || "Pending";
                      const progress = Number(p.completionPercentage || 0);

                      return (
                        <tr key={p.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: "var(--color-text)", fontSize: "14px" }}>
                              {p.projectTitle || "Custom Engineering Build"}
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                              {p.selectedServices?.map((s, idx) => (
                                <span key={idx} className="badge badge-primary" style={{ fontSize: "10px", padding: "1px 6px" }}>
                                  {typeof s === "string" ? s : s?.name || "Service"}
                                </span>
                              ))}
                              {p.pcbTool && (
                                <span className="badge badge-neutral" style={{ fontSize: "10px" }}>
                                  PCB: {p.pcbTool}
                                </span>
                              )}
                              {p.simulationTool && (
                                <span className="badge badge-neutral" style={{ fontSize: "10px" }}>
                                  Sim: {p.simulationTool}
                                </span>
                              )}
                            </div>
                          </td>

                          <td>
                            <div style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "13px" }}>
                              {p.fullName || "Student"}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                              {p.registerNumber ? `Reg: ${p.registerNumber} • ` : ""}{p.department || "Engineering"}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                              {p.email || ""}
                            </div>
                          </td>

                          <td>
                            <div style={{ fontSize: "13px", fontWeight: 600 }}>
                              {p.assignedOfficerName || "PROJIFYRA Engineering Team"}
                            </div>
                          </td>

                          <td>
                            <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--color-text)" }}>
                              ₹{amount.toLocaleString("en-IN")}
                            </div>
                            <div style={{ fontSize: "11px", marginTop: "2px" }}>
                              <span style={{ color: "var(--color-text-secondary)" }}>30% Adv: ₹{advReq.toLocaleString("en-IN")}</span>
                              <span
                                className={`badge ${advStatus === "Verified" ? "badge-success" : advStatus === "Submitted" ? "badge-warning" : "badge-neutral"}`}
                                style={{ marginLeft: "4px", fontSize: "10px", padding: "1px 5px" }}
                              >
                                {advStatus}
                              </span>
                            </div>
                          </td>

                          <td style={{ minWidth: "140px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
                              <span style={{ fontWeight: 700 }}>{progress}%</span>
                              <span style={{ color: "var(--color-text-secondary)" }}>
                                {progress === 100 ? "Ready" : progress > 50 ? "Testing" : "Dev"}
                              </span>
                            </div>
                            <div style={{ width: "100%", height: "6px", background: "var(--color-border)", borderRadius: "3px", overflow: "hidden" }}>
                              <div
                                style={{
                                  width: `${progress}%`,
                                  height: "100%",
                                  background: progress >= 100 ? "#10B981" : "linear-gradient(90deg, #635BFF, #8B5CF6)",
                                  transition: "width 0.3s ease",
                                }}
                              />
                            </div>
                          </td>

                          <td>
                            <span className={`badge ${STATUS_BADGE[p.status] || "badge-neutral"}`}>
                              {p.status}
                            </span>
                          </td>

                          <td>
                            <div style={{ display: "flex", gap: "var(--space-2)" }}>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => {
                                  setProgressModal(p);
                                  setNewPercentage(p.completionPercentage || 0);
                                  setProgressNote(p.latestProgressNote || "");
                                }}
                                title="Update Completion Progress"
                              >
                                <Sliders size={14} /> Progress
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => setSpecsModal(p)}
                                title="View Project Specs"
                              >
                                <FileText size={14} /> Specs
                              </button>
                            </div>
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
      )}

      {/* ======================================================== */}
      {/* TAB 2: SHOWCASE PROJECT CATALOG (PUBLIC WEBSITE TEMPLATES) */}
      {/* ======================================================== */}
      {activeTab === "showcase_catalog" && (
        <div>
          {/* Top action toolbar */}
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
                  placeholder="Search catalog by title, tech, stack..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
              </div>

              <select
                className="form-select"
                style={{ width: "180px", height: "42px" }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {PROJECT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <button className="btn btn-outline btn-sm" onClick={loadData} disabled={loading}>
                <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
              </button>
              <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                <Plus size={16} /> New Showcase Project
              </button>
            </div>
          </div>

          {/* Catalog Projects Table */}
          <div className="data-table-wrap">
            <div className="data-table-header">
              <div>
                <h3>Showcase Project Catalog ({filteredProjects.length})</h3>
                <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                  Hardware, software, IoT, and embedded projects visible to students and visitors on landing page.
                </p>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
                Loading project catalog...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
                No projects found in showcase catalog. Click "New Showcase Project" above to publish one!
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Project Title</th>
                      <th>Category</th>
                      <th>Tech Stack</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Featured</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((proj) => (
                      <tr key={proj.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--color-text)" }}>
                            {proj.title}
                          </div>
                          <div
                            style={{
                              fontSize: "var(--font-size-xs)",
                              color: "var(--color-text-secondary)",
                              maxWidth: "320px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {proj.description}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-primary">{proj.category || "General"}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text)" }}>
                            {proj.technologies || "Hardware / Software"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {proj.price ? `₹${proj.price}` : "Custom Quote"}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              proj.status === "Available"
                                ? "badge-success"
                                : proj.status === "Limited"
                                ? "badge-warning"
                                : "badge-danger"
                            }`}
                          >
                            {proj.status || "Available"}
                          </span>
                        </td>
                        <td>
                          {proj.featured ? (
                            <span className="badge badge-warning" style={{ gap: "4px" }}>
                              <Star size={12} fill="currentColor" /> Featured
                            </span>
                          ) : (
                            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>No</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "var(--space-2)" }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => openEditModal(proj)}
                              title="Edit Project"
                            >
                              <Edit3 size={14} /> Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ color: "#DC2626", borderColor: "rgba(220, 38, 38, 0.3)" }}
                              onClick={() => handleDeleteCatalog(proj.id, proj.title)}
                              title="Delete Project"
                            >
                              <Trash2 size={14} />
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
        </div>
      )}

      {/* Progress Update Modal */}
      {progressModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
          }}
        >
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <div
              style={{
                padding: "var(--space-5) var(--space-6)",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ fontSize: "var(--font-size-md)", fontWeight: 700, margin: 0 }}>
                  Update Completion Progress
                </h3>
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                  {progressModal.projectTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setProgressModal(null)}
                style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateProgressSubmit} style={{ padding: "var(--space-6)" }}>
              <div style={{ marginBottom: "var(--space-6)" }}>
                <div className="flex-between" style={{ marginBottom: "var(--space-2)" }}>
                  <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>Progress Percentage</label>
                  <strong style={{ fontSize: "1.2rem", color: "var(--color-primary)" }}>{newPercentage}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={newPercentage}
                  onChange={(e) => setNewPercentage(Number(e.target.value))}
                  style={{ width: "100%", height: "8px", cursor: "pointer" }}
                />
                <div className="flex-between" style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                  <span>0% (Initial)</span>
                  <span>50% (Testing)</span>
                  <span>100% (Completed)</span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "var(--space-6)" }}>
                <label className="form-label">Latest Progress Note</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  placeholder="e.g. Component soldering completed, firmware flashing in progress..."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
                <button type="button" className="btn btn-outline" onClick={() => setProgressModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Updating..." : "Save Progress"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Specs Details Modal */}
      {specsModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
          }}
        >
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <div
              style={{
                padding: "var(--space-5) var(--space-6)",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ fontSize: "var(--font-size-md)", fontWeight: 700, margin: 0 }}>
                  {specsModal.projectTitle}
                </h3>
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                  Client: {specsModal.fullName} ({specsModal.email})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSpecsModal(null)}
                style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 600 }}>Short Description:</span>
                <p style={{ marginTop: "2px", fontSize: "14px", lineHeight: "1.6" }}>
                  {specsModal.shortDescription || specsModal.description || "No description provided."}
                </p>
              </div>

              <div>
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 600 }}>Requirements & Specs:</span>
                <p style={{ marginTop: "2px", fontSize: "14px", lineHeight: "1.6" }}>
                  {specsModal.requirements || "No specific hardware details."}
                </p>
              </div>

              {specsModal.documentUrl && (
                <div>
                  <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: 600 }}>Uploaded Reference PDF:</span>
                  <div style={{ marginTop: "4px" }}>
                    <a
                      href={specsModal.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{ display: "inline-flex", gap: "6px" }}
                    >
                      <FileText size={14} /> Open Document PDF
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog for Showcase Create/Edit */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
          }}
        >
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <div
              style={{
                padding: "var(--space-5) var(--space-6)",
                borderBottom: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontSize: "var(--font-size-md)", fontWeight: "var(--font-weight-bold)" }}>
                {editingId ? "Edit Showcase Project" : "Create New Showcase Project"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitCatalog} style={{ padding: "var(--space-6)" }}>
              <div className="form-group">
                <label className="form-label">Project Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Smart IoT Agriculture Monitoring System"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {PROJECT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Availability Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {Object.values(PROJECT_STATUS).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Detailed project summary, hardware components, methodology, and features..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Technologies / Tools</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Arduino UNO, ESP32, DHT22 Sensor, Blynk, C++"
                  value={formData.technologies}
                  onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-group">
                  <label className="form-label">Estimated Price (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 3500"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Difficulty Level</label>
                  <select
                    className="form-select"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "var(--space-6)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  />
                  <span style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)" }}>
                    Mark as Featured project on Homepage
                  </span>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update Project" : "Publish Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
