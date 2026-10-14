import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FolderOpen, Send, ShoppingBag, Star, User, MessageSquare,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";
import { getClientRequests, getClientOrders } from "../../services/orderService";
import { getClientReviews } from "../../services/reviewService";

// Sub-pages (lazy-style inline components or separate files)
import ClientHome from "./client/ClientHome";
import ClientProjects from "./client/ClientProjects";
import ClientRequests from "./client/ClientRequests";
import ClientOrders from "./client/ClientOrders";
import ClientReviews from "./client/ClientReviews";
import ClientProfile from "./client/ClientProfile";

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
  const { userProfile, currentUser } = useAuth();
  const location = useLocation();
  const title = usePageTitle(location.pathname);
  const firstName = typeof userProfile?.fullName === "string" && userProfile.fullName.trim()
    ? userProfile.fullName.trim().split(" ")[0]
    : "Student";
  const subtitle = `Welcome, ${firstName}`;

  const [counts, setCounts] = useState({
    requests: 0,
    orders: 0,
    reviews: 0,
  });

  useEffect(() => {
    let isMounted = true;
    if (!currentUser?.uid) return;

    async function fetchClientCounts() {
      try {
        const [reqs, ords, revs] = await Promise.all([
          getClientRequests(currentUser.uid, currentUser.email).catch(() => []),
          getClientOrders(currentUser.uid, currentUser.email).catch(() => []),
          getClientReviews(currentUser.uid, currentUser.email).catch(() => []),
        ]);

        if (!isMounted) return;

        setCounts({
          requests: reqs.length,
          orders: ords.length,
          reviews: revs.length,
        });
      } catch (err) {
        console.warn("Could not load client counts:", err);
      }
    }

    fetchClientCounts();
    return () => { isMounted = false; };
  }, [currentUser?.uid, currentUser?.email]);

  const clientNav = [
    { to: "/dashboard", end: true, icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { section: "Projects" },
    { to: "/dashboard/projects", icon: <FolderOpen size={18} />, label: "Browse Projects" },
    { to: "/dashboard/requests", icon: <Send size={18} />, label: "My Requests", badge: counts.requests },
    { to: "/dashboard/orders", icon: <ShoppingBag size={18} />, label: "My Orders", badge: counts.orders, badgeColor: "badge-purple" },
    { section: "Account" },
    { to: "/dashboard/reviews", icon: <Star size={18} />, label: "Reviews", badge: counts.reviews, badgeColor: "badge-amber" },
    { to: "/dashboard/profile", icon: <User size={18} />, label: "Profile" },
  ];

  return (
    <DashboardLayout navItems={clientNav} title={title} subtitle={subtitle}>
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
