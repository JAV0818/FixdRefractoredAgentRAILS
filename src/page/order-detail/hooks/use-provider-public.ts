// useProviderPublic — live stream of a mechanic's public card (name, photo,
// rating) for the customer's order-detail screen. Subscribes only while the
// screen is mounted; opts out until a providerId exists.
// Returns { data, isLoading, isError, refetch }.

import { useCallback } from "react";

import {
  useFirestoreSubscription,
  type FirestoreSubscribe,
} from "@/hooks/use-firestore-subscription";
import { providerPublicService } from "@/services/provider-public-service";
import type { ProviderPublic } from "@/types/user.interface";

export const useProviderPublic = (providerId: string | undefined) => {
  const subscribe = useCallback<FirestoreSubscribe<ProviderPublic | undefined>>(
    (onData, onError) => {
      if (!providerId) return;
      return providerPublicService.subscribeToProviderPublic(providerId, onData, onError);
    },
    [providerId],
  );

  return useFirestoreSubscription(subscribe, "provider-public");
};
