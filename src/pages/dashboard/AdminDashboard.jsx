import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FolderOpen, Send, Star,
  ShoppingBag, BarChart3, Activity, UserCog, User,
  HelpCircle,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";
import { getAllRequests, getAllOrders, ORDER_STATUS } from "../../services/orderService";
import { getAllReviews } from "../../services/reviewService";
import { getAllUsers } from "../../services/adminService";
import { getAllIssues } from "../../services/issueService";
import AdminHome from "./admin/AdminHome";
import AdminClients from "./admin/AdminClients";
import AdminOfficers from "./admin/AdminOfficers";
import AdminProjects from "./admin/AdminProjects";
import AdminRequests from "./admin/AdminRequests";
import AdminOrders from "./admin/AdminOrders";
import AdminReviews from "./admin/AdminReviews";
import AdminIssues from "./admin/AdminIssues";
import AdminStats from "./admin/AdminStats";
import AdminLogs from "./admin/AdminLogs";
import AdminProfile from "./client/ClientProfile";

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  const [counts, setCounts] = useState({
    clients: 0,
    requests: 0,
    projects: 0,
    orders: 0,
    reviews: 0,
    issues: 0,
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchCounts() {
      try {
        const [reqs, ords, revs, clients, issuesList] = await Promise.all([
          getAllRequests().catch(() => []),
          getAllOrders().catch(() => []),
          getAllReviews().catch(() => []),
          getAllUsers("client").catch(() => []),
          getAllIssues().catch(() => []),
        ]);

        if (!isMounted) return;

        // Pending action requests (under review, proposed, or advance submitted)
        const pendingReqs = reqs.filter(
          (r) =>
            r.status === ORDER_STATUS.UNDER_REVIEW ||
            r.status === ORDER_STATUS.OFFICER_PROPOSED ||
            r.advancePaymentStatus === "Submitted"
        ).length;

        // Active ongoing projects (approved or in progress)
        const activeProjects = reqs.filter(
          (r) =>
            r.status === ORDER_STATUS.APPROVED ||
            r.status === ORDER_STATUS.IN_PROGRESS ||
            r.status === ORDER_STATUS.TESTING
        ).length;

        // Active orders
        const activeOrders = ords.filter(
          (o) => o.status === ORDER_STATUS.IN_PROGRESS || o.status === ORDER_STATUS.TESTING
        ).length;

        // Pending moderation reviews
        const pendingReviews = revs.filter((r) => !r.approved).length;

        // Open client support issues / chat messages
        const openIssues = issuesList.filter((i) => i.status === "open").length;

        setCounts({
          clients: clients.length,
          requests: pendingReqs || reqs.length,
          projects: activeProjects,
          orders: activeOrders,
          reviews: pendingReviews,
          issues: openIssues,
        });
      } catch (err) {
        console.warn("Could not load badge counts:", err);
      }
    }

    fetchCounts();
    return () => { isMounted = false; };
  }, []);

  const adminNav = [
    { to: "/admin", end: true, icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { section: "Management" },
    { to: "/admin/clients", icon: <Users size={18} />, label: "Clients", badge: counts.clients },
    { to: "/admin/officers", icon: <UserCog size={18} />, label: "Officers" },
    { section: "Projects" },
    { to: "/admin/projects", icon: <FolderOpen size={18} />, label: "Projects", badge: counts.projects, badgeColor: "badge-purple" },
    { to: "/admin/requests", icon: <Send size={18} />, label: "Requests", badge: counts.requests },
    { to: "/admin/orders", icon: <ShoppingBag size={18} />, label: "Orders", badge: counts.orders },
    { section: "Support & Reviews" },
    { to: "/admin/issues", icon: <HelpCircle size={18} />, label: "Client Issues", badge: counts.issues, badgeColor: "badge-amber" },
    { to: "/admin/reviews", icon: <Star size={18} />, label: "Reviews", badge: counts.reviews, badgeColor: "badge-amber" },
    { section: "Platform" },
    { to: "/admin/stats", icon: <BarChart3 size={18} />, label: "Statistics" },
    { to: "/admin/logs", icon: <Activity size={18} />, label: "Activity Logs" },
    { section: "Account" },
    { to: "/admin/profile", icon: <User size={18} />, label: "Profile & Settings" },
  ];

  return (
    <DashboardLayout navItems={adminNav} title="Admin Panel" subtitle="Main Administrator">
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="clients" element={<AdminClients />} />
        <Route path="officers" element={<AdminOfficers />} />
        <Route path="projects" element={<AdminProjects />} />
        <Route path="requests" element={<AdminRequests />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="issues" element={<AdminIssues />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="stats" element={<AdminStats />} />
        <Route path="logs" element={<AdminLogs />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
