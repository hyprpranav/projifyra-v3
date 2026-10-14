import React, { useEffect, useState } from "react";
import {
  FolderOpen, Plus, Search, Edit3, Trash2, X, Check,
  AlertCircle, RefreshCw, Star, Tag, Layers
} from "lucide-react";
import {
  getPublicProjects,
  createProject,
  updateProject,
  deleteProject,
  PROJECT_CATEGORIES,
  PROJECT_STATUS
} from "../../../services/projectService";

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

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getPublicProjects();
      setProjects(data);
      setFilteredProjects(data);
    } catch (err) {
      setMsg({ text: "Failed to load projects: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    let result = projects;
    if (search.trim()) {
      const q = search.toLowerCase();
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
  }, [search, categoryFilter, projects]);

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

  const handleSubmit = async (e) => {
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
        setMsg({ text: "Project updated successfully!", type: "success" });
      } else {
        const newId = await createProject(formData);
        setProjects((prev) => [{ id: newId, ...formData, createdAt: new Date() }, ...prev]);
        setMsg({ text: "New project created successfully!", type: "success" });
      }
      closeModal();
    } catch (err) {
      setMsg({ text: "Failed to save project: " + err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
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
              placeholder="Search projects by title, tech, stack..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
          <button className="btn btn-outline btn-sm" onClick={loadProjects} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      {/* Projects Table */}
      <div className="data-table-wrap">
        <div className="data-table-header">
          <div>
            <h3>Showcase Project Catalog ({filteredProjects.length})</h3>
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
              Hardware, software, IoT, and embedded projects visible to students and visitors.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
            Loading project catalog...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
            No projects found. Click "New Project" above to publish the first one!
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
                      <div style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-text)" }}>
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
                    <td style={{ fontWeight: "var(--font-weight-medium)" }}>
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
                          onClick={() => handleDelete(proj.id, proj.title)}
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

      {/* Modal Dialog for Create/Edit */}
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
                {editingId ? "Edit Project" : "Create New Showcase Project"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "var(--space-6)" }}>
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
