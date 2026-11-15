// useRemoveVehicle — remove a saved vehicle (by id) from the signed-in
// customer's profile and patch the profile query cache.

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuthContext } from "@/providers/auth-provider";
import { userService } from "@/services/user-service";
import type { UserProfile } from "@/types/user.interface";

export const useRemoveVehicle = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuthContext();
  return useMutation({
    mutationFn: (vehicleId: string) => {
      if (!currentUser) throw new Error("Not authenticated");
      return userService.removeVehicle(currentUser.id, vehicleId);
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
