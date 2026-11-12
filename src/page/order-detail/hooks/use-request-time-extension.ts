import { useMutation } from "@tanstack/react-query";

import { paymentService } from "@/services/payment-service";

export const useRequestTimeExtension = () => {
  return useMutation({
    mutationFn: ({ orderId, minutes }: { orderId: string; minutes: number }) =>
      paymentService.requestTimeExtension(orderId, minutes),
  });
};
