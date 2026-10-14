import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, FolderOpen, Send, Users, User } from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";
import { getAllRequests, ORDER_STATUS } from "../../services/orderService";
import OfficerHome from "./officer/OfficerHome";
import OfficerRequests from "./officer/OfficerRequests";
import OfficerClients from "./officer/OfficerClients";
import OfficerProfile from "./officer/OfficerProfile";

export default function OfficerDashboard() {
  const { userProfile, currentUser } = useAuth();
  const [counts, setCounts] = useState({ requests: 0, projects: 0 });

  useEffect(() => {
    let isMounted = true;
    async function fetchCounts() {
      try {
        const reqs = await getAllRequests();
        if (!isMounted) return;

        // Open requests for bidding
        const openReqs = reqs.filter(
          (r) => r.status === ORDER_STATUS.UNDER_REVIEW || r.status === ORDER_STATUS.OFFICER_PROPOSED
        ).length;

        // Assigned to this officer or team
        const myProjects = reqs.filter(
          (r) =>
            (r.assignedOfficer === currentUser?.uid || r.assignedOfficer === "Team") &&
            (r.status === ORDER_STATUS.APPROVED || r.status === ORDER_STATUS.IN_PROGRESS || r.status === ORDER_STATUS.TESTING)
        ).length;

        setCounts({ requests: openReqs, projects: myProjects });
      } catch (err) {
        console.warn("Could not load officer counts:", err);
      }
    }
    fetchCounts();
    return () => { isMounted = false; };
  }, [currentUser?.uid]);

  const officerNav = [
    { to: "/officer", end: true, icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { section: "Work" },
    { to: "/officer/requests", icon: <Send size={18} />, label: "Requests", badge: counts.requests },
    { to: "/officer/projects", icon: <FolderOpen size={18} />, label: "Projects", badge: counts.projects, badgeColor: "badge-purple" },
    { section: "People" },
    { to: "/officer/clients", icon: <Users size={18} />, label: "Clients" },
    { section: "Account" },
    { to: "/officer/profile", icon: <User size={18} />, label: "Profile" },
  ];

  return (
    <DashboardLayout
      navItems={officerNav}
      title="Officer Portal"
      subtitle={`Welcome, ${userProfile?.fullName?.split(" ")[0] || "Officer"}`}
    >
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
