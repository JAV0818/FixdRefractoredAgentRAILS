// useCustomerVehicles — the signed-in customer's saved vehicles, read from the
// shared user-profile query (no extra Firestore listener).

import { useAuthContext } from "@/providers/auth-provider";
import { useUserProfile } from "@/page/auth/hooks/use-user-profile";
import type { Vehicle } from "@/types/user.interface";

const NO_VEHICLES: Vehicle[] = [];

export const useCustomerVehicles = () => {
  const { currentUser } = useAuthContext();
  const { data, isLoading } = useUserProfile(currentUser?.id);
  return { vehicles: data?.vehicles ?? NO_VEHICLES, isLoading };
};
