import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { logoutUser } from "../../services/authService";
import "../../styles/dashboard.css";

export default function DashboardLayout({ children, navItems, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/");
  };

  const initials = userProfile?.fullName
    ? userProfile.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";
  const avatarUrl = userProfile?.photoURL || null;

  return (
    <div className="dashboard-shell">
      {/* Sidebar Overlay (mobile) */}
      <div
        className={`sidebar-overlay${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`} aria-label="Sidebar navigation">
        <div className="sidebar-brand">
          <img src="/logo.png" alt="PROJIFYRA" className="sidebar-brand-logo" />
          <div>
            <div className="sidebar-brand-name">PROJIFYRA</div>
            <div className="sidebar-brand-version">v3.1</div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar" style={{ overflow: "hidden" }} aria-hidden="true">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userProfile?.fullName || "User"}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              />
            ) : (
              initials
            )}
          </div>
          <div>
            <div className="sidebar-user-name">{userProfile?.fullName || "User"}</div>
            <div className="sidebar-user-role">{userProfile?.role || ""}</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          {navItems.map((item) =>
            item.section ? (
              <div key={item.section} className="sidebar-nav-section">{item.section}</div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `sidebar-nav-item${isActive ? " active" : ""}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-nav-item" onClick={handleLogout} aria-label="Logout">
            <LogOut size={18} className="nav-icon" aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div>
              <div className="dashboard-header-title">{title}</div>
              {subtitle && <div className="dashboard-header-subtitle">{subtitle}</div>}
            </div>
          </div>
          <div className="dashboard-header-right">
            <div className="sidebar-user-avatar" style={{ width: 36, height: 36, fontSize: "0.8rem", overflow: "hidden" }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userProfile?.fullName || "User"}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                />
              ) : (
                initials
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}
