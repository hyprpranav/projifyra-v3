// ============================================================
// PROJIFYRA 3.1 — Firebase Initialization (Single Instance)
// ============================================================

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { FIREBASE_CONFIG } from "../config/appConfig";

// Initialize primary Firebase app (singleton — called once)
const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();

// Export auth, db, storage instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Secondary Firebase instance helper for isolated account creation
// (Prevents auto-login on primary auth, so users/applicants don't get routed away while viewing confirmation screens)
export function getSecondaryFirebase() {
  const secondaryAppName = "projifyraSecondaryAuth";
  const existingApp = getApps().find((a) => a.name === secondaryAppName);
  const secondaryApp = existingApp || initializeApp(FIREBASE_CONFIG, secondaryAppName);
  return {
    app: secondaryApp,
    auth: getAuth(secondaryApp),
    db: getFirestore(secondaryApp),
  };
}

export function getSecondaryAuth() {
  return getSecondaryFirebase().auth;
}

export default app;
