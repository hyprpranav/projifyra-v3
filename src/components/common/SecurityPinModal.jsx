import React, { useState } from "react";
import { ShieldAlert, KeyRound, X, AlertCircle } from "lucide-react";
import { MASTER_SECURITY_PIN } from "../../config/appConfig";

export default function SecurityPinModal({
  isOpen,
  title = "Authorize Deletion",
  description = "This action is permanent and cannot be undone.",
  confirmLabel = "Confirm Delete",
  onConfirm,
  onClose,
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pin.trim() !== MASTER_SECURITY_PIN) {
      setError("Incorrect 6-digit Secret PIN! Deletion authorization rejected.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await onConfirm(pin.trim());
      setPin("");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to execute deletion.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPin("");
    setError("");
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(5px)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        className="animate-fade-up"
        style={{
          background: "var(--color-surface)",
          border: "2px solid #DC2626",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "460px",
          padding: "26px",
          boxShadow: "0 20px 40px rgba(220, 38, 38, 0.2)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "rgba(220, 38, 38, 0.12)",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text)", margin: 0 }}>
                {title}
              </h3>
              <div style={{ fontSize: "11px", color: "#DC2626", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>
                Secret PIN Required
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleCancel}
            style={{ padding: "4px" }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: "1.6", marginBottom: "16px" }}>
          {description}
        </p>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(220, 38, 38, 0.1)",
              border: "1px solid rgba(220, 38, 38, 0.3)",
              borderRadius: "10px",
              color: "#DC2626",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
              fontWeight: 600,
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: "13px" }}>
              Enter 6-Digit Master Authorization PIN
            </label>
            <div style={{ position: "relative" }}>
              <KeyRound
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-tertiary)",
                }}
              />
              <input
                type="password"
                maxLength={6}
                autoFocus
                className="form-control"
                style={{
                  paddingLeft: "42px",
                  letterSpacing: "0.4em",
                  fontSize: "18px",
                  fontWeight: 800,
                  textAlign: "center",
                }}
                placeholder="••••••"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ""));
                  if (error) setError("");
                }}
                required
              />
            </div>
            <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "4px", display: "block" }}>
              Enter the platform 6-digit master secret pin to execute this deletion.
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" className="btn btn-ghost" onClick={handleCancel} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: "#DC2626", borderColor: "#DC2626" }}
              disabled={loading || pin.length !== 6}
            >
              {loading ? "Verifying & Deleting..." : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
