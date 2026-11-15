import { useMutation } from "@tanstack/react-query";

import { useAuthContext } from "@/providers/auth-provider";
import { userService } from "@/services/user-service";
import type { VehicleInput } from "@/types/user.interface";

export const useSaveVehicle = () => {
  const { currentUser } = useAuthContext();
  return useMutation({
    mutationFn: (vehicle: VehicleInput) => {
      if (!currentUser) throw new Error("Not authenticated");
      return userService.addVehicle(currentUser.id, vehicle);
    },
  });
};
