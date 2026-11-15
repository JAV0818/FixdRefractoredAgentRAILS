// Pure formatters for a saved Vehicle. Shared by the profile card, the quote
// wizard's picker, and the vehicleInfo string sent with an order.

import type { Vehicle } from "@/types/user.interface";

export const vehicleTitle = (v: Vehicle) => `${v.year} ${v.make} ${v.model}`.trim();

export const vehicleDetail = (v: Vehicle) => [v.color, v.licensePlate].filter(Boolean).join(" · ");

// "2019 Toyota Camry (Silver, ABC123)" — what the mechanic sees on the order.
export const vehicleSummary = (v: Vehicle) => {
  const extras = [v.color, v.licensePlate].filter(Boolean).join(", ");
  return extras ? `${vehicleTitle(v)} (${extras})` : vehicleTitle(v);
};
