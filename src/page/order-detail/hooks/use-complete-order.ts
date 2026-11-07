// useCompleteOrder — mechanic finishes a job (InProgress → Completed).
// Runs via Cloud Function so the protected totalJobsCompleted counter
// can be incremented server-side (Firestore rules block client writes).

import { useMutation } from "@tanstack/react-query";

import { paymentService } from "@/services/payment-service";

// No cache invalidation: the order detail and provider Queue are live
// (onSnapshot), so the completion propagates to every listener on its own.
export const useCompleteOrder = () => {
  return useMutation({
    mutationFn: (orderId: string) => paymentService.completeOrder(orderId),
  });
};
