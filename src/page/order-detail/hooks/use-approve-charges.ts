import { useMutation } from "@tanstack/react-query";

import { paymentService } from "@/services/payment-service";

export const useApproveCharges = () => {
  return useMutation({
    mutationFn: (orderId: string) => paymentService.approveCustomCharges(orderId),
  });
};
