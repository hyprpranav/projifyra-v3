// ============================================================
// PROJIFYRA 3.1 — Projects Service
// ============================================================

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const PROJECTS_COL = "projects";

// --- GET ALL PUBLIC PROJECTS ---
export async function getPublicProjects(filters = {}) {
  let q = collection(db, PROJECTS_COL);
  const constraints = [];

  if (filters.category) {
    constraints.push(where("category", "==", filters.category));
  }
  if (filters.featured) {
    constraints.push(where("featured", "==", true));
  }

  constraints.push(orderBy("createdAt", "desc"));

  if (filters.limit) {
    constraints.push(limit(filters.limit));
  }

  const snap = await getDocs(query(q, ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// --- GET SINGLE PROJECT ---
export async function getProject(projectId) {
  const snap = await getDoc(doc(db, PROJECTS_COL, projectId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// --- CREATE PROJECT (Admin only) ---
export async function createProject(projectData) {
  const ref = await addDoc(collection(db, PROJECTS_COL), {
    ...projectData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// --- UPDATE PROJECT (Admin only) ---
export async function updateProject(projectId, updates) {
  await updateDoc(doc(db, PROJECTS_COL, projectId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// --- DELETE PROJECT (Admin only) ---
export async function deleteProject(projectId) {
  await deleteDoc(doc(db, PROJECTS_COL, projectId));
}

// PROJECT CATEGORIES
export const PROJECT_CATEGORIES = [
  "IoT",
  "Embedded",
  "Electronics",
  "Web Development",
  "Mobile",
  "AI/ML",
  "Python",
  "Java",
  "DBMS",
  "ECE",
  "Hardware",
  "Software",
  "Academic Projects",
];

// PROJECT STATUS OPTIONS
export const PROJECT_STATUS = {
  AVAILABLE: "Available",
  LIMITED: "Limited",
  SOLD_OUT: "Sold Out",
  COMING_SOON: "Coming Soon",
};
