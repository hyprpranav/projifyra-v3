// ============================================================
// PROJIFYRA 3.1 — Order / Request Service
// Comprehensive workflow: Idea submission, Officer proposals,
// Admin gatekeeper approval, 30% advance payment & verification,
// Add-on services, and live progress percentage tracking.
// ============================================================

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const ORDERS_COL = "orders";
const REQUESTS_COL = "projectRequests";

// ADD-ON SERVICES PRICING & METADATA
export const ADDON_SERVICES = [
  {
    id: "ppt",
    name: "PPT Presentation",
    price: 149,
    badge: "Popular",
    description: "Professional slides with system architecture, flowcharts, block diagrams & viva points.",
  },
  {
    id: "ppt_docs",
    name: "PPT + Full Documentation Bundle",
    price: 249,
    badge: "Best Value",
    description: "Complete project synopsis, IEEE-formatted report, chapters, hardware specs & PPT presentation.",
  },
  {
    id: "paperwork",
    name: "Conference Paper Assistance",
    price: 999,
    badge: "Academic",
    description: "IEEE / Springer paper format, literature survey editing, plagiarism reduction & publication guidance.",
  },
  {
    id: "mentoring",
    name: "1-on-1 Mentoring & Live Consultation",
    price: 99,
    badge: "Hands-on",
    description: "Direct live session with technical lead, circuit & code explanation, and viva doubts clearance.",
  },
];

// ORDER & REQUEST STATUSES
export const ORDER_STATUS = {
  SUBMITTED: "Under Review",
  OFFICER_PROPOSED: "Officer Proposed",
  APPROVED: "Approved",
  IN_PROGRESS: "In Progress",
  TESTING: "Testing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// PROJECT PROGRESS MILESTONES
export const PROGRESS_STAGES = [
  "Idea Approved",
  "Advance Payment (30%)",
  "Prototyping & Development",
  "Testing & Demonstration",
  "Completed & Delivered",
];

// --- 1. SUBMIT PROJECT REQUEST (With Idea, Components, & Cloudinary Document) ---
export async function submitProjectRequest(clientId, formData) {
  const cleanEmail = (formData.email || "").trim().toLowerCase();
  const ref = await addDoc(collection(db, REQUESTS_COL), {
    clientId,
    fullName: formData.fullName || "",
    teamName: formData.teamName || "",
    registerNumber: formData.registerNumber || "",
    phone: formData.phone || "",
    email: cleanEmail,
    college: formData.college || "",
    department: formData.department || "",
    year: formData.year || "",
    
    // Idea details
    projectTitle: formData.projectTitle || formData.title || "Custom Engineering Project",
    shortDescription: formData.shortDescription || formData.description || "",
    requirements: formData.requirements || formData.technologies || "",
    hasComponents: formData.hasComponents || "no", // "yes" (Client has) | "no" (Projifyra buys)
    deliverySpeed: formData.deliverySpeed || "normal", // "normal" (2-3 days) | "express" (1 day)
    
    // Uploaded Cloudinary Document (< 5MB)
    documentUrl: formData.documentUrl || "",
    documentName: formData.documentName || "",
    documentSize: formData.documentSize || 0,
    
    // Workflow State
    status: ORDER_STATUS.SUBMITTED,
    completionPercentage: 0,
    officerProposals: [],
    assignedOfficer: "",
    assignedOfficerName: "Pending Assignment",
    
    // Financials
    projectAmount: 0,
    componentCost: 0,
    makingCost: 0,
    advancePaymentRequired: 0,
    advancePaymentStatus: "Pending", // "Pending" | "Submitted" | "Verified"
    advancePaymentScreenshot: "",
    advancePaymentTxnId: "",
    finalPaymentStatus: "Pending",
    finalPaymentScreenshot: "",
    finalPaymentTxnId: "",
    
    // Deliverables & Specialized Services (PCB, Simulation, Hardware, Addons)
    selectedServices: formData.selectedServices || ["hardware"],
    pcbTool: formData.pcbTool || "",
    simulationTool: formData.simulationTool || "",
    addonsRequested: formData.addonsRequested || [],
    addonTotal: formData.addonTotal || 0,
    feasibilityVerdict: formData.feasibilityVerdict || "Under Feasibility Review",
    adminFeasibilityNotes: formData.adminFeasibilityNotes || "",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await logOrderActivity("request_submitted", `New project idea submitted: ${formData.projectTitle || "Custom Project"}`, clientId);
  return ref.id;
}

// --- 2. GET CLIENT REQUESTS (Index-free with in-memory sort & UID+Email union) ---
export async function getClientRequests(clientId, clientEmail = "") {
  try {
    const resultsMap = new Map();

    if (clientId) {
      try {
        const q = query(collection(db, REQUESTS_COL), where("clientId", "==", clientId));
        const snap = await getDocs(q);
        snap.docs.forEach((d) => resultsMap.set(d.id, { id: d.id, ...d.data() }));
      } catch (err) {
        console.warn("Error querying requests by UID:", err);
      }
    }

    if (clientEmail) {
      try {
        const cleanEmail = clientEmail.trim().toLowerCase();
        const qEmail = query(collection(db, REQUESTS_COL), where("email", "==", cleanEmail));
        const snapEmail = await getDocs(qEmail);
        snapEmail.docs.forEach((d) => resultsMap.set(d.id, { id: d.id, ...d.data() }));
      } catch (err) {
        console.warn("Error querying requests by email:", err);
      }
    }

    const results = Array.from(resultsMap.values());

    // Sort in memory by createdAt descending — zero composite index required!
    results.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return timeB - timeA;
    });

    return results;
  } catch (err) {
    console.error("Error fetching client requests:", err);
    return [];
  }
}

// --- 3. GET ALL REQUESTS (Admin & Officer pool) ---
export async function getAllRequests() {
  const q = query(collection(db, REQUESTS_COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// --- 4. OFFICER SUBMITS PROPOSAL / BID TO ADMIN DESK ---
export async function submitOfficerProposal(requestId, proposalData) {
  const reqRef = doc(db, REQUESTS_COL, requestId);
  const proposal = {
    officerId: proposalData.officerId,
    officerName: proposalData.officerName || "Technical Officer",
    officerEmail: proposalData.officerEmail || "",
    componentCost: Number(proposalData.componentCost || 0),
    makingCost: Number(proposalData.makingCost || 0),
    totalEstimatedPrice: Number(proposalData.totalEstimatedPrice || 0),
    timelineDays: proposalData.timelineDays || "2-3 Days",
    notes: proposalData.notes || "",
    submittedAt: new Date().toISOString(),
  };

  await updateDoc(reqRef, {
    officerProposals: arrayUnion(proposal),
    status: ORDER_STATUS.OFFICER_PROPOSED,
    updatedAt: serverTimestamp(),
  });

  await logOrderActivity("officer_proposal", `Officer ${proposal.officerName} submitted proposal for request ${requestId}`, proposal.officerId);
}

// --- 5. ADMIN APPROVES REQUEST & ASSIGNS OFFICER (Sole Gatekeeper) ---
export async function adminApproveRequest(requestId, approvalData) {
  const reqRef = doc(db, REQUESTS_COL, requestId);
  const totalAmount = Number(approvalData.projectAmount || 0);
  const advanceAmount = Math.round(totalAmount * 0.30); // 30% upfront requirement

  const updates = {
    status: ORDER_STATUS.APPROVED,
    assignedOfficer: approvalData.assignedOfficer || "Team",
    assignedOfficerName: approvalData.assignedOfficerName || "PROJIFYRA Engineering Team",
    projectAmount: totalAmount,
    componentCost: Number(approvalData.componentCost || 0),
    makingCost: Number(approvalData.makingCost || 0),
    advancePaymentRequired: advanceAmount,
    advancePaymentStatus: "Pending",
    completionPercentage: 0,
    deliverySpeed: approvalData.deliverySpeed || "normal",
    adminNotes: approvalData.adminNotes || "",
    adminFeasibilityNotes: approvalData.adminFeasibilityNotes || approvalData.adminNotes || "",
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(reqRef, updates);

  // Synchronize or create matching active order
  await addDoc(collection(db, ORDERS_COL), {
    requestId,
    clientId: approvalData.clientId || "",
    clientName: approvalData.clientName || "",
    clientEmail: (approvalData.clientEmail || "").trim().toLowerCase(),
    clientPhone: approvalData.clientPhone || "",
    title: approvalData.projectTitle || "Approved Engineering Project",
    projectAmount: totalAmount,
    advancePaymentRequired: advanceAmount,
    advancePaymentStatus: "Pending",
    completionPercentage: 0,
    assignedOfficer: approvalData.assignedOfficer || "Team",
    assignedOfficerName: approvalData.assignedOfficerName || "PROJIFYRA Engineering Team",
    status: ORDER_STATUS.APPROVED,
    hasComponents: approvalData.hasComponents || "no",
    deliverySpeed: approvalData.deliverySpeed || "normal",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // CRITICAL: Activate client account in users collection upon idea approval!
  if (approvalData.clientId) {
    try {
      await updateDoc(doc(db, "users", approvalData.clientId), {
        approvalStatus: "approved",
        active: true,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Could not update user by clientId:", err);
    }
  }

  // Also fallback: if user exists with matching clientEmail
  if (approvalData.clientEmail) {
    try {
      const uQuery = query(collection(db, "users"), where("email", "==", approvalData.clientEmail.trim().toLowerCase()));
      const uSnap = await getDocs(uQuery);
      for (const uDoc of uSnap.docs) {
        await updateDoc(doc(db, "users", uDoc.id), {
          approvalStatus: "approved",
          active: true,
          approvedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn("Could not update user by email:", err);
    }
  }

  await logOrderActivity("admin_approved", `Admin approved request ${requestId} with budget ₹${totalAmount} and activated client account`, "admin");
}

// --- 6. ADMIN UPDATES / EDITS PROJECT DETAILS AT ANY TIME ---
export async function adminUpdateRequest(requestId, updates) {
  const reqRef = doc(db, REQUESTS_COL, requestId);
  const updatePayload = {
    ...updates,
    updatedAt: serverTimestamp(),
  };
  if (updates.projectAmount) {
    updatePayload.advancePaymentRequired = Math.round(Number(updates.projectAmount) * 0.30);
  }
  await updateDoc(reqRef, updatePayload);
}

// --- 7. UPDATE COMPLETION PERCENTAGE (0% - 100%) ---
export async function updateCompletionPercentage(requestId, percentage, note = "") {
  const reqRef = doc(db, REQUESTS_COL, requestId);
  const pct = Math.min(100, Math.max(0, Number(percentage)));
  
  const updates = {
    completionPercentage: pct,
    updatedAt: serverTimestamp(),
  };

  if (pct >= 100) {
    updates.status = ORDER_STATUS.COMPLETED;
  } else if (pct > 0) {
    updates.status = ORDER_STATUS.IN_PROGRESS;
  }
  if (note) {
    updates.latestProgressNote = note;
  }

  await updateDoc(reqRef, updates);
}

// --- 8. SUBMIT PAYMENT SCREENSHOT (30% Advance or 70% Final) ---
export async function submitPaymentScreenshot(requestId, paymentData) {
  const reqRef = doc(db, REQUESTS_COL, requestId);
  const { type, screenshotUrl, transactionId, note } = paymentData;

  const updates = { updatedAt: serverTimestamp() };
  if (type === "advance") {
    updates.advancePaymentScreenshot = screenshotUrl;
    updates.advancePaymentTxnId = transactionId || "";
    updates.advancePaymentStatus = "Submitted";
    updates.advancePaymentSubmittedAt = new Date().toISOString();
  } else {
    updates.finalPaymentScreenshot = screenshotUrl;
    updates.finalPaymentTxnId = transactionId || "";
    updates.finalPaymentStatus = "Submitted";
    updates.finalPaymentSubmittedAt = new Date().toISOString();
  }
  if (note) updates.paymentNote = note;

  await updateDoc(reqRef, updates);
}

// --- 9. ADMIN VERIFIES PAYMENT SCREENSHOT ---
export async function verifyPayment(requestId, type = "advance") {
  const reqRef = doc(db, REQUESTS_COL, requestId);
  const updates = { updatedAt: serverTimestamp() };
  if (type === "advance") {
    updates.advancePaymentStatus = "Verified";
    updates.status = ORDER_STATUS.IN_PROGRESS; // Work officially begins after 30% advance is verified!
  } else {
    updates.finalPaymentStatus = "Verified";
  }
  await updateDoc(reqRef, updates);
}

// --- 10. REQUEST ADD-ON SERVICE ---
export async function requestProjectAddon(requestId, addon) {
  const reqRef = doc(db, REQUESTS_COL, requestId);
  await updateDoc(reqRef, {
    addonsRequested: arrayUnion({
      ...addon,
      requestedAt: new Date().toISOString(),
    }),
    updatedAt: serverTimestamp(),
  });
}

// --- COMPATIBILITY HELPERS ---
export async function updateRequestStatus(requestId, status, officerId = null) {
  const updates = { status, updatedAt: serverTimestamp() };
  if (officerId) updates.assignedOfficer = officerId;
  await updateDoc(doc(db, REQUESTS_COL, requestId), updates);
}

export async function createOrder(orderData) {
  const ref = await addDoc(collection(db, ORDERS_COL), {
    ...orderData,
    status: ORDER_STATUS.APPROVED,
    completionPercentage: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// --- 8. GET CLIENT ORDERS (Index-free with in-memory sort & UID+Email union) ---
export async function getClientOrders(clientId, clientEmail = "") {
  try {
    const resultsMap = new Map();

    if (clientId) {
      try {
        const q = query(collection(db, ORDERS_COL), where("clientId", "==", clientId));
        const snap = await getDocs(q);
        snap.docs.forEach((d) => resultsMap.set(d.id, { id: d.id, ...d.data() }));
      } catch (err) {
        console.warn("Error querying orders by UID:", err);
      }
    }

    if (clientEmail) {
      try {
        const cleanEmail = clientEmail.trim().toLowerCase();
        const qEmail = query(collection(db, ORDERS_COL), where("clientEmail", "==", cleanEmail));
        const snapEmail = await getDocs(qEmail);
        snapEmail.docs.forEach((d) => resultsMap.set(d.id, { id: d.id, ...d.data() }));
      } catch (err) {
        console.warn("Error querying orders by email:", err);
      }
    }

    const results = Array.from(resultsMap.values());

    results.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return timeB - timeA;
    });

    return results;
  } catch (err) {
    console.error("Error fetching client orders:", err);
    return [];
  }
}

export async function getAllOrders() {
  const q = query(collection(db, ORDERS_COL), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateOrder(orderId, updates) {
  await updateDoc(doc(db, ORDERS_COL, orderId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

async function logOrderActivity(type, message, userId) {
  try {
    await addDoc(collection(db, "activityLogs"), {
      type,
      message,
      userId,
      timestamp: serverTimestamp(),
    });
  } catch {
    // Non-blocking
  }
}

