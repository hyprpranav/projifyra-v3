import React, { useState } from "react";
import {
  CheckCircle2, AlertCircle, Camera, Lock, KeyRound,
  Mail, Phone, GraduationCap, Building, Calendar,
  ShieldCheck, UploadCloud, Eye, EyeOff, RefreshCw
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  updateUserProfile,
  updateUserAvatar,
  changeUserPassword,
  sendResetPassword,
} from "../../../services/authService";
import { uploadToCloudinary } from "../../../services/cloudinaryService";
import { CLOUDINARY_CONFIG } from "../../../config/appConfig";

const DEPARTMENTS = [
  "CSE", "ECE", "EEE", "Mechanical", "Civil",
  "IT", "AIDS", "AIML", "Cyber Security",
  "Biomedical", "Chemical", "Aerospace", "Other"
];

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduated", "Faculty"];

export default function ClientProfile() {
  const { userProfile, currentUser, isAdmin } = useAuth();

  // Basic Details Form State
  const [form, setForm] = useState({
    fullName: userProfile?.fullName || "",
    phone: userProfile?.phone || "",
    college: userProfile?.college || "M. Kumarasamy College of Engineering, Karur",
    department: userProfile?.department || "",
    year: userProfile?.year || "",
    registerNumber: userProfile?.registerNumber || "",
  });

  // Avatar Upload State
  const [avatarPreview, setAvatarPreview] = useState(userProfile?.photoURL || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState({ text: "", type: "" });

  // Password Change State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: "", type: "" });

  // Profile Save State
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: "", type: "" });

  // Handle Form Change
  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (profileMsg.text) setProfileMsg({ text: "", type: "" });
  };

  // Submit Profile Details
  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setProfileMsg({ text: "Full name is required.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile(currentUser.uid, form);
      setProfileMsg({ text: "Profile details updated successfully!", type: "success" });
    } catch (err) {
      setProfileMsg({ text: err.message || "Failed to save changes. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Handle Avatar Selection & Upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarMsg({ text: "Please select a valid image file (PNG, JPG, JPEG, WEBP).", type: "error" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarMsg({ text: "Image size must be less than 5MB.", type: "error" });
      return;
    }

    // Local instant preview
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setUploadingAvatar(true);
    setAvatarMsg({ text: "Uploading to Cloudinary...", type: "info" });

    try {
      const result = await uploadToCloudinary(file, "projifyra/profiles");
      await updateUserAvatar(currentUser.uid, result.url);
      setAvatarPreview(result.url);
      setAvatarMsg({ text: "Profile photo uploaded and synced with Cloudinary!", type: "success" });
    } catch (err) {
      setAvatarMsg({
        text: err.message || "Cloudinary upload failed. Check Cloud Name & Preset in appConfig.js.",
        type: "error",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg({ text: "Password must be at least 6 characters.", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: "Passwords do not match.", type: "error" });
      return;
    }

    setChangingPassword(true);
    try {
      await changeUserPassword(newPassword);
      setPasswordMsg({ text: "Password changed successfully!", type: "success" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMsg({
        text: err.message || "Failed to change password. You may need to log out and log in again first.",
        type: "error",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle Password Reset Email
  const handleSendResetEmail = async () => {
    if (!currentUser?.email) return;
    setChangingPassword(true);
    try {
      await sendResetPassword(currentUser.email);
      setPasswordMsg({ text: `Password reset link sent to ${currentUser.email}.`, type: "success" });
    } catch (err) {
      setPasswordMsg({ text: err.message || "Failed to send reset link.", type: "error" });
    } finally {
      setChangingPassword(false);
    }
  };

  const isCloudinaryConfigured =
    CLOUDINARY_CONFIG.cloudName &&
    CLOUDINARY_CONFIG.cloudName !== "YOUR_CLOUD_NAME" &&
    CLOUDINARY_CONFIG.uploadPreset &&
    CLOUDINARY_CONFIG.uploadPreset !== "YOUR_UPLOAD_PRESET";

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: "var(--font-size-2xl)", fontWeight: "var(--font-weight-bold)" }}>
          Profile & Account Settings
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginTop: "4px" }}>
          Manage your personal details, academic affiliations, Cloudinary profile photo, and password security.
        </p>
      </div>

      {/* Cloudinary Setup Notice if not configured */}
      {!isCloudinaryConfigured && (
        <div
          className="alert alert-info"
          style={{ marginBottom: "var(--space-6)", display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}
        >
          <UploadCloud size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong>Cloudinary Integration Pending:</strong> Add your Cloudinary <code>cloudName</code> and{" "}
            <code>uploadPreset</code> in <code>src/config/appConfig.js</code> to enable direct photo and file uploads!
          </div>
        </div>
      )}

      {/* Top Profile Header Card with Avatar Upload */}
      <div
        className="card card-body"
        style={{
          marginBottom: "var(--space-6)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-6)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 800,
              fontSize: "var(--font-size-2xl)",
              overflow: "hidden",
              border: "3px solid var(--color-border)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              userProfile?.fullName?.[0]?.toUpperCase() || "U"
            )}
          </div>

          <label
            htmlFor="avatar-upload"
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              background: "var(--color-primary)",
              color: "white",
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: uploadingAvatar ? "wait" : "pointer",
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
              transition: "transform 0.2s",
            }}
            title="Upload photo via Cloudinary"
          >
            {uploadingAvatar ? <RefreshCw size={16} className="spin" /> : <Camera size={16} />}
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
            disabled={uploadingAvatar}
          />
        </div>

        <div style={{ flex: 1, minWidth: "220px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <h3 style={{ fontWeight: 700, fontSize: "var(--font-size-xl)", margin: 0 }}>
              {userProfile?.fullName || "User"}
            </h3>
            {isAdmin && <ShieldCheck size={20} color="var(--color-primary)" title="Master Administrator" />}
          </div>
          <div style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginTop: "4px" }}>
            {currentUser?.email}
          </div>
          <div style={{ marginTop: "var(--space-2)", display: "flex", gap: "var(--space-2)" }}>
            <span
              className={`badge ${
                isAdmin ? "badge-danger" : userProfile?.role === "officer" ? "badge-warning" : "badge-primary"
              }`}
              style={{ textTransform: "capitalize", fontWeight: "bold" }}
            >
              {isAdmin ? "Master Super Admin" : userProfile?.role || "Student Client"}
            </span>
            <span className="badge badge-success">Active Account</span>
          </div>
        </div>
      </div>

      {/* Avatar Notification Message */}
      {avatarMsg.text && (
        <div
          className={`alert ${
            avatarMsg.type === "error"
              ? "alert-error"
              : avatarMsg.type === "info"
              ? "alert-info"
              : "alert-success"
          }`}
          style={{ marginBottom: "var(--space-6)" }}
        >
          <AlertCircle size={18} /> {avatarMsg.text}
        </div>
      )}

      {/* Section 1: Personal & Academic Details */}
      <div className="card card-body" style={{ marginBottom: "var(--space-6)" }}>
        <h3 style={{ fontSize: "var(--font-size-md)", fontWeight: "bold", marginBottom: "var(--space-4)" }}>
          Personal & Academic Profile
        </h3>

        {profileMsg.text && (
          <div
            className={`alert ${profileMsg.type === "error" ? "alert-error" : "alert-success"}`}
            style={{ marginBottom: "var(--space-4)" }}
          >
            {profileMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmitProfile}>
          {/* Readonly Email Row */}
          <div className="form-group" style={{ marginBottom: "var(--space-4)" }}>
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Mail size={15} /> Registered Email Address (Account Identifier)
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                className="form-input"
                value={currentUser?.email || ""}
                disabled
                style={{
                  background: "var(--color-bg)",
                  color: "var(--color-text-secondary)",
                  cursor: "not-allowed",
                  paddingRight: "100px",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Lock size={12} /> Permanent
              </span>
            </div>
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "4px", display: "block" }}>
              Email address serves as your verified student identifier and cannot be modified.
            </span>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                name="fullName"
                type="text"
                className="form-input"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                name="phone"
                type="tel"
                className="form-input"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "var(--space-4)" }}>
            <label className="form-label">College / Institution</label>
            <input
              name="college"
              type="text"
              className="form-input"
              value={form.college}
              onChange={handleChange}
              placeholder="e.g. M. Kumarasamy College of Engineering, Karur"
            />
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Department</label>
              <select name="department" className="form-select" value={form.department} onChange={handleChange}>
                <option value="">Select Branch</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Year of Study</label>
              <select name="year" className="form-select" value={form.year} onChange={handleChange}>
                <option value="">Select Year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Register / Roll No</label>
              <input
                name="registerNumber"
                type="text"
                className="form-input"
                value={form.registerNumber}
                onChange={handleChange}
                placeholder="e.g. 927621104001"
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-5)" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving Changes..." : "Save Details"}
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Password Security & Login Settings */}
      <div className="card card-body">
        <h3 style={{ fontSize: "var(--font-size-md)", fontWeight: "bold", marginBottom: "var(--space-2)" }}>
          Security & Password
        </h3>
        <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
          Update your account login password or send a secure reset link to your email.
        </p>

        {passwordMsg.text && (
          <div
            className={`alert ${passwordMsg.type === "error" ? "alert-error" : "alert-success"}`}
            style={{ marginBottom: "var(--space-4)" }}
          >
            {passwordMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--color-text-tertiary)",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "var(--space-3)",
            }}
          >
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleSendResetEmail}
              disabled={changingPassword}
            >
              <KeyRound size={14} /> Send Password Reset Email
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={changingPassword || !newPassword}
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
