import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  LayoutDashboard, FolderOpen, Send, ShoppingBag, Star, User, MessageSquare,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";

// Sub-pages (lazy-style inline components or separate files)
import ClientHome from "./client/ClientHome";
import ClientProjects from "./client/ClientProjects";
import ClientRequests from "./client/ClientRequests";
import ClientOrders from "./client/ClientOrders";
import ClientReviews from "./client/ClientReviews";
import ClientProfile from "./client/ClientProfile";

const CLIENT_NAV = [
  { to: "/dashboard", end: true, icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { section: "Projects" },
  { to: "/dashboard/projects", icon: <FolderOpen size={18} />, label: "Browse Projects" },
  { to: "/dashboard/requests", icon: <Send size={18} />, label: "My Requests" },
  { to: "/dashboard/orders", icon: <ShoppingBag size={18} />, label: "My Orders" },
  { section: "Account" },
  { to: "/dashboard/reviews", icon: <Star size={18} />, label: "Reviews" },
  { to: "/dashboard/profile", icon: <User size={18} />, label: "Profile" },
];

function usePageTitle(route) {
  const titles = {
    "/dashboard": "Dashboard",
    "/dashboard/projects": "Browse Projects",
    "/dashboard/requests": "My Requests",
    "/dashboard/orders": "My Orders",
    "/dashboard/reviews": "Reviews",
    "/dashboard/profile": "Profile",
  };
  return titles[route] || "Dashboard";
}

export default function ClientDashboard() {
  const { userProfile } = useAuth();
  const firstName = typeof userProfile?.fullName === "string" && userProfile.fullName.trim()
    ? userProfile.fullName.trim().split(" ")[0]
    : "Student";
  const subtitle = `Welcome, ${firstName}`;

  return (
    <DashboardLayout navItems={CLIENT_NAV} title={title} subtitle={subtitle}>
      <Routes>
        <Route index element={<ClientHome />} />
        <Route path="projects" element={<ClientProjects />} />
        <Route path="requests" element={<ClientRequests />} />
        <Route path="orders" element={<ClientOrders />} />
        <Route path="reviews" element={<ClientReviews />} />
        <Route path="profile" element={<ClientProfile />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
