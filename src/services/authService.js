// ============================================================
// PROJIFYRA 3.1 — Authentication Service
// ============================================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { MAIN_ADMIN_EMAIL } from "../config/appConfig";

// --- REGISTER ---
export async function registerClient(userData) {
  const { email, password, fullName, phone, college, department, year, registerNumber } = userData;

  // Create Firebase Auth user (password is managed by Firebase — never stored in Firestore)
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Update display name
  await updateProfile(user, { displayName: fullName });

  // Determine role (case-insensitive check for Master Super Admin)
  const isMasterAdmin = email?.trim().toLowerCase() === MAIN_ADMIN_EMAIL.trim().toLowerCase();
  const role = isMasterAdmin ? "admin" : "client";

  // Store user profile in Firestore (NO password field)
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    fullName: fullName || (isMasterAdmin ? "Master Admin (hyprpranav)" : "User"),
    email: email.trim().toLowerCase(),
    phone: phone || "",
    college: college || "",
    department: department || "",
    year: year || "",
    registerNumber: registerNumber || "",
    role,
    approvalStatus: isMasterAdmin ? "approved" : "pending",
    active: isMasterAdmin ? true : false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Log activity
  await logActivity("client_registered", `User registered (pending idea approval): ${fullName} (${email}) [role: ${role}]`, user.uid);

  return { user, role };
}

// --- REGISTER OFFICER (Submitted to Admin Desk for Approval) ---
export async function registerOfficer(officerData) {
  const { email, password, fullName, phone, department, specialization } = officerData;

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  await updateProfile(user, { displayName: fullName });

  // Stored in Firestore as officer with approvalStatus: "pending" and active: false
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    fullName,
    email,
    phone: phone || "",
    department: department || "",
    specialization: specialization || "",
    role: "officer",
    approvalStatus: "pending", // Requires Super Admin approval!
    active: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Log activity
  await logActivity("officer_registered", `Officer application submitted: ${fullName} (${email})`, user.uid);

  // Sign out immediately so pending officer cannot access portal before approval
  await signOut(auth);

  return { user };
}

// --- LOGIN ---
export async function loginUser(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user = credential.user;
  const isMasterAdmin = user.email?.trim().toLowerCase() === MAIN_ADMIN_EMAIL.trim().toLowerCase();

  // Fetch role from Firestore
  let userDoc = await getDoc(doc(db, "users", user.uid));
  
  if (!userDoc.exists()) {
    // If master admin signs in without previous Firestore doc, auto-bootstrap it
    if (isMasterAdmin) {
      const adminData = {
        uid: user.uid,
        fullName: "Master Admin (hyprpranav)",
        email: user.email,
        role: "admin",
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", user.uid), adminData);
      return { user, userData: adminData };
    }
    throw new Error("User profile not found. Please register or contact support.");
  }

  let userData = userDoc.data();

  // Auto-upgrade master admin role if not set
  if (isMasterAdmin && userData.role !== "admin") {
    userData.role = "admin";
    await updateDoc(doc(db, "users", user.uid), { role: "admin", updatedAt: serverTimestamp() });
  }

  // Officer specific approval checks (master admin is exempted)
  if (userData.role === "officer" && !isMasterAdmin) {
    if (userData.approvalStatus === "pending") {
      await signOut(auth);
      throw new Error("Your officer application is currently pending Admin verification. You will be able to log in once approved by the Super Admin.");
    }
    if (userData.approvalStatus === "rejected") {
      await signOut(auth);
      throw new Error("Your officer application was not approved by the Admin Desk.");
    }
    if (userData.active === false) {
      await signOut(auth);
      throw new Error("Your officer account has been deactivated. Please contact the Admin Desk.");
    }
  }

  // Client specific approval checks (master admin is exempted)
  if ((userData.role === "client" || (!userData.role && !isMasterAdmin)) && !isMasterAdmin) {
    if (userData.approvalStatus === "pending" || userData.active === false) {
      await signOut(auth);
      throw new Error("Your project idea is currently Under Review. Your account will be activated once your idea is approved by the Admin Desk.");
    }
    if (userData.approvalStatus === "rejected") {
      await signOut(auth);
      throw new Error("Your project request was not approved. Please contact PROJIFYRA support.");
    }
  }

  if (!userData.active && !isMasterAdmin) {
    await signOut(auth);
    throw new Error("Your account has been deactivated. Please contact PROJIFYRA support.");
  }

  return { user, userData };
}

// --- LOGOUT ---
export async function logoutUser() {
  await signOut(auth);
}

// --- GET USER PROFILE ---
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data();
}

// --- UPDATE USER PROFILE ---
export async function updateUserProfile(uid, updates) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
}

// --- UPDATE USER AVATAR (Cloudinary Photo URL) ---
export async function updateUserAvatar(uid, photoURL) {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { photoURL });
  }
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { photoURL, updatedAt: serverTimestamp() });
}

// --- CHANGE PASSWORD ---
export async function changeUserPassword(newPassword) {
  if (!auth.currentUser) throw new Error("No active user session.");
  await updatePassword(auth.currentUser, newPassword);
}

// --- SEND PASSWORD RESET EMAIL ---
export async function sendResetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

// --- AUTH STATE LISTENER ---
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// --- FRIENDLY ERROR MESSAGES ---
export function friendlyAuthError(error) {
  const code = error?.code || "";
  const map = {
    "auth/email-already-in-use": "An account with this email already exists. Please log in.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/too-many-requests": "Too many failed attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Please check your connection.",
    "auth/invalid-credential": "Invalid email or password. Please try again.",
    "auth/user-disabled": "This account has been disabled.",
  };
  return map[code] || error?.message || "An unexpected error occurred. Please try again.";
}

// --- ACTIVITY LOG HELPER ---
async function logActivity(type, message, userId = null) {
  try {
    await addDoc(collection(db, "activityLogs"), {
      type,
      message,
      userId,
      timestamp: serverTimestamp(),
    });
  } catch {
    // Non-blocking — don't crash on log failure
  }
}
