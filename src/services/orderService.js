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
  READY_FOR_DELIVERY: "Ready for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

// PROJECT PROGRESS MILESTONES
export const PROGRESS_STAGES = [
  "Idea Approved",
  "Advance Payment (30%)",
  "Prototyping & Development",
  "Testing & Quality Check",
  "Ready for Delivery",
  "Delivered & Feedback",
];

// --- 1. SUBMIT PROJECT REQUEST (With Idea, Components, & Cloudinary Document) ---
export async function submitProjectRequest(clientId, formData, customDb = null) {
  const targetDb = customDb || db;
  const cleanEmail = (formData.email || "").trim().toLowerCase();
  const ref = await addDoc(collection(targetDb, REQUESTS_COL), {
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

  await logOrderActivity("request_submitted", `New project idea submitted: ${formData.projectTitle || "Custom Project"}`, clientId, targetDb);
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
  const compCost = Number(approvalData.componentCost || 0);
  const makeCost = Number(approvalData.makingCost || 0);
  const addonCost = Number(approvalData.addonTotal || 0);
  const advanceAmount = Math.round(totalAmount * 0.30); // 30% upfront requirement

  const updates = {
    status: ORDER_STATUS.APPROVED,
    assignedOfficer: approvalData.assignedOfficer || "Team",
    assignedOfficerName: approvalData.assignedOfficerName || "PROJIFYRA Engineering Team",
    projectAmount: totalAmount,
    componentCost: compCost,
    makingCost: makeCost,
    addonTotal: addonCost,
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
    componentCost: compCost,
    makingCost: makeCost,
    addonTotal: addonCost,
    advancePaymentRequired: advanceAmount,
    advancePaymentStatus: "Pending",
    finalPaymentStatus: "Pending",
    completionPercentage: 0,
    assignedOfficer: approvalData.assignedOfficer || "Team",
    assignedOfficerName: approvalData.assignedOfficerName || "PROJIFYRA Engineering Team",
    status: ORDER_STATUS.APPROVED,
    stage: "Idea Approved",
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

// --- 8. SUBMIT PAYMENT SCREENSHOT (30% Advance, 70% Final, or 100% Full) ---
export async function submitPaymentScreenshot(requestId, paymentData) {
  const reqRef = doc(db, REQUESTS_COL, requestId);
  const { type, screenshotUrl, transactionId, note } = paymentData;

  const updates = { updatedAt: serverTimestamp() };
  if (type === "advance") {
    updates.advancePaymentScreenshot = screenshotUrl;
    updates.advancePaymentTxnId = transactionId || "";
    updates.advancePaymentStatus = "Submitted";
    updates.advancePaymentSubmittedAt = new Date().toISOString();
  } else if (type === "full") {
    updates.advancePaymentScreenshot = screenshotUrl;
    updates.advancePaymentTxnId = transactionId || "";
    updates.advancePaymentStatus = "Submitted";
    updates.finalPaymentScreenshot = screenshotUrl;
    updates.finalPaymentTxnId = transactionId || "";
    updates.finalPaymentStatus = "Submitted";
    updates.isFullPayment = true;
    updates.advancePaymentSubmittedAt = new Date().toISOString();
    updates.finalPaymentSubmittedAt = new Date().toISOString();
  } else {
    // "final"
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
  const snap = await getDoc(reqRef);
  const reqData = snap.exists() ? snap.data() : {};
  const updates = { updatedAt: serverTimestamp() };

  if (type === "advance") {
    updates.advancePaymentStatus = "Verified";
    if (reqData.status === ORDER_STATUS.APPROVED) {
      updates.status = ORDER_STATUS.IN_PROGRESS; // Work officially begins after 30% advance is verified!
    }
  } else if (type === "full") {
    updates.advancePaymentStatus = "Verified";
    updates.finalPaymentStatus = "Verified";
    updates.isFullPayment = true;
    if (Number(reqData.completionPercentage || 0) >= 100) {
      updates.status = ORDER_STATUS.READY_FOR_DELIVERY;
    } else {
      updates.status = ORDER_STATUS.IN_PROGRESS;
    }
  } else {
    // "final"
    updates.finalPaymentStatus = "Verified";
    if (Number(reqData.completionPercentage || 0) >= 100) {
      updates.status = ORDER_STATUS.READY_FOR_DELIVERY;
    }
  }
  await updateDoc(reqRef, updates);

  // Sync to matching order document if exists
  try {
    const q = query(collection(db, ORDERS_COL), where("requestId", "==", requestId));
    const oSnap = await getDocs(q);
    for (const oDoc of oSnap.docs) {
      await updateDoc(doc(db, ORDERS_COL, oDoc.id), updates);
    }
  } catch (err) {
    console.warn("Could not sync payment verification to order document:", err);
  }
}

// --- 9B. MARK ORDER READY FOR DELIVERY ---
export async function markOrderReadyForDelivery(id) {
  try {
    const reqRef = doc(db, REQUESTS_COL, id);
    const snap = await getDoc(reqRef);
    if (snap.exists()) {
      await updateDoc(reqRef, {
        status: ORDER_STATUS.READY_FOR_DELIVERY,
        completionPercentage: 100,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn("Could not update request to ready for delivery:", err);
  }

  try {
    const ordRef = doc(db, ORDERS_COL, id);
    const oSnap = await getDoc(ordRef);
    if (oSnap.exists()) {
      await updateDoc(ordRef, {
        status: ORDER_STATUS.READY_FOR_DELIVERY,
        completionPercentage: 100,
        stage: "Ready for Delivery",
        updatedAt: serverTimestamp(),
      });
    } else {
      const q = query(collection(db, ORDERS_COL), where("requestId", "==", id));
      const qSnap = await getDocs(q);
      for (const d of qSnap.docs) {
        await updateDoc(doc(db, ORDERS_COL, d.id), {
          status: ORDER_STATUS.READY_FOR_DELIVERY,
          completionPercentage: 100,
          stage: "Ready for Delivery",
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.warn("Could not update order to ready for delivery:", err);
  }

  await logOrderActivity("order_ready_for_delivery", `Order marked Ready for Delivery: ${id}`, "system");
}

// --- 9C. MARK ORDER DELIVERED ---
export async function markOrderDelivered(id) {
  try {
    const reqRef = doc(db, REQUESTS_COL, id);
    const snap = await getDoc(reqRef);
    if (snap.exists()) {
      await updateDoc(reqRef, {
        status: ORDER_STATUS.DELIVERED,
        completionPercentage: 100,
        deliveredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn("Could not update request to delivered:", err);
  }

  try {
    const ordRef = doc(db, ORDERS_COL, id);
    const oSnap = await getDoc(ordRef);
    if (oSnap.exists()) {
      await updateDoc(ordRef, {
        status: ORDER_STATUS.DELIVERED,
        completionPercentage: 100,
        stage: "Delivered",
        deliveredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const q = query(collection(db, ORDERS_COL), where("requestId", "==", id));
      const qSnap = await getDocs(q);
      for (const d of qSnap.docs) {
        await updateDoc(doc(db, ORDERS_COL, d.id), {
          status: ORDER_STATUS.DELIVERED,
          completionPercentage: 100,
          stage: "Delivered",
          deliveredAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.warn("Could not update order to delivered:", err);
  }

  await logOrderActivity("order_delivered", `Order marked Delivered: ${id}`, "system");
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

    // Unify with any approved or in-progress requests from projectRequests
    try {
      const clientReqs = await getClientRequests(clientId, clientEmail);
      clientReqs.forEach((req) => {
        if (
          req.status === ORDER_STATUS.APPROVED ||
          req.status === ORDER_STATUS.IN_PROGRESS ||
          req.status === ORDER_STATUS.TESTING ||
          req.status === ORDER_STATUS.COMPLETED ||
          req.status === ORDER_STATUS.READY_FOR_DELIVERY ||
          req.status === ORDER_STATUS.DELIVERED
        ) {
          const alreadyExists = Array.from(resultsMap.values()).some((o) => o.requestId === req.id || o.id === req.id);
          if (!alreadyExists) {
            resultsMap.set(`req_${req.id}`, {
              id: req.id,
              requestId: req.id,
              title: req.projectTitle || "Approved Engineering Project",
              clientName: req.fullName || "Student",
              clientEmail: req.email || "",
              clientPhone: req.phone || "",
              projectAmount: Number(req.projectAmount || 0),
              componentCost: Number(req.componentCost || 0),
              makingCost: Number(req.makingCost || 0),
              addonTotal: Number(req.addonTotal || 0),
              advancePaymentRequired: Number(req.advancePaymentRequired || Math.round(Number(req.projectAmount || 0) * 0.3)),
              advancePaymentStatus: req.advancePaymentStatus || "Pending",
              finalPaymentStatus: req.finalPaymentStatus || "Pending",
              isFullPayment: req.isFullPayment || false,
              advancePaymentScreenshot: req.advancePaymentScreenshot || "",
              finalPaymentScreenshot: req.finalPaymentScreenshot || "",
              completionPercentage: Number(req.completionPercentage || 0),
              assignedOfficer: req.assignedOfficer || "Team",
              assignedOfficerName: req.assignedOfficerName || "PROJIFYRA Engineering Team",
              status: req.status,
              stage: req.status === ORDER_STATUS.DELIVERED ? "Delivered" : req.status === ORDER_STATUS.READY_FOR_DELIVERY ? "Ready for Delivery" : req.status === ORDER_STATUS.COMPLETED ? "Completed" : req.completionPercentage > 50 ? "Testing" : "Development",
              selectedServices: req.selectedServices || [],
              pcbTool: req.pcbTool || "",
              simulationTool: req.simulationTool || "",
              deliverySpeed: req.deliverySpeed || "normal",
              deliveredAt: req.deliveredAt || null,
              createdAt: req.createdAt,
              updatedAt: req.updatedAt,
            });
          }
        }
      });
    } catch (err) {
      console.warn("Could not merge approved requests into client orders:", err);
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
  try {
    const resultsMap = new Map();
    try {
      const snap = await getDocs(collection(db, ORDERS_COL));
      snap.docs.forEach((d) => resultsMap.set(d.id, { id: d.id, ...d.data() }));
    } catch (e) {
      console.warn("Could not load orders collection:", e);
    }

    try {
      const reqs = await getAllRequests();
      reqs.forEach((req) => {
        if (
          req.status === ORDER_STATUS.APPROVED ||
          req.status === ORDER_STATUS.IN_PROGRESS ||
          req.status === ORDER_STATUS.TESTING ||
          req.status === ORDER_STATUS.COMPLETED ||
          req.status === ORDER_STATUS.READY_FOR_DELIVERY ||
          req.status === ORDER_STATUS.DELIVERED
        ) {
          const already = Array.from(resultsMap.values()).some((o) => o.requestId === req.id || o.id === req.id);
          if (!already) {
            resultsMap.set(`req_${req.id}`, {
              id: req.id,
              requestId: req.id,
              title: req.projectTitle || "Approved Engineering Project",
              clientName: req.fullName || "Student",
              clientEmail: req.email || "",
              clientPhone: req.phone || "",
              projectAmount: Number(req.projectAmount || 0),
              componentCost: Number(req.componentCost || 0),
              makingCost: Number(req.makingCost || 0),
              addonTotal: Number(req.addonTotal || 0),
              advancePaymentRequired: Number(req.advancePaymentRequired || Math.round(Number(req.projectAmount || 0) * 0.3)),
              advancePaymentStatus: req.advancePaymentStatus || "Pending",
              finalPaymentStatus: req.finalPaymentStatus || "Pending",
              isFullPayment: req.isFullPayment || false,
              advancePaymentScreenshot: req.advancePaymentScreenshot || "",
              finalPaymentScreenshot: req.finalPaymentScreenshot || "",
              completionPercentage: Number(req.completionPercentage || 0),
              assignedOfficer: req.assignedOfficer || "Team",
              assignedOfficerName: req.assignedOfficerName || "PROJIFYRA Engineering Team",
              status: req.status,
              stage: req.status === ORDER_STATUS.DELIVERED ? "Delivered" : req.status === ORDER_STATUS.READY_FOR_DELIVERY ? "Ready for Delivery" : req.status === ORDER_STATUS.COMPLETED ? "Completed" : req.completionPercentage > 50 ? "Testing" : "Development",
              selectedServices: req.selectedServices || [],
              deliveredAt: req.deliveredAt || null,
              createdAt: req.createdAt,
              updatedAt: req.updatedAt,
            });
          }
        }
      });
    } catch (e) {
      console.warn("Could not merge approved requests into all orders:", e);
    }

    const list = Array.from(resultsMap.values());
    list.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return timeB - timeA;
    });
    return list;
  } catch (err) {
    console.error("Error in getAllOrders:", err);
    return [];
  }
}

export async function updateOrder(orderId, updates) {
  await updateDoc(doc(db, ORDERS_COL, orderId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

async function logOrderActivity(type, message, userId, customDb = null) {
  try {
    const targetDb = customDb || db;
    await addDoc(collection(targetDb, "activityLogs"), {
      type,
      message,
      userId,
      timestamp: serverTimestamp(),
    });
  } catch {
    // Non-blocking
  }
}

