// useAddVehicle — save a new vehicle to the signed-in customer's profile, then
// refresh the profile query so the profile screen and quote wizard pick it up.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthContext } from "@/providers/auth-provider";
import { userService } from "@/services/user-service";
import type { UserProfile, VehicleInput } from "@/types/user.interface";

export const useAddVehicle = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuthContext();
  return useMutation({
    mutationFn: (vehicle: VehicleInput) => {
      if (!currentUser) throw new Error("Not authenticated");
      return userService.addVehicle(currentUser.id, vehicle);
    },
    // The transaction returns the saved list; write it into the profile cache so
    // the UI updates instantly (a refetch can read a stale local copy).
    onSuccess: (vehicles) => {
      queryClient.setQueryData<UserProfile | null>(["userProfile", currentUser?.id], (old) =>
        old ? { ...old, vehicles } : old,
      );
    },
  });
};
