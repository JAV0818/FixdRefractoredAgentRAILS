// useCustomerActiveOrders — the customer's in-flight orders (Pending through
// InProgress), streamed live with their own query limit so history volume
// can't push active orders out of the result set.

import { useCallback } from "react";

import { orderService } from "@/services/order-service";
import {
  useFirestoreSubscription,
  type FirestoreSubscribe,
} from "@/hooks/use-firestore-subscription";
import type { RepairOrder } from "@/types/order.interface";

import { ACTIVE_STATUSES } from "../customer-requests.constants";

export const useCustomerActiveOrders = (customerId: string | undefined) => {
  const subscribe = useCallback<FirestoreSubscribe<RepairOrder[]>>(
    (onData, onError) => {
      if (!customerId) return;
      return orderService.subscribeToCustomerOrdersByStatus(
        customerId,
        ACTIVE_STATUSES,
        onData,
        onError,
      );
    },
    [customerId],
  );
  return useFirestoreSubscription(subscribe, "customer-active-orders");
};
