// rejectCustomCharges — customer declines pending charges. Clears the pending
// fields without merging into the order total. Idempotent.

import { HttpsError, onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

interface RejectCustomChargesRequest {
  orderId: string;
}

export const rejectCustomCharges = onCall<RejectCustomChargesRequest>(async (request) => {
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
  const snap = await orderRef.get();

  if (!snap.exists) {
    throw new HttpsError("not-found", "Order not found.");
  }

  const data = snap.data() as { customerId: string };
  if (data.customerId !== customerId) {
    throw new HttpsError("permission-denied", "Only the customer can reject charges.");
  }

  await orderRef.update({
    pendingItems: null,
    pendingItemsAddedAt: null,
    pendingItemsExpiresAt: null,
    updatedAt: Date.now(),
  });

  // eslint-disable-next-line no-console
  console.log(`[rejectCustomCharges] customer rejected charges for order ${orderId}`);

  return { success: true };
});
