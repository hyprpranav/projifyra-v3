import React, { useEffect, useState } from "react";
import { Star, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { submitReview, getApprovedReviews } from "../../../services/reviewService";

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
  const { userProfile } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ rating: 0, text: "", clientName: "", college: "", department: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getApprovedReviews()
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (userProfile) {
      setForm((f) => ({
        ...f,
        clientName: userProfile.fullName || "",
        college: userProfile.college || "",
        department: userProfile.department || "",
      }));
    }
  }, [userProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.rating === 0) { setError("Please select a rating."); return; }
    if (!form.text.trim()) { setError("Please write your review."); return; }

    setSubmitting(true);
    setError("");
    try {
      await submitReview(userProfile.uid, {
        rating: form.rating,
        text: form.text.trim(),
        clientName: form.clientName || userProfile.fullName,
        college: form.college,
        department: form.department,
      });
      setSuccess(true);
      setForm((f) => ({ ...f, rating: 0, text: "" }));
    } catch {
      setError("Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: "var(--font-size-xl)", marginBottom: "var(--space-6)" }}>Reviews</h2>

      {/* Submit Review Form */}
      <div className="card card-body" style={{ marginBottom: "var(--space-8)" }}>
        <h3 style={{ fontSize: "var(--font-size-lg)", marginBottom: "var(--space-5)" }}>
          Share Your Experience
        </h3>

        {success && (
          <div className="alert alert-success" style={{ marginBottom: "var(--space-5)" }}>
            <CheckCircle2 size={18} />
            Thank you for your review! It will appear publicly after approval.
          </div>
        )}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: "var(--space-5)" }} role="alert">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group" style={{ marginBottom: "var(--space-5)" }}>
            <label className="form-label">Your Rating <span className="required">*</span></label>
            <StarPicker value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
          </div>
          <div className="form-group" style={{ marginBottom: "var(--space-5)" }}>
            <label className="form-label" htmlFor="review-text">
              Your Review <span className="required">*</span>
            </label>
            <textarea
              id="review-text"
              className="form-control"
              rows={4}
              placeholder="Describe your experience with PROJIFYRA..."
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting} aria-busy={submitting}>
            {submitting ? <><span className="spinner" /> Submitting...</> : "Submit Review"}
          </button>
        </form>
      </div>

      {/* Approved Reviews */}
      <h3 style={{ fontSize: "var(--font-size-lg)", marginBottom: "var(--space-5)" }}>
        Approved Reviews
      </h3>
      {loading ? (
        <div className="flex-center" style={{ minHeight: 150 }}>
          <div className="spinner spinner-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Star size={28} /></div>
          <h3>No reviews yet</h3>
          <p>Be the first to share your experience with PROJIFYRA.</p>
        </div>
      ) : (
        <div className="reviews-grid">
          {reviews.map((r) => (
            <article key={r.id} className="review-card">
              <div className="review-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} fill={s <= r.rating ? "currentColor" : "none"} />
                ))}
              </div>
              <p className="review-text">"{r.text}"</p>
              <div className="review-author">
                <div className="review-author-avatar">{r.clientName?.[0]?.toUpperCase() || "C"}</div>
                <div>
                  <div className="review-author-name">{r.clientName || "Client"}</div>
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
