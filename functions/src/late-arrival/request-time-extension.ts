import { HttpsError, onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

interface RequestTimeExtensionRequest {
  orderId: string;
  minutes: number;
}

const ALLOWED_MINUTES = [15, 30, 45];

export const requestTimeExtension = onCall<RequestTimeExtensionRequest>(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const { orderId, minutes } = request.data;
  if (!orderId || typeof orderId !== "string") {
    throw new HttpsError("invalid-argument", "orderId is required.");
  }
  if (!ALLOWED_MINUTES.includes(minutes)) {
    throw new HttpsError("invalid-argument", "minutes must be 15, 30, or 45.");
  }

  const db = getFirestore();
  const orderRef = db.collection("repair-orders").doc(orderId);
  const snap = await orderRef.get();

  if (!snap.exists) {
    throw new HttpsError("not-found", "Order not found.");
  }

  const order = snap.data() as {
    providerId: string | null;
    status: string;
    timeExtensionRequestedAt: number | null;
  };

  if (order.providerId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Only the assigned mechanic can request an extension.");
  }

  if (order.status !== "Scheduled") {
    throw new HttpsError("failed-precondition", "Extensions can only be requested for scheduled jobs.");
  }

  if (order.timeExtensionRequestedAt !== null) {
    throw new HttpsError("failed-precondition", "An extension has already been requested.");
  }

  const now = Date.now();
  await orderRef.update({
    timeExtensionRequestedAt: now,
    timeExtensionMinutes: minutes,
    updatedAt: now,
  });

  // eslint-disable-next-line no-console
  console.log(`[requestTimeExtension] mechanic requested ${minutes}min extension for order ${orderId}`);

  return { success: true };
});
