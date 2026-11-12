import { useMutation } from "@tanstack/react-query";

import { paymentService } from "@/services/payment-service";

export const useRespondToExtension = () => {
  return useMutation({
    mutationFn: ({ orderId, approve }: { orderId: string; approve: boolean }) =>
      paymentService.respondToTimeExtension(orderId, approve),
  });
};
