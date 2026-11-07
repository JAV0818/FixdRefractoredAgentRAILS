import { HttpsError, onCall } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

interface CompleteOrderRequest {
  orderId: string;
}

export const completeOrder = onCall<CompleteOrderRequest>(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const orderId = request.data.orderId;
  if (!orderId || typeof orderId !== "string") {
    throw new HttpsError("invalid-argument", "orderId is required.");
  }

  const db = getFirestore();
  const orderRef = db.collection("repair-orders").doc(orderId);
  const orderSnap = await orderRef.get();

  if (!orderSnap.exists) {
    throw new HttpsError("not-found", "Order not found.");
  }

  const order = orderSnap.data() as {
    providerId: string | null;
    status: string;
    inspectionCompletedAt?: number | null;
    pendingItems?: unknown[] | null;
  };

  if (order.providerId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Only the assigned mechanic can complete this job.");
  }

  if (order.status !== "InProgress") {
    throw new HttpsError("failed-precondition", "Only in-progress jobs can be completed.");
  }

  if (!order.inspectionCompletedAt) {
    throw new HttpsError("failed-precondition", "Complete the inspection before finishing the job.");
  }

  if (order.pendingItems && Array.isArray(order.pendingItems) && order.pendingItems.length > 0) {
    throw new HttpsError("failed-precondition", "Cannot complete the job while charges are pending customer approval.");
  }

  const now = Date.now();
  const batch = db.batch();

  batch.update(orderRef, {
    status: "Completed",
    completedAt: now,
    updatedAt: now,
  });

  batch.update(db.collection("users").doc(request.auth.uid), {
    "providerProfile.totalJobsCompleted": FieldValue.increment(1),
  });

  await batch.commit();

  // eslint-disable-next-line no-console
  console.log(`[completeOrder] completed order ${orderId}`);

  return { success: true };
});
