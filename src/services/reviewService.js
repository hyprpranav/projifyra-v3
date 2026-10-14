// ============================================================
// PROJIFYRA 3.1 — Reviews Service
// ============================================================

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const REVIEWS_COL = "reviews";

// --- SUBMIT REVIEW (Authenticated client) ---
export async function submitReview(clientId, reviewData) {
  const ref = await addDoc(collection(db, REVIEWS_COL), {
    clientId,
    ...reviewData,
    approved: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// --- GET APPROVED REVIEWS (Public) ---
export async function getApprovedReviews() {
  const q = query(
    collection(db, REVIEWS_COL),
    where("approved", "==", true),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// --- GET ALL REVIEWS (Admin) ---
export async function getAllReviews() {
  const q = query(collection(db, REVIEWS_COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// --- APPROVE REVIEW (Admin) ---
export async function approveReview(reviewId) {
  await updateDoc(doc(db, REVIEWS_COL, reviewId), { approved: true });
}

// --- HIDE REVIEW (Admin) ---
export async function hideReview(reviewId) {
  await updateDoc(doc(db, REVIEWS_COL, reviewId), { approved: false });
}

// --- DELETE REVIEW (Admin) ---
export async function deleteReview(reviewId) {
  await deleteDoc(doc(db, REVIEWS_COL, reviewId));
}
