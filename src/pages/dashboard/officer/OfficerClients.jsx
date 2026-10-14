import React, { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { getAllUsers } from "../../../services/adminService";

export default function OfficerClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllUsers("client").then(setClients).catch(() => setClients([])).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: "var(--font-size-xl)", marginBottom: "var(--space-6)" }}>Clients</h2>
      {loading ? (
        <div className="flex-center" style={{ minHeight: 200 }}><div className="spinner spinner-primary" /></div>
      ) : clients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Users size={28} /></div>
          <h3>No clients yet</h3>
          <p>Registered clients will appear here.</p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Year</th><th>Joined</th></tr></thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.fullName}</td>
                    <td style={{ color: "var(--color-text-secondary)" }}>{c.email}</td>
                    <td>{c.department || "—"}</td>
                    <td>{c.year || "—"}</td>
                    <td style={{ color: "var(--color-text-secondary)" }}>
                      {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString("en-IN") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
