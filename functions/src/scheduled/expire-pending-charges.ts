// Runs every 5 minutes. Clears pendingItems from InProgress orders whose
// 15-minute approval window has lapsed. Charges are removed — not merged.

import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore } from "firebase-admin/firestore";

export const expirePendingCharges = onSchedule(
  { schedule: "every 5 minutes" },
  async () => {
    const db = getFirestore();
    const now = Date.now();

    const staleSnap = await db
      .collection("repair-orders")
      .where("status", "==", "InProgress")
      .where("pendingItemsExpiresAt", "<=", now)
      .get();

    if (staleSnap.empty) {
      // eslint-disable-next-line no-console
      console.log("[expirePendingCharges] no expired pending charges found.");
      return;
    }

    let count = 0;
    for (const doc of staleSnap.docs) {
      await doc.ref.update({
        pendingItems: null,
        pendingItemsAddedAt: null,
        pendingItemsExpiresAt: null,
        updatedAt: now,
      });
      count++;
    }

    // eslint-disable-next-line no-console
    console.log(`[expirePendingCharges] cleared pending charges on ${count} orders.`);
  },
);
