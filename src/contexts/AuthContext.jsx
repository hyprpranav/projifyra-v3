// ============================================================
// PROJIFYRA 3.1 — Auth Context
// ============================================================

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange, getUserProfile } from "../services/authService";
import { MAIN_ADMIN_EMAIL } from "../config/appConfig";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        try {
          const profile = await getUserProfile(firebaseUser.uid, firebaseUser.email);
          setUserProfile(profile || {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            fullName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Student",
            role: "client",
            active: true,
            approvalStatus: "approved",
          });
        } catch {
          setUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            fullName: firebaseUser.displayName || "Student",
            role: "client",
            active: true,
            approvalStatus: "approved",
          });
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  const isMasterAdmin = currentUser?.email?.trim().toLowerCase() === MAIN_ADMIN_EMAIL.trim().toLowerCase();
  const activeRole = isMasterAdmin ? "admin" : (userProfile?.role || (currentUser ? "client" : null));

  const value = {
    currentUser,
    userProfile,
    authLoading,
    role: activeRole,
    isAdmin: activeRole === "admin",
    isOfficer: activeRole === "officer",
    isClient: activeRole === "client",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
