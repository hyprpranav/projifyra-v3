import React, { useEffect, useState } from "react";
import { Star, CheckCircle2, EyeOff, Trash2, AlertCircle, RefreshCw, MessageSquare } from "lucide-react";
import { getAllReviews, approveReview, hideReview, deleteReview } from "../../../services/reviewService";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await getAllReviews();
      setReviews(data);
    } catch (err) {
      setMsg({ text: "Failed to load reviews: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleToggleApprove = async (reviewId, isCurrentlyApproved) => {
    setActionLoading(reviewId);
    try {
      if (isCurrentlyApproved) {
        await hideReview(reviewId);
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, approved: false } : r))
        );
        setMsg({ text: "Review hidden from public landing page.", type: "info" });
      } else {
        await approveReview(reviewId);
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, approved: true } : r))
        );
        setMsg({ text: "Review approved and now visible on public landing page!", type: "success" });
      }
    } catch (err) {
      setMsg({ text: "Failed to update review status: " + err.message, type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Permanently delete this review?")) return;
    setActionLoading(reviewId);
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setMsg({ text: "Review deleted successfully.", type: "success" });
    } catch (err) {
      setMsg({ text: "Failed to delete review: " + err.message, type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = reviews.filter((r) => {
    if (filter === "approved") return r.approved === true;
    if (filter === "pending") return !r.approved;
    return true;
  });

  return (
    <div className="admin-reviews">
      {msg.text && (
        <div className={`alert ${msg.type === "error" ? "alert-error" : msg.type === "info" ? "alert-info" : "alert-success"}`} style={{ marginBottom: "var(--space-4)" }}>
          <AlertCircle size={18} />
          <span>{msg.text}</span>
        </div>
      )}

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
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button
            type="button"
            className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilter("all")}
          >
            All Reviews ({reviews.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === "approved" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilter("approved")}
          >
            Approved ({reviews.filter((r) => r.approved).length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filter === "pending" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilter("pending")}
          >
            Pending Moderation ({reviews.filter((r) => !r.approved).length})
          </button>
        </div>

        <button className="btn btn-outline btn-sm" onClick={loadReviews} disabled={loading}>
          <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Reviews Cards List */}
      <div className="data-table-wrap">
        <div className="data-table-header">
          <div>
            <h3>Client Testimonials & Feedback ({filtered.length})</h3>
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
              Moderate client ratings and testimonials before displaying on the public homepage.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
            Loading testimonials...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
            No reviews match this filter.
          </div>
        ) : (
          <div style={{ padding: "var(--space-6)", display: "grid", gap: "var(--space-4)" }}>
            {filtered.map((rev) => {
              const rating = Number(rev.rating) || 5;
              const isApproved = rev.approved === true;

              return (
                <div
                  key={rev.id}
                  style={{
                    background: "var(--color-bg)",
                    border: `1px solid ${isApproved ? "var(--color-border)" : "rgba(245, 158, 11, 0.4)"}`,
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-5)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "var(--space-4)",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "260px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
                      <div style={{ display: "flex", gap: "2px", color: "#F59E0B" }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            fill={i < rating ? "currentColor" : "none"}
                            color={i < rating ? "#F59E0B" : "var(--color-text-tertiary)"}
                          />
                        ))}
                      </div>
                      <span className={`badge ${isApproved ? "badge-success" : "badge-warning"}`}>
                        {isApproved ? "Published Live" : "Pending Review"}
                      </span>
                    </div>

                    <p style={{ fontSize: "var(--font-size-md)", color: "var(--color-text)", lineHeight: "1.6", marginBottom: "var(--space-3)" }}>
                      "{rev.comment || rev.review || "Great project experience!"}"
                    </p>

                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                      <strong>{rev.clientName || rev.name || "Student"}</strong>
                      {rev.department ? ` • ${rev.department}` : ""}
                      {rev.college ? ` • ${rev.college}` : " • BCE Bakhtiyarpur"}
                      {rev.projectTitle ? ` (Project: ${rev.projectTitle})` : ""}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${isApproved ? "btn-outline" : "btn-primary"}`}
                      onClick={() => handleToggleApprove(rev.id, isApproved)}
                      disabled={actionLoading === rev.id}
                      title={isApproved ? "Hide from public homepage" : "Approve and show on homepage"}
                    >
                      {isApproved ? <EyeOff size={14} /> : <CheckCircle2 size={14} />}
                      {isApproved ? "Hide" : "Approve"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ color: "#DC2626", borderColor: "rgba(220, 38, 38, 0.3)" }}
                      onClick={() => handleDelete(rev.id)}
                      disabled={actionLoading === rev.id}
                      title="Delete review"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
