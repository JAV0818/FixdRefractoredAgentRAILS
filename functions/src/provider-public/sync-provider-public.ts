// Mirrors the customer-safe slice of every mechanic's `users/{uid}` doc into
// `provider-public/{uid}`. Customers can't read other users' docs (that doc holds
// email, phone and earnings), so screens that show a mechanic read this mirror.
//
// Source of truth stays `users`. Anything that later updates the rating
// (providerProfile.averageRating / totalRatingsCount) is picked up here
// automatically — no second write path to keep in sync.

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getFirestore } from "firebase-admin/firestore";

import { sameProviderPublic, toProviderPublic, type ProviderPublicDoc } from "./provider-public-data";

export const syncProviderPublic = onDocumentWritten("users/{uid}", async (event) => {
  const uid = event.params.uid;
  const ref = getFirestore().collection("provider-public").doc(uid);

  const after = event.data?.after;
  const next = after?.exists ? toProviderPublic(after.data()) : null;

  if (!next) {
    // Not a mechanic (or the user doc is gone): make sure no stale mirror stays.
    if (event.data?.before?.exists) await ref.delete();
    return;
  }

  // users docs change for unrelated reasons (FCM tokens, vehicles, availability);
  // skip the write when the public slice is identical.
  const current = (await ref.get()).data() as ProviderPublicDoc | undefined;
  if (sameProviderPublic(next, current)) return;

  await ref.set({ ...next, updatedAt: Date.now() });
});
