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
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const REVIEWS_COL = "reviews";

// Helper for sorting by createdAt in memory
function sortByCreatedDesc(list) {
  return list.sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0));
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0));
    return timeB - timeA;
  });
}

// --- SUBMIT REVIEW (Authenticated client) ---
export async function submitReview(clientId, reviewData) {
  const ref = await addDoc(collection(db, REVIEWS_COL), {
    clientId: clientId || "",
    clientEmail: (reviewData.clientEmail || "").trim().toLowerCase(),
    clientName: reviewData.clientName || "Student",
    college: reviewData.college || "M. Kumarasamy College of Engineering, Karur",
    department: reviewData.department || "",
    rating: Number(reviewData.rating || 5),
    text: reviewData.text || reviewData.comment || reviewData.review || "",
    comment: reviewData.text || reviewData.comment || reviewData.review || "",
    review: reviewData.text || reviewData.comment || reviewData.review || "",
    approved: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// --- GET APPROVED REVIEWS (Public Landing Page - Index-free!) ---
export async function getApprovedReviews() {
  try {
    const q = query(collection(db, REVIEWS_COL), where("approved", "==", true));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return sortByCreatedDesc(list);
  } catch (err) {
    console.warn("Could not fetch approved reviews:", err);
    return [];
  }
}

// --- GET CLIENT REVIEWS (Student Dashboard) ---
export async function getClientReviews(clientId, clientEmail = "") {
  try {
    const resultsMap = new Map();

    if (clientId) {
      try {
        const qId = query(collection(db, REVIEWS_COL), where("clientId", "==", clientId));
        const snapId = await getDocs(qId);
        snapId.docs.forEach((d) => resultsMap.set(d.id, { id: d.id, ...d.data() }));
      } catch (err) {
        console.warn("Could not query reviews by clientId:", err);
      }
    }

    if (clientEmail) {
      try {
        const cleanEmail = clientEmail.trim().toLowerCase();
        const qEmail = query(collection(db, REVIEWS_COL), where("clientEmail", "==", cleanEmail));
        const snapEmail = await getDocs(qEmail);
        snapEmail.docs.forEach((d) => resultsMap.set(d.id, { id: d.id, ...d.data() }));
      } catch (err) {
        console.warn("Could not query reviews by email:", err);
      }
    }

    const list = Array.from(resultsMap.values());
    return sortByCreatedDesc(list);
  } catch (err) {
    console.warn("Error fetching client reviews:", err);
    return [];
  }
}

// --- GET ALL REVIEWS (Admin Panel) ---
export async function getAllReviews() {
  try {
    const snap = await getDocs(collection(db, REVIEWS_COL));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return sortByCreatedDesc(list);
  } catch (err) {
    console.warn("Error fetching all reviews:", err);
    return [];
  }
}

// --- UPDATE REVIEW (Client or Admin) ---
export async function updateReview(reviewId, updates) {
  const payload = {
    ...updates,
    updatedAt: serverTimestamp(),
  };
  if (updates.text) {
    payload.comment = updates.text;
    payload.review = updates.text;
  }
  await updateDoc(doc(db, REVIEWS_COL, reviewId), payload);
}

// --- APPROVE REVIEW (Admin) ---
export async function approveReview(reviewId) {
  await updateDoc(doc(db, REVIEWS_COL, reviewId), {
    approved: true,
    updatedAt: serverTimestamp(),
  });
}

// --- HIDE REVIEW (Admin) ---
export async function hideReview(reviewId) {
  await updateDoc(doc(db, REVIEWS_COL, reviewId), {
    approved: false,
    updatedAt: serverTimestamp(),
  });
}

// --- DELETE REVIEW (Admin or Client) ---
export async function deleteReview(reviewId) {
  await deleteDoc(doc(db, REVIEWS_COL, reviewId));
}
