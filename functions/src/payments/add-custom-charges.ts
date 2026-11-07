// addCustomCharges — mechanic submits extra line items during an InProgress job.
// Items are stored as pendingItems with a 15-minute approval window. The customer
// must approve before they merge into the order total.

import { HttpsError, onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

interface OrderItem {
  description: string | null;
  name: string;
  price: number;
  quantity: number;
}

interface AddCustomChargesRequest {
  orderId: string;
  newItems: OrderItem[];
}

const PENDING_CHARGES_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const addCustomCharges = onCall<AddCustomChargesRequest>(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const { orderId, newItems } = request.data;
  if (!orderId || typeof orderId !== "string") {
    throw new HttpsError("invalid-argument", "orderId is required.");
  }
  if (!Array.isArray(newItems) || newItems.length === 0) {
    throw new HttpsError("invalid-argument", "newItems must be a non-empty array.");
  }

  const providerId = request.auth.uid;
  const db = getFirestore();
  const orderRef = db.collection("repair-orders").doc(orderId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Order not found.");
    }

    const data = snap.data() as {
      providerId: string | null;
      status: string;
      pendingItems?: OrderItem[] | null;
    };

    if (data.providerId !== providerId) {
      throw new HttpsError("permission-denied", "Only the assigned mechanic can add charges.");
    }

    if (data.status !== "InProgress") {
      throw new HttpsError("failed-precondition", "Charges can only be added to an in-progress order.");
    }

    if (data.pendingItems && data.pendingItems.length > 0) {
      throw new HttpsError("failed-precondition", "There are already charges pending customer approval.");
    }

    const now = Date.now();
    tx.update(orderRef, {
      pendingItems: newItems,
      pendingItemsAddedAt: now,
      pendingItemsExpiresAt: now + PENDING_CHARGES_TTL_MS,
      updatedAt: now,
    });
  });

  // eslint-disable-next-line no-console
  console.log(`[addCustomCharges] ${newItems.length} pending items added to order ${orderId}`);

  return { success: true };
});
