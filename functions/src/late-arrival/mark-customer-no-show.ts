import { HttpsError, onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import Stripe from "stripe";

interface MarkCustomerNoShowRequest {
  orderId: string;
}

const GRACE_PERIOD_MS = 15 * 60 * 1000;

export const markCustomerNoShow = onCall<MarkCustomerNoShowRequest>(
  { secrets: ["STRIPE_SECRET_KEY"] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const { orderId } = request.data;
    if (!orderId || typeof orderId !== "string") {
      throw new HttpsError("invalid-argument", "orderId is required.");
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
      scheduledAt: number | null;
      stripePaymentIntentId: string | null;
      paymentStatus: string;
    };

    if (order.providerId !== request.auth.uid) {
      throw new HttpsError("permission-denied", "Only the assigned mechanic can mark a no-show.");
    }

    if (order.status !== "Scheduled") {
      throw new HttpsError("failed-precondition", "Only scheduled jobs can be marked as no-show.");
    }

    if (!order.scheduledAt || Date.now() < order.scheduledAt + GRACE_PERIOD_MS) {
      throw new HttpsError("failed-precondition", "Grace period has not elapsed.");
    }

    const now = Date.now();

    // Capture the $35 hold if it hasn't been captured yet.
    if (order.stripePaymentIntentId && order.paymentStatus === "authorized") {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (!secretKey) {
        throw new HttpsError("failed-precondition", "Stripe secret key is not configured.");
      }
      const stripe = new Stripe(secretKey, { apiVersion: "2026-06-24.dahlia" });
      try {
        await stripe.paymentIntents.capture(order.stripePaymentIntentId);
        // eslint-disable-next-line no-console
        console.log(`[markCustomerNoShow] captured hold ${order.stripePaymentIntentId}`);
      } catch (err) {
        console.error(`[markCustomerNoShow] failed to capture hold:`, err);
        throw new HttpsError("internal", "Failed to capture deposit.");
      }
    }

    await orderRef.update({
      status: "Cancelled",
      cancellationReason: "customer_no_show",
      cancelledAt: now,
      cancelledBy: order.providerId,
      customerNoShowAt: now,
      depositCapturedAt: now,
      paymentStatus: "deposit_paid",
      updatedAt: now,
    });

    // eslint-disable-next-line no-console
    console.log(`[markCustomerNoShow] marked no-show for order ${orderId}`);

    return { success: true };
  },
);
