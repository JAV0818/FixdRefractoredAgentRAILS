// approveCustomCharges — customer approves pending charges within the 15-min window.
// Merges pendingItems into the order's items and recalculates totals.

import { HttpsError, onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

interface OrderItem {
  description: string | null;
  name: string;
  price: number;
  quantity: number;
}

interface ApproveCustomChargesRequest {
  orderId: string;
}

const PLATFORM_DEPOSIT = 35;

export const approveCustomCharges = onCall<ApproveCustomChargesRequest>(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const { orderId } = request.data;
  if (!orderId || typeof orderId !== "string") {
    throw new HttpsError("invalid-argument", "orderId is required.");
  }

  const customerId = request.auth.uid;
  const db = getFirestore();
  const orderRef = db.collection("repair-orders").doc(orderId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Order not found.");
    }

    const data = snap.data() as {
      customerId: string;
      status: string;
      items: OrderItem[];
      pendingItems: OrderItem[] | null;
      pendingItemsExpiresAt: number | null;
    };

    if (data.customerId !== customerId) {
      throw new HttpsError("permission-denied", "Only the customer can approve charges.");
    }

    if (data.status !== "InProgress") {
      throw new HttpsError("failed-precondition", "Order is not in progress.");
    }

    if (!data.pendingItems || data.pendingItems.length === 0) {
      throw new HttpsError("failed-precondition", "No pending charges to approve.");
    }

    const now = Date.now();
    if (data.pendingItemsExpiresAt && now > data.pendingItemsExpiresAt) {
      throw new HttpsError("failed-precondition", "These charges have expired.");
    }

    const updatedItems = [...data.items, ...data.pendingItems];
    const earnings = updatedItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const totalPrice = earnings + PLATFORM_DEPOSIT;

    tx.update(orderRef, {
      items: updatedItems,
      totalPrice,
      remainingBalance: Math.max(totalPrice - PLATFORM_DEPOSIT, 0),
      pendingItems: null,
      pendingItemsAddedAt: null,
      pendingItemsExpiresAt: null,
      updatedAt: now,
    });
  });

  // eslint-disable-next-line no-console
  console.log(`[approveCustomCharges] customer approved charges for order ${orderId}`);

  return { success: true };
});
