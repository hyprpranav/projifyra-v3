import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cpu, Layers } from "lucide-react";
import { getPublicProjects } from "../../../services/projectService";

export default function ClientProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");

  useEffect(() => {
    getPublicProjects(category ? { category } : {})
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [category]);

  const CATEGORIES = [
    "", "IoT", "Embedded", "Electronics", "Web Development", "Mobile",
    "AI/ML", "Python", "Java", "DBMS", "ECE", "Hardware", "Software", "Academic Projects",
  ];

  const statusClass = {
    Available: "badge-success", Limited: "badge-warning",
    "Sold Out": "badge-error", "Coming Soon": "badge-info",
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: "var(--space-6)", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <h2 style={{ fontSize: "var(--font-size-xl)" }}>Browse Projects</h2>
        <select
          className="form-control"
          style={{ width: "auto", minWidth: 180 }}
          value={category}
          onChange={(e) => { setCategory(e.target.value); setLoading(true); }}
          aria-label="Filter by category"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c || "All Categories"}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: 200 }}>
          <div className="spinner spinner-primary" aria-label="Loading projects" />
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Layers size={28} /></div>
          <h3>No projects available right now</h3>
          <p>New projects will be added soon. In the meantime, you can submit your own project idea.</p>
          <Link to="/dashboard/requests" className="btn btn-primary" style={{ marginTop: "var(--space-4)" }}>
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
                  <span className={`badge ${statusClass[p.availability] || "badge-neutral"}`}>
                    {p.availability || "Available"}
                  </span>
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
                  <Link to="/dashboard/requests" className="btn btn-primary btn-sm">
                    Request This
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
