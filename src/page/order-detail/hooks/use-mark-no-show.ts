import { useMutation } from "@tanstack/react-query";

import { paymentService } from "@/services/payment-service";

export const useMarkNoShow = () => {
  return useMutation({
    mutationFn: (orderId: string) => paymentService.markCustomerNoShow(orderId),
  });
};
