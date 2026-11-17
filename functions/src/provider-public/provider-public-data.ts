// Pure mapping from a `users/{uid}` document to its public mirror. Kept free of
// Firebase imports so it is trivial to reason about (and to reuse in the
// backfill script's logic).

export type ProviderPublicDoc = {
  averageRating: number;
  name: string;
  photoUrl: string | null;
  totalJobsCompleted: number;
  totalRatingsCount: number;
};

// Returns null when the user is not a mechanic (nothing to publish).
export const toProviderPublic = (
  data: Record<string, unknown> | undefined,
): ProviderPublicDoc | null => {
  if (!data || data.role !== "provider") return null;
  const profile = (data.providerProfile ?? {}) as Record<string, unknown>;
  const first = typeof data.firstName === "string" ? data.firstName : "";
  const last = typeof data.lastName === "string" ? data.lastName : "";
  const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  return {
    name: `${first} ${last}`.trim() || "Mechanic",
    photoUrl: typeof data.photoUrl === "string" ? data.photoUrl : null,
    averageRating: num(profile.averageRating),
    totalRatingsCount: num(profile.totalRatingsCount),
    totalJobsCompleted: num(profile.totalJobsCompleted),
  };
};

export const sameProviderPublic = (a: ProviderPublicDoc, b: ProviderPublicDoc | undefined): boolean =>
  !!b &&
  a.name === b.name &&
  a.photoUrl === b.photoUrl &&
  a.averageRating === b.averageRating &&
  a.totalRatingsCount === b.totalRatingsCount &&
  a.totalJobsCompleted === b.totalJobsCompleted;
