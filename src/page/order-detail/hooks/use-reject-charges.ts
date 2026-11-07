import { useMutation } from "@tanstack/react-query";

import { paymentService } from "@/services/payment-service";

export const useRejectCharges = () => {
  return useMutation({
    mutationFn: (orderId: string) => paymentService.rejectCustomCharges(orderId),
  });
};
