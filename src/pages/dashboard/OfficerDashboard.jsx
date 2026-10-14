import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, FolderOpen, Send, Users, MessageSquare, User } from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";
import OfficerHome from "./officer/OfficerHome";
import OfficerRequests from "./officer/OfficerRequests";
import OfficerClients from "./officer/OfficerClients";
import OfficerProfile from "./officer/OfficerProfile";

const OFFICER_NAV = [
  { to: "/officer", end: true, icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { section: "Work" },
  { to: "/officer/requests", icon: <Send size={18} />, label: "Requests" },
  { to: "/officer/projects", icon: <FolderOpen size={18} />, label: "Projects" },
  { section: "People" },
  { to: "/officer/clients", icon: <Users size={18} />, label: "Clients" },
  { section: "Account" },
  { to: "/officer/profile", icon: <User size={18} />, label: "Profile" },
];

export default function OfficerDashboard() {
  const { userProfile } = useAuth();
  return (
    <DashboardLayout navItems={OFFICER_NAV} title="Officer Portal" subtitle={`Welcome, ${userProfile?.fullName?.split(" ")[0] || "Officer"}`}>
      <Routes>
        <Route index element={<OfficerHome />} />
        <Route path="requests" element={<OfficerRequests />} />
        <Route path="projects" element={<OfficerRequests />} />
        <Route path="clients" element={<OfficerClients />} />
        <Route path="profile" element={<OfficerProfile />} />
        <Route path="*" element={<Navigate to="/officer" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
