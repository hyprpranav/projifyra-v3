// ============================================================
// PROJIFYRA 3.1 — Client Issues & Support Service
// ============================================================

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const ISSUES_COL = "clientIssues";

// --- SUBMIT ISSUE / CHAT MESSAGE (Public or Client) ---
export async function submitClientIssue(issueData) {
  const ref = await addDoc(collection(db, ISSUES_COL), {
    name: issueData.name || "Client",
    email: (issueData.email || "").trim().toLowerCase(),
    phone: issueData.phone || "",
    category: issueData.category || "Idea Approval Inquiry",
    message: issueData.message || "",
    status: "open", // "open" | "in_progress" | "resolved"
    adminReply: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// --- GET ALL ISSUES (Admin Panel) ---
export async function getAllIssues() {
  try {
    const snap = await getDocs(collection(db, ISSUES_COL));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // In-memory sort by createdAt descending (no composite index needed)
    return list.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return timeB - timeA;
    });
  } catch (err) {
    console.warn("Could not fetch client issues:", err);
    return [];
  }
}

// --- UPDATE ISSUE STATUS / REPLY (Admin) ---
export async function updateIssueStatus(issueId, updates) {
  const ref = doc(db, ISSUES_COL, issueId);
  await updateDoc(ref, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// --- DELETE ISSUE (Admin) ---
export async function deleteIssue(issueId) {
  await deleteDoc(doc(db, ISSUES_COL, issueId));
}
