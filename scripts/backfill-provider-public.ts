// One-off: create provider-public/{uid} for every existing mechanic. New and
// edited mechanics are handled by the syncProviderPublic Cloud Function; this
// covers the ones that existed before it was deployed.
//
// Self-contained on purpose: this runs as a plain ES module, which can't import
// the functions source without file extensions. The mapping below must stay in
// sync with functions/src/provider-public/provider-public-data.ts.
//
// Usage: npx ts-node scripts/backfill-provider-public.ts

import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

const toProviderPublic = (data: Record<string, unknown>) => {
  const profile = (data.providerProfile ?? {}) as Record<string, unknown>;
  const first = typeof data.firstName === "string" ? data.firstName : "";
  const last = typeof data.lastName === "string" ? data.lastName : "";
  return {
    name: `${first} ${last}`.trim() || "Mechanic",
    photoUrl: typeof data.photoUrl === "string" ? data.photoUrl : null,
    averageRating: num(profile.averageRating),
    totalRatingsCount: num(profile.totalRatingsCount),
    totalJobsCompleted: num(profile.totalJobsCompleted),
  };
};

async function main() {
  const snap = await db.collection("users").where("role", "==", "provider").get();
  for (const doc of snap.docs) {
    await db
      .collection("provider-public")
      .doc(doc.id)
      .set({ ...toProviderPublic(doc.data()), updatedAt: Date.now() });
  }
  console.log(`Backfilled ${snap.size} provider-public docs.`);
}

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
