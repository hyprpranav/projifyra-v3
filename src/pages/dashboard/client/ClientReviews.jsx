import React, { useEffect, useState } from "react";
import {
  Star, AlertCircle, CheckCircle2, Clock, Edit3, Trash2, X, Check, MessageSquare
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  submitReview,
  getApprovedReviews,
  getClientReviews,
  updateReview,
  deleteReview,
} from "../../../services/reviewService";

function StarPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: "var(--space-1)" }} role="radiogroup" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: "2px",
            color: s <= value ? "#F59E0B" : "var(--color-border)",
            transition: "color var(--transition-fast)",
          }}
          aria-label={`${s} star${s !== 1 ? "s" : ""}`}
          aria-pressed={s === value}
        >
          <Star size={28} fill={s <= value ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

export default function ClientReviews() {
  const { userProfile, currentUser } = useAuth();
  const [myReviews, setMyReviews] = useState([]);
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ rating: 5, text: "", clientName: "", college: "", department: "" });
  const [submitting, setSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 5, text: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const loadData = async () => {
    setLoading(true);
    try {
      const [approved, mine] = await Promise.all([
        getApprovedReviews(),
        currentUser?.uid ? getClientReviews(currentUser.uid, currentUser.email) : Promise.resolve([]),
      ]);
      setApprovedReviews(approved);
      setMyReviews(mine);
    } catch (err) {
      console.warn("Could not load reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (userProfile) {
      setForm((f) => ({
        ...f,
        clientName: userProfile.fullName || "",
        college: userProfile.college || "M. Kumarasamy College of Engineering, Karur",
        department: userProfile.department || "",
      }));
    }
  }, [userProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.rating || form.rating === 0) {
      setMsg({ text: "Please select a star rating.", type: "error" });
      return;
    }
    if (!form.text.trim()) {
      setMsg({ text: "Please write your review feedback.", type: "error" });
      return;
    }

    setSubmitting(true);
    setMsg({ text: "", type: "" });
    try {
      await submitReview(currentUser?.uid || userProfile?.uid, {
        rating: form.rating,
        text: form.text.trim(),
        clientName: form.clientName || userProfile?.fullName || "Student",
        clientEmail: currentUser?.email || userProfile?.email || "",
        college: form.college || userProfile?.college || "MKCE Karur",
        department: form.department || userProfile?.department || "",
      });
      setMsg({
        text: "Review submitted successfully! It has been sent to the Admin Desk for review.",
        type: "success",
      });
      setForm((f) => ({ ...f, rating: 5, text: "" }));
      await loadData();
    } catch (err) {
      setMsg({ text: "Failed to submit review: " + err.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (rev) => {
    setEditingReviewId(rev.id);
    setEditForm({
      rating: Number(rev.rating) || 5,
      text: rev.text || rev.comment || rev.review || "",
    });
  };

  const handleUpdate = async (reviewId) => {
    if (!editForm.text.trim()) {
      setMsg({ text: "Review text cannot be empty.", type: "error" });
      return;
    }

    setActionLoading(true);
    try {
      await updateReview(reviewId, {
        rating: editForm.rating,
        text: editForm.text.trim(),
        approved: false, // Re-submits for admin approval after editing
        editRequested: true,
      });
      setMsg({
        text: "Review updated! It is currently under review by Admin.",
        type: "success",
      });
      setEditingReviewId(null);
      await loadData();
    } catch (err) {
      setMsg({ text: "Failed to update review: " + err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    setActionLoading(true);
    try {
      await deleteReview(reviewId);
      setMsg({ text: "Your review has been deleted.", type: "info" });
      await loadData();
    } catch (err) {
      setMsg({ text: "Failed to delete review: " + err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: "var(--space-6)", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div>
          <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 800 }}>Reviews & Testimonials</h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "2px" }}>
            Share your project building experience and view your feedback status.
          </p>
        </div>
      </div>

      {msg.text && (
        <div
          className={`alert ${msg.type === "error" ? "alert-error" : msg.type === "info" ? "alert-info" : "alert-success"}`}
          style={{ marginBottom: "var(--space-6)" }}
        >
          {msg.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* SECTION 1: MY SUBMITTED REVIEWS & STATUS */}
      {myReviews.length > 0 && (
        <div className="card" style={{ marginBottom: "var(--space-8)", border: "1px solid var(--color-border)" }}>
          <div className="card-header flex-between" style={{ padding: "var(--space-5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <MessageSquare size={20} style={{ color: "var(--color-primary)" }} />
              <div>
                <h3 style={{ fontSize: "var(--font-size-md)", fontWeight: 700, margin: 0 }}>
                  My Submitted Feedback ({myReviews.length})
                </h3>
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                  Review moderation and live status on PROJIFYRA
                </span>
              </div>
            </div>
          </div>

          <div className="card-body" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {myReviews.map((rev) => {
              const rating = Number(rev.rating) || 5;
              const isApproved = rev.approved === true;
              const isEditing = editingReviewId === rev.id;

              return (
                <div
                  key={rev.id}
                  style={{
                    background: "var(--color-surface)",
                    border: `1px solid ${isApproved ? "rgba(16, 185, 129, 0.4)" : "rgba(245, 158, 11, 0.4)"}`,
                    borderRadius: "14px",
                    padding: "var(--space-5)",
                  }}
                >
                  {isEditing ? (
                    <div>
                      <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "var(--space-3)" }}>
                        Edit Your Review
                      </h4>
                      <div style={{ marginBottom: "var(--space-3)" }}>
                        <StarPicker
                          value={editForm.rating}
                          onChange={(r) => setEditForm((prev) => ({ ...prev, rating: r }))}
                        />
                      </div>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={editForm.text}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, text: e.target.value }))}
                        placeholder="Update your review feedback..."
                        style={{ marginBottom: "var(--space-4)" }}
                      />
                      <div style={{ display: "flex", gap: "var(--space-2)" }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleUpdate(rev.id)}
                          disabled={actionLoading}
                        >
                          <Check size={14} /> Save & Submit to Admin
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setEditingReviewId(null)}
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex-between" style={{ flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                          <div style={{ display: "flex", gap: "2px", color: "#F59E0B" }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={18} fill={s <= rating ? "currentColor" : "none"} />
                            ))}
                          </div>
                          <span
                            className={`badge ${isApproved ? "badge-success" : "badge-warning"}`}
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            {isApproved ? (
                              <><CheckCircle2 size={12} /> Approved & Published Live</>
                            ) : (
                              <><Clock size={12} /> Pending Admin Moderation</>
                            )}
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: "var(--space-2)" }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => startEdit(rev)}
                            title="Edit Review"
                          >
                            <Edit3 size={14} /> Edit Review
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ color: "#DC2626", borderColor: "rgba(220, 38, 38, 0.3)" }}
                            onClick={() => handleDelete(rev.id)}
                            title="Delete Review"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>

                      <p style={{ fontSize: "15px", color: "var(--color-text)", lineHeight: "1.6", margin: "0 0 var(--space-3)" }}>
                        "{rev.text || rev.comment || rev.review || "Great project experience!"}"
                      </p>

                      <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        Author: <strong>{rev.clientName || userProfile?.fullName || "Student"}</strong>
                        {rev.department ? ` • ${rev.department}` : ""}
                        {rev.college ? ` • ${rev.college}` : " • MKCE Karur"}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: SUBMIT NEW REVIEW (If no reviews yet, or write another) */}
      <div className="card card-body" style={{ marginBottom: "var(--space-8)" }}>
        <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, marginBottom: "var(--space-2)" }}>
          {myReviews.length > 0 ? "Submit Additional Feedback" : "Share Your Experience"}
        </h3>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "var(--space-5)" }}>
          Your testimonial helps future students make confident project development choices.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group" style={{ marginBottom: "var(--space-4)" }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              Your Star Rating <span className="required">*</span>
            </label>
            <StarPicker value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
          </div>

          <div className="form-group" style={{ marginBottom: "var(--space-5)" }}>
            <label className="form-label" htmlFor="review-text" style={{ fontWeight: 600 }}>
              Your Feedback & Experience <span className="required">*</span>
            </label>
            <textarea
              id="review-text"
              className="form-control"
              rows={4}
              placeholder="Tell us about the project quality, team support, hardware/simulation deliverables, and timeline..."
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting} aria-busy={submitting}>
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>

      {/* SECTION 3: COMMUNITY TESTIMONIALS */}
      <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, marginBottom: "var(--space-5)" }}>
        Community Testimonials ({approvedReviews.length})
      </h3>

      {loading ? (
        <div className="flex-center" style={{ minHeight: 150 }}>
          <div className="spinner spinner-primary" />
        </div>
      ) : approvedReviews.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Star size={28} /></div>
          <h3>No reviews published yet</h3>
          <p>Be the first to share your experience with PROJIFYRA.</p>
        </div>
      ) : (
        <div className="reviews-grid">
          {approvedReviews.map((r) => (
            <article key={r.id} className="review-card">
              <div className="review-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} fill={s <= (Number(r.rating) || 5) ? "currentColor" : "none"} />
                ))}
              </div>
              <p className="review-text">"{r.text || r.comment || r.review || "Great project experience!"}"</p>
              <div className="review-author">
                <div className="review-author-avatar">{(r.clientName || "S")[0]?.toUpperCase()}</div>
                <div>
                  <div className="review-author-name">{r.clientName || "Student"}</div>
                  <div className="review-author-detail">{r.department} {r.college}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
