import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FolderOpen, Send, Star,
  ShoppingBag, BarChart3, Activity, UserCog, PlusCircle,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";
import AdminHome from "./admin/AdminHome";
import AdminClients from "./admin/AdminClients";
import AdminOfficers from "./admin/AdminOfficers";
import AdminProjects from "./admin/AdminProjects";
import AdminRequests from "./admin/AdminRequests";
import AdminOrders from "./admin/AdminOrders";
import AdminReviews from "./admin/AdminReviews";
import AdminStats from "./admin/AdminStats";
import AdminLogs from "./admin/AdminLogs";
import AdminProfile from "./client/ClientProfile";
import { User } from "lucide-react";

const ADMIN_NAV = [
  { to: "/admin", end: true, icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { section: "Management" },
  { to: "/admin/clients", icon: <Users size={18} />, label: "Clients" },
  { to: "/admin/officers", icon: <UserCog size={18} />, label: "Officers" },
  { section: "Projects" },
  { to: "/admin/projects", icon: <FolderOpen size={18} />, label: "Projects" },
  { to: "/admin/requests", icon: <Send size={18} />, label: "Requests" },
  { to: "/admin/orders", icon: <ShoppingBag size={18} />, label: "Orders" },
  { section: "Platform" },
  { to: "/admin/reviews", icon: <Star size={18} />, label: "Reviews" },
  { to: "/admin/stats", icon: <BarChart3 size={18} />, label: "Statistics" },
  { to: "/admin/logs", icon: <Activity size={18} />, label: "Activity Logs" },
  { section: "Account" },
  { to: "/admin/profile", icon: <User size={18} />, label: "Profile & Settings" },
];

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  return (
    <DashboardLayout navItems={ADMIN_NAV} title="Admin Panel" subtitle="Main Administrator">
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="clients" element={<AdminClients />} />
        <Route path="officers" element={<AdminOfficers />} />
        <Route path="projects" element={<AdminProjects />} />
        <Route path="requests" element={<AdminRequests />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="stats" element={<AdminStats />} />
        <Route path="logs" element={<AdminLogs />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
