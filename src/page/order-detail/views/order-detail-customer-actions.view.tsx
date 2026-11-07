// CustomerActions — the customer's status-aware actions on an order. View-tier:
// owns the customer-only hooks + side-effects (approve / decline / cancel with
// confirm) and the passive "waiting" hints.

import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";

import { AppButton } from "@/components";
import { colors, fontSize, spacing } from "@/theme";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { useAuthContext } from "@/providers/auth-provider";
import { PLATFORM_DEPOSIT, CANCELLATION_WINDOW_MS } from "@/services/order-service";
import type { RepairOrder } from "@/types/order.interface";

import { ORDER_DETAIL_COPY } from "../order-detail.constants";
import { useApproveQuote } from "../hooks/use-approve-quote";
import { useDeclineQuote } from "../hooks/use-decline-quote";
import { useCancelOrder } from "../hooks/use-cancel-order";
import { useApproveCharges } from "../hooks/use-approve-charges";
import { useRejectCharges } from "../hooks/use-reject-charges";
import { StatusHint } from "../components";

type CustomerActionsProps = {
  order: RepairOrder;
};

export const CustomerActions = ({ order }: CustomerActionsProps) => {
  const router = useRouter();
  const { currentUser } = useAuthContext();
  const approveQuote = useApproveQuote();
  const declineQuote = useDeclineQuote();
  const cancelOrder = useCancelOrder();
  const approveCharges = useApproveCharges();
  const rejectCharges = useRejectCharges();
  const isBusy =
    approveQuote.isPending ||
    declineQuote.isPending ||
    cancelOrder.isPending ||
    approveCharges.isPending ||
    rejectCharges.isPending;

  const { customer, depositNote } = ORDER_DETAIL_COPY;

  // Countdown timer for pending charges
  const hasPending =
    !!order.pendingItems && order.pendingItems.length > 0 && !!order.pendingItemsExpiresAt;
  const [remainingMs, setRemainingMs] = useState(() =>
    hasPending ? Math.max((order.pendingItemsExpiresAt ?? 0) - Date.now(), 0) : 0,
  );

  useEffect(() => {
    if (!hasPending) {
      setRemainingMs(0);
      return;
    }
    const tick = () => setRemainingMs(Math.max((order.pendingItemsExpiresAt ?? 0) - Date.now(), 0));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [hasPending, order.pendingItemsExpiresAt]);

  const onApprove = useCallback(() => approveQuote.mutate(order.id), [approveQuote, order.id]);

  const onMessageProvider = useCallback(() => {
    if (!order.providerId) return;
    router.push({
      pathname: "/(customer-tabs)/messages/[conversationId]",
      params: {
        conversationId: order.providerId,
        orderId: order.id,
      },
    });
  }, [order.providerId, order.id, router]);

  const onDecline = useCallback(() => {
    Alert.alert(customer.declineTitle, customer.declineBody, [
      { text: customer.keepQuote, style: "cancel" },
      {
        text: customer.declineConfirm,
        style: "destructive",
        onPress: () => declineQuote.mutate(order.id),
      },
    ]);
  }, [customer, declineQuote, order.id]);

  const onApproveCharges = useCallback(
    () => approveCharges.mutate(order.id),
    [approveCharges, order.id],
  );

  const onRejectCharges = useCallback(() => {
    Alert.alert(customer.rejectChargesTitle, customer.rejectChargesBody, [
      { text: customer.keepCharges, style: "cancel" },
      {
        text: customer.rejectChargesConfirm,
        style: "destructive",
        onPress: () => rejectCharges.mutate(order.id),
      },
    ]);
  }, [customer, rejectCharges, order.id]);

  const onCancelService = useCallback(() => {
    if (!currentUser) return;
    const timeUntil = (order.scheduledAt ?? 0) - Date.now();
    const isFree = timeUntil >= CANCELLATION_WINDOW_MS;
    const body = isFree ? customer.cancelBodyFree : customer.cancelBodyCharged;

    Alert.alert(customer.cancelTitle, body, [
      { text: customer.keepService, style: "cancel" },
      {
        text: customer.cancelConfirm,
        style: "destructive",
        onPress: () =>
          cancelOrder.mutate({
            orderId: order.id,
            cancelledBy: currentUser.id,
            reason: "customer_cancelled",
          }),
      },
    ]);
  }, [customer, cancelOrder, currentUser, order.id, order.scheduledAt]);

  if (order.status === "Pending") return <StatusHint text={customer.waitingMechanic} />;
  if (order.status === "Accepted") return <StatusHint text={customer.waitingQuote} />;

  if (order.status === "Scheduled" && order.scheduledAt) {
    return (
      <View style={styles.actions}>
        <StatusHint text={customer.scheduledFor(formatDateTime(order.scheduledAt))} />
        <AppButton variant="secondary" onPress={onMessageProvider}>
          {customer.messageProvider}
        </AppButton>
        <AppButton variant="danger" onPress={onCancelService} loading={cancelOrder.isPending} disabled={isBusy}>
          {customer.cancelService}
        </AppButton>
      </View>
    );
  }

  if (order.status === "InProgress" || order.status === "Completed") {
    const expired = hasPending && remainingMs <= 0;
    const showPending = hasPending && !expired;
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    const countdown = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    return (
      <View style={styles.actions}>
        {showPending && (
          <View style={styles.pendingCard}>
            <Text style={styles.pendingTitle}>{customer.pendingChargesTitle}</Text>
            {order.pendingItems!.map((item, i) => (
              <View key={i} style={styles.pendingRow}>
                <Text style={styles.pendingItemName}>
                  {item.name} x{item.quantity}
                </Text>
                <Text style={styles.pendingItemPrice}>
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            ))}
            <Text style={styles.countdown}>Expires in {countdown}</Text>
            <AppButton
              onPress={onApproveCharges}
              loading={approveCharges.isPending}
              disabled={isBusy}
            >
              {customer.approveCharges}
            </AppButton>
            <AppButton variant="danger" onPress={onRejectCharges} disabled={isBusy}>
              {customer.rejectCharges}
            </AppButton>
          </View>
        )}
        {expired && <StatusHint text={customer.chargesExpired} />}
        <AppButton variant="secondary" onPress={onMessageProvider}>
          {customer.messageProvider}
        </AppButton>
      </View>
    );
  }

  if (order.status === "QuoteProposed") {
    return (
      <View style={styles.actions}>
        <Text style={styles.depositNote}>{depositNote(formatCurrency(PLATFORM_DEPOSIT))}</Text>
        <AppButton onPress={onApprove} loading={approveQuote.isPending} disabled={isBusy}>
          {customer.approve}
        </AppButton>
        <AppButton variant="danger" onPress={onDecline} disabled={isBusy}>
          {customer.decline}
        </AppButton>
        <AppButton variant="secondary" onPress={onMessageProvider} disabled={isBusy}>
          {customer.messageProvider}
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
  depositNote: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: "center",
  },
  pendingCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pendingTitle: {
    fontSize: fontSize.base,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  pendingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pendingItemName: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  pendingItemPrice: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  countdown: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
