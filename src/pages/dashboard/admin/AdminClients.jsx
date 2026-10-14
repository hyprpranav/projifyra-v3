import React, { useEffect, useState } from "react";
import {
  Users, Search, UserX, UserCheck, Shield, AlertCircle, RefreshCw,
  Trash2, CheckCircle2
} from "lucide-react";
import {
  getAllUsers,
  setUserActive,
  setUserRole,
  approveClient,
  deleteUserById,
  deleteAllUsersByRole
} from "../../../services/adminService";
import SecurityPinModal from "../../../components/common/SecurityPinModal";

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [loading, setLoading] = useState(true);
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

  const loadClients = async () => {
    setLoading(true);
    try {
      const all = await getAllUsers();
      // Filter for clients (exclude admin and officer)
      const clientList = all.filter(
        (u) => u.role === "client" || (!u.role && u.role !== "admin" && u.role !== "officer")
      );
      setClients(clientList);
      setFilteredClients(clientList);
    } catch (err) {
      setMsg({ text: "Failed to load clients: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    let result = clients;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.fullName?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.college?.toLowerCase().includes(term) ||
          c.registerNumber?.toLowerCase().includes(term) ||
          c.department?.toLowerCase().includes(term)
      );
    }
    if (deptFilter !== "all") {
      result = result.filter((c) => c.department === deptFilter);
    }
    setFilteredClients(result);
  }, [searchTerm, deptFilter, clients]);

  const handleToggleActive = async (uid, currentActive) => {
    setActionLoading(uid);
    try {
      await setUserActive(uid, !currentActive);
      setClients((prev) =>
        prev.map((c) => (c.id === uid ? { ...c, active: !currentActive } : c))
      );
      setMsg({ text: `User account status updated successfully.`, type: "success" });
    } catch (err) {
      setMsg({ text: "Failed to update user status: " + err.message, type: "error" });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMsg({ text: "", type: "" }), 3000);
    }
  };

  const handleApproveClient = async (uid, name) => {
    setActionLoading(uid);
    try {
      await approveClient(uid);
      setClients((prev) =>
        prev.map((c) => (c.id === uid ? { ...c, approvalStatus: "approved", active: true } : c))
      );
      setMsg({ text: `Client ${name || "account"} approved and activated successfully! They can now log in.`, type: "success" });
    } catch (err) {
      setMsg({ text: "Failed to approve client: " + err.message, type: "error" });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMsg({ text: "", type: "" }), 3000);
    }
  };

  const handlePromoteToOfficer = async (uid, name) => {
    if (!window.confirm(`Are you sure you want to promote ${name || "this user"} to Officer role?`)) {
      return;
    }
    setActionLoading(uid);
    try {
      await setUserRole(uid, "officer");
      setClients((prev) => prev.filter((c) => c.id !== uid));
      setMsg({ text: `Promoted ${name} to Officer successfully.`, type: "success" });
    } catch (err) {
      setMsg({ text: "Failed to promote user: " + err.message, type: "error" });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMsg({ text: "", type: "" }), 3000);
    }
  };

  // Open PIN Modal for single client deletion
  const promptDeleteClient = (uid, name) => {
    setPinModal({
      isOpen: true,
      title: `Delete Client: ${name}`,
      description: `This will permanently delete student client "${name}" from the database. Enter the 6-digit Secret PIN to authorize.`,
      actionType: "delete_single",
      targetId: uid,
      targetName: name,
    });
  };

  // Open PIN Modal for all clients deletion
  const promptDeleteAllClients = () => {
    setPinModal({
      isOpen: true,
      title: "Delete All Clients",
      description: "DANGER: This will delete ALL registered student client accounts from the platform. Enter the 6-digit Secret PIN to authorize.",
      actionType: "delete_all",
      targetId: null,
      targetName: "All Clients",
    });
  };

  // Execute deletion once PIN is verified
  const handlePinConfirmed = async (pin) => {
    if (pinModal.actionType === "delete_single") {
      await deleteUserById(pinModal.targetId, pin);
      setMsg({ text: `Deleted client "${pinModal.targetName}" successfully.`, type: "success" });
    } else if (pinModal.actionType === "delete_all") {
      await deleteAllUsersByRole("client", pin);
      setMsg({ text: "All client accounts have been completely deleted.", type: "success" });
    }
    loadClients();
    setTimeout(() => setMsg({ text: "", type: "" }), 5000);
  };

  const departments = Array.from(new Set(clients.map((c) => c.department).filter(Boolean)));

  return (
    <div className="admin-clients">
      {msg.text && (
        <div className={`alert ${msg.type === "error" ? "alert-error" : "alert-success"}`} style={{ marginBottom: "var(--space-4)" }}>
          {msg.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
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
              placeholder="Search by name, email, register no, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: "180px", height: "42px" }}
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-outline btn-sm" onClick={loadClients} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button
            className="btn btn-outline btn-sm"
            style={{ color: "#DC2626", borderColor: "rgba(220, 38, 38, 0.4)" }}
            onClick={promptDeleteAllClients}
          >
            <Trash2 size={14} /> Delete All Clients (PIN)
          </button>
        </div>
      </div>

      {/* Clients Data Table */}
      <div className="data-table-wrap">
        <div className="data-table-header">
          <div>
            <h3>Registered Students & Clients ({filteredClients.length})</h3>
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
              Manage student accounts, academic profiles, access permissions, and roles.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
            Loading clients directory...
          </div>
        ) : filteredClients.length === 0 ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-secondary)" }}>
            No clients found matching the query.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client Name & Reg No</th>
                  <th>Contact Info</th>
                  <th>Academic Info</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const isActive = client.active !== false;
                  return (
                    <tr key={client.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: "var(--color-primary)",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "bold",
                              fontSize: "14px",
                              flexShrink: 0,
                            }}
                          >
                            {client.fullName?.[0]?.toUpperCase() || "C"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--color-text)" }}>
                              {client.fullName || "Unnamed Student"}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                              Reg: <strong>{client.registerNumber || "—"}</strong>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "13px", color: "var(--color-text)" }}>
                          {client.email}
                        </div>
                        {client.phone && (
                          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                            {client.phone}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: "13px", fontWeight: 600 }}>
                          {client.department || "General"}
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                          {client.college || "MKCE"} {client.year ? `• Year ${client.year}` : ""}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          client.approvalStatus === "pending"
                            ? "badge-warning"
                            : isActive
                            ? "badge-success"
                            : "badge-danger"
                        }`}>
                          {client.approvalStatus === "pending" ? "Under Review" : isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                        {client.createdAt?.toDate ? client.createdAt.toDate().toLocaleDateString("en-IN") : "Active"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {client.approvalStatus === "pending" && (
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              style={{ background: "#10B981", borderColor: "#10B981", color: "#fff" }}
                              onClick={() => handleApproveClient(client.id, client.fullName)}
                              disabled={actionLoading === client.id}
                              title="Approve Client Account & Activate Dashboard Access"
                            >
                              <UserCheck size={13} /> Approve
                            </button>
                          )}

                          <button
                            type="button"
                            className={`btn btn-sm ${isActive ? "btn-outline" : "btn-primary"}`}
                            onClick={() => handleToggleActive(client.id, isActive)}
                            disabled={actionLoading === client.id}
                            title={isActive ? "Deactivate account" : "Re-activate account"}
                          >
                            {isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                            {isActive ? "Suspend" : "Activate"}
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handlePromoteToOfficer(client.id, client.fullName)}
                            disabled={actionLoading === client.id}
                            title="Promote to Officer"
                          >
                            <Shield size={13} /> Officer
                          </button>

                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: "#DC2626" }}
                            onClick={() => promptDeleteClient(client.id, client.fullName || client.email)}
                            title="Delete Client with PIN"
                          >
                            <Trash2 size={14} />
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
