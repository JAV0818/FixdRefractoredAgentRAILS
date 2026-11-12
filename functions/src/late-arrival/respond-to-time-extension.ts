import { HttpsError, onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import Stripe from "stripe";

interface RespondToTimeExtensionRequest {
  orderId: string;
  approve: boolean;
}

export const respondToTimeExtension = onCall<RespondToTimeExtensionRequest>(
  { secrets: ["STRIPE_SECRET_KEY"] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const { orderId, approve } = request.data;
    if (!orderId || typeof orderId !== "string") {
      throw new HttpsError("invalid-argument", "orderId is required.");
    }
    if (typeof approve !== "boolean") {
      throw new HttpsError("invalid-argument", "approve must be a boolean.");
    }

    const db = getFirestore();
    const orderRef = db.collection("repair-orders").doc(orderId);
    const snap = await orderRef.get();

    if (!snap.exists) {
      throw new HttpsError("not-found", "Order not found.");
    }

    const order = snap.data() as {
      customerId: string;
      timeExtensionRequestedAt: number | null;
      timeExtensionApprovedAt: number | null;
      timeExtensionMinutes: number | null;
      stripePaymentIntentId: string | null;
      paymentStatus: string;
    };

    if (order.customerId !== request.auth.uid) {
      throw new HttpsError("permission-denied", "Only the customer can respond to an extension.");
    }

    if (!order.timeExtensionRequestedAt) {
      throw new HttpsError("failed-precondition", "No extension request to respond to.");
    }

    if (order.timeExtensionApprovedAt) {
      throw new HttpsError("failed-precondition", "This extension has already been approved.");
    }

    const now = Date.now();

    if (approve) {
      const extendedScheduledAt = now + (order.timeExtensionMinutes ?? 15) * 60 * 1000;
      await orderRef.update({
        timeExtensionApprovedAt: now,
        extendedScheduledAt,
        updatedAt: now,
      });

      // eslint-disable-next-line no-console
      console.log(`[respondToTimeExtension] customer approved extension for order ${orderId}`);
      return { success: true };
    }

    // Customer declining — release Stripe hold and cancel order.
    if (order.stripePaymentIntentId && order.paymentStatus === "authorized") {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (secretKey) {
        const stripe = new Stripe(secretKey, { apiVersion: "2026-06-24.dahlia" });
        try {
          await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
          await orderRef.update({
            paymentStatus: "released",
            depositReleasedAt: now,
          });
          // eslint-disable-next-line no-console
          console.log(`[respondToTimeExtension] released hold ${order.stripePaymentIntentId}`);
        } catch (err) {
          console.error(`[respondToTimeExtension] failed to release hold:`, err);
        }
      }
    }

    await orderRef.update({
      status: "Cancelled",
      cancellationReason: "mechanic_no_show",
      cancelledAt: now,
      cancelledBy: request.auth.uid,
      updatedAt: now,
    });

    // eslint-disable-next-line no-console
    console.log(`[respondToTimeExtension] customer declined extension, cancelled order ${orderId}`);
    return { success: true };
  },
);
