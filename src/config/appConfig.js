// ============================================================
// PROJIFYRA 3.1 — Firebase Configuration
// ============================================================
// IMPORTANT: Replace the values below with your actual Firebase
// project credentials from the Firebase Console.
// https://console.firebase.google.com/
// ============================================================

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAqkNgnr_mEmxSiisvZXA0atmkIvfokb8E",
  authDomain: "projifyra-site.firebaseapp.com",
  projectId: "projifyra-site",
  storageBucket: "projifyra-site.firebasestorage.app",
  messagingSenderId: "850363712905",
  appId: "1:850363712905:web:484391992b32b6ea69cd58",
};

// ============================================================
// PROJIFYRA 3.1 — Application Configuration
// ============================================================

// Google Form URL for project submissions (optional fallback)
// Replace with your actual Google Form URL if you use one
export const PROJECT_REQUEST_FORM_URL = "YOUR_GOOGLE_FORM_URL";

// Main Admin email — this email gets the 'admin' role on first sign-up
// Master Super Admin account
export const MAIN_ADMIN_EMAIL = "hyprpranav@gmail.com";

// Contact details
export const CONTACT_EMAIL = "projifyra@gmail.com";
export const COLLEGE_NAME = "M. Kumarasamy College of Engineering, Karur";

// ============================================================
// Cloudinary Configuration (For Profile Photos & Project Files)
// ============================================================
// Replace with your Cloud Name & Unsigned Upload Preset
export const CLOUDINARY_CONFIG = {
  cloudName: "pexlucgy",
  uploadPreset: "projifyra_preset",
};

// Platform version
export const APP_VERSION = "3.1";
export const APP_NAME = "PROJIFYRA";

// Master 6-Digit Security PIN for Deletions (Single user, client, officer, or system database)
export const MASTER_SECURITY_PIN = "927624";
