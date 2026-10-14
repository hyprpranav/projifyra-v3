// ============================================================
// PROJIFYRA 3.1 — Firebase Initialization (Single Instance)
// ============================================================

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { FIREBASE_CONFIG } from "../config/appConfig";

// Initialize Firebase app (singleton — called once)
const app = initializeApp(FIREBASE_CONFIG);

// Export auth, db, storage instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
