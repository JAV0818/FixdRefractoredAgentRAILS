// Provider-public service — the only file that reads the `provider-public`
// collection: the customer-safe mirror of a mechanic (name, photo, rating, job
// count) maintained by the syncProviderPublic Cloud Function. Hooks call this;
// views and components never import it directly.

import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";

import type { ProviderPublic } from "@/types/user.interface";

import { db } from "./firebase";

export const providerPublicService = {
  // Live stream of one mechanic's public card. `undefined` when the doc doesn't
  // exist yet (e.g. a mechanic created before the backfill ran).
  subscribeToProviderPublic(
    providerId: string,
    onData: (provider: ProviderPublic | undefined) => void,
    onError: (error: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      doc(db, "provider-public", providerId),
      (snap) => {
        if (!snap.exists()) return onData(undefined);
        const d = snap.data();
        onData({
          id: snap.id,
          name: (d.name as string) ?? "",
          photoUrl: (d.photoUrl as string | null) ?? null,
          averageRating: (d.averageRating as number) ?? 0,
          totalRatingsCount: (d.totalRatingsCount as number) ?? 0,
          totalJobsCompleted: (d.totalJobsCompleted as number) ?? 0,
        });
      },
      onError,
    );
  },
};
