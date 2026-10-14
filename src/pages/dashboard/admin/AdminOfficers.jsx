import React, { useEffect, useState } from "react";
import {
  ShieldCheck, UserPlus, UserMinus, AlertCircle, RefreshCw, Mail,
  CheckCircle2, Clock, Check, X, Trash2, ShieldAlert, Award
} from "lucide-react";
import {
  getAllUsers,
  setUserRole,
  approveOfficer,
  rejectOfficer,
  deleteUserById,
  deleteAllUsersByRole
} from "../../../services/adminService";
import { getAllRequests } from "../../../services/orderService";
import SecurityPinModal from "../../../components/common/SecurityPinModal";

export default function AdminOfficers() {
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "active"
  const [officers, setOfficers] = useState([]);
  const [pendingOfficers, setPendingOfficers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });

  // Security PIN Modal State
  const [pinModal, setPinModal] = useState({
    isOpen: false,
    title: "",
    description: "",
    actionType: "", // "delete_single" | "delete_all"
    targetId: null,
    targetName: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [users, reqs] = await Promise.all([getAllUsers(), getAllRequests()]);
      setAllUsers(users);

      // Separate pending vs approved officers
      const pending = users.filter(
        (u) => u.role === "officer" && (u.approvalStatus === "pending" || u.active === false)
      );
      const active = users.filter(
        (u) => u.role === "officer" && u.approvalStatus === "approved" && u.active !== false
      );

      setPendingOfficers(pending);
      setOfficers(active);
      setRequests(reqs);

      // Auto switch to active tab if no pending applications
      if (pending.length === 0 && active.length > 0) {
        setActiveTab("active");
      }
    } catch (err) {
      setMsg({ text: "Failed to load officers: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Approve Officer
  const handleApprove = async (uid, name) => {
    setActionLoading(uid);
    try {
      await approveOfficer(uid);
      setMsg({ text: `Officer ${name} approved successfully! They can now log in and take projects.`, type: "success" });
      loadData();
    } catch (err) {
      setMsg({ text: "Approval failed: " + err.message, type: "error" });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMsg({ text: "", type: "" }), 5000);
    }
  };

  // Handle Reject Officer
  const handleReject = async (uid, name) => {
    setActionLoading(uid);
    try {
      await rejectOfficer(uid);
      setMsg({ text: `Officer application for ${name} has been rejected.`, type: "info" });
      loadData();
    } catch (err) {
      setMsg({ text: "Rejection failed: " + err.message, type: "error" });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMsg({ text: "", type: "" }), 5000);
    }
  };

  // Open PIN Modal for single deletion
  const promptDeleteOfficer = (uid, name) => {
    setPinModal({
      isOpen: true,
      title: `Delete Officer: ${name}`,
      description: `This will completely cancel and remove ${name}'s account from the database. Enter the 6-digit Secret PIN to authorize.`,
      actionType: "delete_single",
      targetId: uid,
      targetName: name,
    });
  };

  // Open PIN Modal for bulk deletion
  const promptDeleteAllOfficers = () => {
    setPinModal({
      isOpen: true,
      title: "Delete All Officers",
      description: "DANGER: This will delete all registered officers from the platform (except Super Admin). Enter the 6-digit Secret PIN to authorize.",
      actionType: "delete_all",
      targetId: null,
      targetName: "All Officers",
    });
  };

  // Execute deletion once 6-digit PIN is verified
  const handlePinConfirmed = async (pin) => {
    if (pinModal.actionType === "delete_single") {
      await deleteUserById(pinModal.targetId, pin);
      setMsg({ text: `Successfully deleted ${pinModal.targetName} from database.`, type: "success" });
    } else if (pinModal.actionType === "delete_all") {
      await deleteAllUsersByRole("officer", pin);
      setMsg({ text: "All officer accounts have been completely deleted.", type: "success" });
    }
    loadData();
    setTimeout(() => setMsg({ text: "", type: "" }), 5000);
  };

  // Demote officer back to client
  const handleDemote = async (uid, name) => {
    if (!window.confirm(`Revoke officer access for ${name}? They will revert to standard client role.`)) {
      return;
    }
    setActionLoading(uid);
    try {
      await setUserRole(uid, "client");
      setMsg({ text: `Revoked officer privileges for ${name}.`, type: "success" });
      loadData();
    } catch (err) {
      setMsg({ text: "Failed to revoke: " + err.message, type: "error" });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMsg({ text: "", type: "" }), 4000);
    }
  };

  // Quick manual email promote
  const handleAssignOfficer = async (e) => {
    e.preventDefault();
    if (!selectedUserEmail.trim()) return;

    const targetUser = allUsers.find(
      (u) => u.email?.toLowerCase() === selectedUserEmail.trim().toLowerCase()
    );

    if (!targetUser) {
      setMsg({ text: `No user found with email "${selectedUserEmail}".`, type: "error" });
      return;
    }

    setActionLoading(targetUser.id);
    try {
      await approveOfficer(targetUser.id);
      setSelectedUserEmail("");
      setMsg({ text: `Assigned officer privileges to ${targetUser.fullName || targetUser.email}.`, type: "success" });
      loadData();
    } catch (err) {
      setMsg({ text: "Failed to assign: " + err.message, type: "error" });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMsg({ text: "", type: "" }), 4000);
    }
  };

  return (
    <div className="admin-officers">
      {msg.text && (
        <div className={`alert ${msg.type === "error" ? "alert-error" : msg.type === "info" ? "alert-info" : "alert-success"}`} style={{ marginBottom: "var(--space-4)" }}>
          {msg.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Header and Manual Assign Form */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-6)",
          marginBottom: "var(--space-6)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>
              Technical Officer Management & Applications
            </h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "4px" }}>
              Approve incoming officer registrations, assign leads, or delete accounts with Master PIN security.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-outline btn-sm" onClick={loadData} disabled={loading}>
              <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
            </button>
            <button
              className="btn btn-outline btn-sm"
              style={{ color: "#DC2626", borderColor: "rgba(220, 38, 38, 0.4)" }}
              onClick={promptDeleteAllOfficers}
            >
              <Trash2 size={14} /> Delete All Officers (PIN)
            </button>
          </div>
        </div>

        <form onSubmit={handleAssignOfficer} style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", maxWidth: "600px" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
            <Mail
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-tertiary)",
              }}
            />
            <input
              type="email"
              className="form-input"
              style={{ paddingLeft: "36px", height: "42px" }}
              placeholder="Directly promote existing user email..."
              value={selectedUserEmail}
              onChange={(e) => setSelectedUserEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" style={{ height: "42px" }} disabled={actionLoading}>
            <UserPlus size={16} /> Quick Promote
          </button>
        </form>
      </div>

      {/* Tabs: Pending Applications vs Active Officers */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "var(--space-4)" }}>
        <button
          onClick={() => setActiveTab("pending")}
          style={{
            padding: "10px 18px",
            borderRadius: "12px",
            border: `1.5px solid ${activeTab === "pending" ? "var(--color-primary)" : "var(--color-border)"}`,
            background: activeTab === "pending" ? "var(--color-primary-light)" : "var(--color-surface)",
            color: activeTab === "pending" ? "var(--color-primary)" : "var(--color-text)",
            fontWeight: 800,
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Clock size={16} />
          Pending Officer Requests
          {pendingOfficers.length > 0 && (
            <span className="badge badge-warning" style={{ fontSize: "11px", padding: "2px 8px" }}>
              {pendingOfficers.length} New
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("active")}
          style={{
            padding: "10px 18px",
            borderRadius: "12px",
            border: `1.5px solid ${activeTab === "active" ? "var(--color-primary)" : "var(--color-border)"}`,
            background: activeTab === "active" ? "var(--color-primary-light)" : "var(--color-surface)",
            color: activeTab === "active" ? "var(--color-primary)" : "var(--color-text)",
            fontWeight: 800,
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <ShieldCheck size={16} />
          Active Platform Officers ({officers.length})
        </button>
      </div>

      {/* TAB 1: PENDING OFFICER REQUESTS */}
      {activeTab === "pending" && (
        <div className="data-table-wrap">
          <div className="data-table-header">
            <div>
              <h3>Pending Officer Registration Applications ({pendingOfficers.length})</h3>
              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                Candidates who applied as Technical Officers. Review their credentials and approve, reject, or delete.
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
              Loading applications...
            </div>
          ) : pendingOfficers.length === 0 ? (
            <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
              No pending officer applications right now.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Email & Contact</th>
                    <th>Department & Specialization</th>
                    <th>Experience Notes</th>
                    <th>Applied Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOfficers.map((applicant) => (
                    <tr key={applicant.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: "var(--color-text)" }}>
                          {applicant.fullName || "Candidate"}
                        </div>
                        {applicant.approvalStatus === "rejected" ? (
                          <span className="badge" style={{ fontSize: "11px", marginTop: "2px", background: "rgba(239, 68, 68, 0.15)", color: "#EF4444", fontWeight: 700 }}>
                            Application Rejected
                          </span>
                        ) : (
                          <span className="badge badge-warning" style={{ fontSize: "11px", marginTop: "2px" }}>
                            Awaiting Approval
                          </span>
                        )}
                      </td>
                      <td>
                        <div>{applicant.email}</div>
                        <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{applicant.phone || "No phone"}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{applicant.specialization || "General Engineering"}</div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{applicant.department || "MKCE"}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: "12px", maxWidth: "250px", color: "var(--color-text-secondary)" }}>
                          {applicant.experienceNotes || "No notes provided"}
                        </div>
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        {applicant.createdAt?.toDate ? applicant.createdAt.toDate().toLocaleDateString("en-IN") : "Recent"}
                      </td>
                      <td>
                        {applicant.approvalStatus === "rejected" ? (
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => handleApprove(applicant.id, applicant.fullName || applicant.email)}
                              disabled={actionLoading === applicant.id}
                              title="Re-evaluate & Approve"
                            >
                              <Check size={14} /> Re-Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{ background: "#DC2626", color: "#fff", border: "none" }}
                              onClick={() => promptDeleteOfficer(applicant.id, applicant.fullName || applicant.email)}
                              title="Delete record & cancel email completely (Requires 6-Digit PIN)"
                            >
                              <Trash2 size={14} /> Delete & Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleApprove(applicant.id, applicant.fullName || applicant.email)}
                              disabled={actionLoading === applicant.id}
                              title="Approve officer"
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => handleReject(applicant.id, applicant.fullName || applicant.email)}
                              disabled={actionLoading === applicant.id}
                              title="Reject application"
                            >
                              <X size={14} /> Reject
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: "#DC2626" }}
                              onClick={() => promptDeleteOfficer(applicant.id, applicant.fullName || applicant.email)}
                              title="Delete permanently with PIN"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE OFFICERS */}
      {activeTab === "active" && (
        <div className="data-table-wrap">
          <div className="data-table-header">
            <div>
              <h3>Active Project Officers ({officers.length})</h3>
              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                Verified technical officers with permissions to view projects, propose costs, and update build progress.
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
              Loading active officers...
            </div>
          ) : officers.length === 0 ? (
            <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
              No active officers yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Officer</th>
                    <th>Email Address</th>
                    <th>Specialization / Dept</th>
                    <th>Active Projects</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {officers.map((officer) => {
                    const assignedCount = requests.filter(
                      (r) => r.assignedOfficer === officer.id || r.assignedOfficer === officer.email
                    ).length;

                    return (
                      <tr key={officer.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                background: "#7C3AED",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "bold",
                                fontSize: "14px",
                              }}
                            >
                              <ShieldCheck size={18} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: "var(--color-text)" }}>
                                {officer.fullName || "Officer"}
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                                {officer.phone || "No phone"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span>{officer.email}</span>
                        </td>
                        <td>
                          <span className="badge badge-primary">{officer.specialization || officer.department || "Engineering"}</span>
                        </td>
                        <td>
                          <span className="badge badge-info">{assignedCount} Assigned</span>
                        </td>
                        <td style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                          {officer.createdAt?.toDate ? officer.createdAt.toDate().toLocaleDateString("en-IN") : "Active"}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => handleDemote(officer.id, officer.fullName || officer.email)}
                              disabled={actionLoading === officer.id}
                              title="Revoke officer privileges"
                            >
                              <UserMinus size={14} /> Revoke
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: "#DC2626" }}
                              onClick={() => promptDeleteOfficer(officer.id, officer.fullName || officer.email)}
                              title="Delete officer with PIN"
                            >
                              <Trash2 size={14} /> Delete
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
      )}

      {/* Security PIN Authorization Modal (PIN: 927624) */}
      <SecurityPinModal
        isOpen={pinModal.isOpen}
        title={pinModal.title}
        description={pinModal.description}
        confirmLabel="Authorize Deletion"
        onConfirm={handlePinConfirmed}
        onClose={() => setPinModal({ ...pinModal, isOpen: false })}
      />
    </div>
  );
}
