// useCustomerHistoryOrders — the customer's finished orders (Completed,
// Cancelled, Expired), streamed live with their own query limit so active
// volume can't push history orders out of the result set.

import { useCallback } from "react";

import { orderService } from "@/services/order-service";
import {
  useFirestoreSubscription,
  type FirestoreSubscribe,
} from "@/hooks/use-firestore-subscription";
import type { RepairOrder } from "@/types/order.interface";

import { HISTORY_STATUSES } from "../customer-requests.constants";

export const useCustomerHistoryOrders = (customerId: string | undefined) => {
  const subscribe = useCallback<FirestoreSubscribe<RepairOrder[]>>(
    (onData, onError) => {
      if (!customerId) return;
      return orderService.subscribeToCustomerOrdersByStatus(
        customerId,
        HISTORY_STATUSES,
        onData,
        onError,
      );
    },
    [customerId],
  );
  return useFirestoreSubscription(subscribe, "customer-history-orders");
};
