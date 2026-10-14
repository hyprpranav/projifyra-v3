// ============================================================
// PROJIFYRA 3.1 — Admin Service
// ============================================================

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { MASTER_SECURITY_PIN, MAIN_ADMIN_EMAIL } from "../config/appConfig";

// --- GET ALL USERS ---
export async function getAllUsers(role = null) {
  let q = collection(db, "users");
  if (role) {
    q = query(q, where("role", "==", role));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// --- DEACTIVATE / ACTIVATE USER ---
export async function setUserActive(uid, active) {
  await updateDoc(doc(db, "users", uid), { active, updatedAt: serverTimestamp() });
}

// --- SET USER ROLE (Admin sets officer role) ---
export async function setUserRole(uid, role) {
  await updateDoc(doc(db, "users", uid), { role, updatedAt: serverTimestamp() });
}

// --- GET ACTIVITY LOGS ---
export async function getActivityLogs(limitCount = 50) {
  const q = query(
    collection(db, "activityLogs"),
    orderBy("timestamp", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// --- GET PLATFORM STATS ---
export async function getPlatformStats() {
  try {
    const snap = await getDoc(doc(db, "platformStats", "global"));
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.warn("Could not fetch global platform stats:", err);
  }

  // Fallback to actual live Firestore counts (no dummy data)
  try {
    const [usersSnap, reqsSnap, ordsSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "projectRequests")),
      getDocs(collection(db, "orders")),
    ]);

    const completed = ordsSnap.docs.filter(
      (d) => d.data().status === "Completed" || d.data().stage === "Completed"
    ).length;
    const ongoing = reqsSnap.docs.filter(
      (d) => d.data().status === "Approved" || d.data().status === "In Progress"
    ).length;

    return {
      projectsCompleted: completed,
      clientsSupported: usersSnap.size,
      projectsOngoing: ongoing,
      projectsReceived: reqsSnap.size,
    };
  } catch (err) {
    return {
      projectsCompleted: 0,
      clientsSupported: 0,
      projectsOngoing: 0,
      projectsReceived: 0,
    };
  }
}

// --- UPDATE PLATFORM STATS (Admin) ---
export async function updatePlatformStats(updates) {
  try {
    const ref = doc(db, "platformStats", "global");
    await setDoc(ref, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.error("Failed to update platform stats:", err);
  }
}

// --- APPROVE OFFICER APPLICATION ---
export async function approveOfficer(uid) {
  await updateDoc(doc(db, "users", uid), {
    approvalStatus: "approved",
    active: true,
    role: "officer",
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// --- REJECT OFFICER APPLICATION ---
export async function rejectOfficer(uid) {
  await updateDoc(doc(db, "users", uid), {
    approvalStatus: "rejected",
    active: false,
    rejectedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// --- DELETE USER BY ID (Protected by 6-digit PIN: 927624) ---
export async function deleteUserById(uid, enteredPin) {
  if (String(enteredPin).trim() !== MASTER_SECURITY_PIN) {
    throw new Error("Invalid Security PIN! Deletion unauthorized.");
  }
  await deleteDoc(doc(db, "users", uid));
}

// --- DELETE ALL USERS BY ROLE (Protected by PIN) ---
export async function deleteAllUsersByRole(role, enteredPin) {
  if (String(enteredPin).trim() !== MASTER_SECURITY_PIN) {
    throw new Error("Invalid Security PIN! Deletion unauthorized.");
  }

  const users = await getAllUsers(role);
  for (const u of users) {
    if (u.email?.toLowerCase() !== MAIN_ADMIN_EMAIL.toLowerCase()) {
      await deleteDoc(doc(db, "users", u.id));
    }
  }
}

// --- DELETE PROJECT REQUEST BY ID (Protected by PIN) ---
export async function deleteRequestById(requestId, enteredPin) {
  if (String(enteredPin).trim() !== MASTER_SECURITY_PIN) {
    throw new Error("Invalid Security PIN! Deletion unauthorized.");
  }
  await deleteDoc(doc(db, "projectRequests", requestId));
}

// --- RESET / CLEAR DATABASE (Protected by PIN) ---
export async function clearEntireDatabase(enteredPin) {
  if (String(enteredPin).trim() !== MASTER_SECURITY_PIN) {
    throw new Error("Invalid Security PIN! Database reset unauthorized.");
  }

  // Clear requests
  const reqs = await getDocs(collection(db, "projectRequests"));
  for (const d of reqs.docs) await deleteDoc(d.ref);

  // Clear orders
  const ords = await getDocs(collection(db, "orders"));
  for (const d of ords.docs) await deleteDoc(d.ref);

  // Clear non-admin users
  const users = await getDocs(collection(db, "users"));
  for (const d of users.docs) {
    if (d.data().email?.toLowerCase() !== MAIN_ADMIN_EMAIL.toLowerCase()) {
      await deleteDoc(d.ref);
    }
  }
}

// --- CREATE OFFICER ACCOUNT (Admin creates officer profile in Firestore) ---
export async function createOfficerProfile(officerData) {
  const ref = await addDoc(collection(db, "officerProfiles"), {
    ...officerData,
    role: "officer",
    approvalStatus: "approved",
    active: true,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// --- GET OFFICER PROFILES ---
export async function getOfficerProfiles() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((u) => u.role === "officer");
}

