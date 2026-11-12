// ProviderActions — the mechanic's status-aware actions on an order. View-tier:
// owns the provider-only hooks + side-effects (accept, build quote, start, cancel).
// The shared order-detail-success view renders this only when role === "provider".

import { useCallback } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { AppButton } from "@/components";
import { useAuthContext } from "@/providers/auth-provider";
import { spacing } from "@/theme";
import type { RepairOrder } from "@/types/order.interface";

import { ORDER_DETAIL_COPY } from "../order-detail.constants";
import { formatDateTime } from "@/utils/format";
import { useAcceptOrder } from "../hooks/use-accept-order";
import { useStartOrder } from "../hooks/use-start-order";
import { useCancelOrder } from "../hooks/use-cancel-order";
import { useCompleteOrder } from "../hooks/use-complete-order";
import { useRequestTimeExtension } from "../hooks/use-request-time-extension";
import { useMarkNoShow } from "../hooks/use-mark-no-show";
import { StatusHint } from "../components";

type ProviderActionsProps = {
  order: RepairOrder;
};

export const ProviderActions = ({ order }: ProviderActionsProps) => {
  const router = useRouter();
  const { currentUser } = useAuthContext();
  const isOwner = !!order.providerId && order.providerId === currentUser?.id;

  const acceptOrder = useAcceptOrder();
  const startOrder = useStartOrder();
  const cancelOrder = useCancelOrder();
  const completeOrder = useCompleteOrder();
  const requestExtension = useRequestTimeExtension();
  const markNoShow = useMarkNoShow();
  const { provider } = ORDER_DETAIL_COPY;
  const isBusy =
    startOrder.isPending || cancelOrder.isPending || requestExtension.isPending || markNoShow.isPending;

  const onAccept = useCallback(() => {
    acceptOrder.mutate(order.id, {
      onSuccess: () => {
        // The order is now ours: it leaves the marketplace pool and belongs to
        // the Queue. Clear the marketplace stack (so returning to that tab shows
        // the pool, not this now-stale detail) and continue managing the job
        // from the Queue — which also keeps Build quote / inspection pushing onto
        // the Queue stack instead of stranding the Marketplace tab on them.
        if (router.canDismiss()) router.dismissAll();
        router.navigate({
          pathname: "/(provider-tabs)/queue/[orderId]",
          params: { orderId: order.id },
        });
      },
      onError: (error) => {
        Alert.alert(
          provider.acceptErrorTitle,
          error instanceof Error ? error.message : provider.acceptErrorFallback,
        );
      },
    });
  }, [acceptOrder, order.id, provider, router]);

  const onBuildQuote = useCallback(() => {
    router.push({
      pathname: "/(provider-tabs)/queue/quote-builder",
      params: { orderId: order.id },
    });
  }, [router, order.id]);

  const onStart = useCallback(() => {
    startOrder.mutate(order.id, {
      onError: (error) => {
        Alert.alert(
          "Couldn't start job",
          error instanceof Error ? error.message : "Something went wrong. Please try again.",
        );
      },
    });
  }, [startOrder, order.id]);

  const onChat = useCallback(() => {
    if (!order.customerId) return;
    router.push({
      pathname: "/(provider-tabs)/messages/[conversationId]",
      params: {
        conversationId: order.customerId,
        orderId: order.id,
      },
    });
  }, [order.customerId, order.id, router]);

  const onCancel = useCallback(() => {
    if (!currentUser) return;
    Alert.alert(provider.cancelTitle, provider.cancelBody, [
      { text: provider.keep, style: "cancel" },
      {
        text: provider.cancelConfirm,
        style: "destructive",
        onPress: () =>
          cancelOrder.mutate({
            orderId: order.id,
            cancelledBy: currentUser.id,
            reason: "mechanic_cancelled",
          }),
      },
    ]);
  }, [provider, cancelOrder, order.id, currentUser]);

  const onInspect = useCallback(() => {
    router.push({ pathname: "/(provider-tabs)/queue/inspection", params: { orderId: order.id } });
  }, [router, order.id]);

  const onAddCharges = useCallback(() => {
    router.push({ pathname: "/(provider-tabs)/queue/custom-charge", params: { orderId: order.id } });
  }, [router, order.id]);

  const onComplete = useCallback(() => {
    completeOrder.mutate(order.id, {
      onError: (error) => {
        Alert.alert(
          provider.completeErrorTitle,
          error instanceof Error ? error.message : provider.completeErrorFallback,
        );
      },
    });
  }, [completeOrder, order.id, provider]);

  const onRequestExtension = useCallback(() => {
    Alert.alert(provider.extensionTitle, provider.extensionBody, [
      { text: "15 minutes", onPress: () => requestExtension.mutate({ orderId: order.id, minutes: 15 }) },
      { text: "30 minutes", onPress: () => requestExtension.mutate({ orderId: order.id, minutes: 30 }) },
      { text: "45 minutes", onPress: () => requestExtension.mutate({ orderId: order.id, minutes: 45 }) },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [provider, requestExtension, order.id]);

  const onMarkNoShow = useCallback(() => {
    Alert.alert(provider.noShowTitle, provider.noShowBody, [
      { text: provider.keep, style: "cancel" },
      {
        text: provider.noShowConfirm,
        style: "destructive",
        onPress: () => markNoShow.mutate(order.id),
      },
    ]);
  }, [provider, markNoShow, order.id]);

  const onRecordCashPayment = useCallback(() => {
    router.push({
      pathname: "/(provider-tabs)/queue/[orderId]/collect-payment",
      params: { orderId: order.id },
    });
  }, [router, order.id]);

  const showRecordCashPayment =
    (order.status === "Completed" || order.status === "InProgress") &&
    order.remainingBalance > 0 &&
    order.paymentStatus !== "paid";

  if (order.status === "Pending") {
    return (
      <View style={styles.actions}>
        <AppButton onPress={onAccept} loading={acceptOrder.isPending} disabled={acceptOrder.isPending}>
          {provider.accept}
        </AppButton>
      </View>
    );
  }

  if (order.status === "Accepted" && isOwner) {
    return (
      <View style={styles.actions}>
        <AppButton onPress={onBuildQuote}>{provider.buildQuote}</AppButton>
      </View>
    );
  }

  if (order.status === "QuoteProposed" && isOwner) {
    return (
      <View style={styles.actions}>
        <StatusHint text={provider.waitingApproval} />
        <AppButton variant="secondary" onPress={onChat}>
          {provider.chat}
        </AppButton>
      </View>
    );
  }

  if (order.status === "Scheduled" && isOwner) {
    const gracePassed = Date.now() >= (order.scheduledAt ?? 0) + 15 * 60 * 1000;

    return (
      <View style={styles.actions}>
        <AppButton onPress={onStart} loading={startOrder.isPending} disabled={isBusy}>
          {provider.start}
        </AppButton>

        {!order.timeExtensionRequestedAt && (
          <AppButton variant="secondary" onPress={onRequestExtension} disabled={isBusy}>
            {provider.requestExtension}
          </AppButton>
        )}

        {order.timeExtensionRequestedAt && !order.timeExtensionApprovedAt && (
          <StatusHint text={provider.extensionPending} />
        )}

        {order.timeExtensionApprovedAt && order.extendedScheduledAt && (
          <StatusHint text={provider.extensionApproved(formatDateTime(order.extendedScheduledAt))} />
        )}

        {gracePassed && (
          <AppButton variant="danger" onPress={onMarkNoShow} loading={markNoShow.isPending} disabled={isBusy}>
            {provider.markNoShow}
          </AppButton>
        )}

        <AppButton variant="secondary" onPress={onChat} disabled={isBusy}>
          {provider.chat}
        </AppButton>
        <AppButton variant="danger" onPress={onCancel} disabled={isBusy}>
          {provider.cancel}
        </AppButton>
      </View>
    );
  }

  if (order.status === "InProgress" && isOwner) {
    const isPaymentBlocked = !order.inspectionCompletedAt;
    const hasChargesPending =
      !!order.pendingItems && order.pendingItems.length > 0;
    const isBlocked = isPaymentBlocked || hasChargesPending;

    return (
      <View style={styles.actions}>
        <AppButton
          onPress={onComplete}
          loading={completeOrder.isPending}
          disabled={isBlocked || completeOrder.isPending}
        >
          {provider.complete}
        </AppButton>
        {showRecordCashPayment && (
          <AppButton
            variant="secondary"
            onPress={onRecordCashPayment}
            disabled={isBlocked || completeOrder.isPending}
          >
            {provider.recordCashPayment}
          </AppButton>
        )}
        {!isPaymentBlocked && (
          <AppButton
            variant="secondary"
            onPress={onAddCharges}
            disabled={hasChargesPending || completeOrder.isPending}
          >
            {provider.addCharges}
          </AppButton>
        )}
        <AppButton variant="secondary" onPress={onInspect} disabled={completeOrder.isPending}>
          {isPaymentBlocked ? provider.inspect : provider.editInspection}
        </AppButton>
        <AppButton variant="secondary" onPress={onChat} disabled={completeOrder.isPending}>
          {provider.chat}
        </AppButton>
        {isPaymentBlocked && <StatusHint text={provider.inspectionRequiredHint} />}
        {hasChargesPending && !isPaymentBlocked && (
          <StatusHint text={provider.chargesPendingHint} />
        )}
      </View>
    );
  }

  if (order.status === "Completed" && isOwner) {
    return (
      <View style={styles.actions}>
        {showRecordCashPayment && (
          <AppButton variant="secondary" onPress={onRecordCashPayment}>
            {provider.recordCashPayment}
          </AppButton>
        )}
        <AppButton variant="secondary" onPress={onChat}>
          {provider.chat}
        </AppButton>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
