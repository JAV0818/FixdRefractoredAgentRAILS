import { useCallback } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SegmentedButtons, Text } from "react-native-paper";
import { useRouter } from "expo-router";

import { AppButton, OrderListItem } from "@/components";
import { colors, fontSize, fontWeight, spacing } from "@/theme";
import { TAB_BAR_CLEARANCE } from "@/constants/layout";
import { formatCurrency, formatDate } from "@/utils/format";
import type { RepairOrder } from "@/types/order.interface";

import {
  CUSTOMER_REQUESTS_COPY,
  REQUEST_TABS,
  type RequestTab,
} from "../customer-requests.constants";

type CustomerRequestsSuccessViewProps = {
  activeOrders: RepairOrder[];
  historyOrders: RepairOrder[];
  tab: RequestTab;
  onTabChange: (tab: RequestTab) => void;
};

const trailingFor = (order: RepairOrder): string => {
  if (order.totalPrice > 0) return formatCurrency(order.totalPrice);
  if (order.estimatedTotal > 0) return `~${formatCurrency(order.estimatedTotal)}`;
  return formatDate(order.createdAt);
};

export const CustomerRequestsSuccessView = ({
  activeOrders,
  historyOrders,
  tab,
  onTabChange,
}: CustomerRequestsSuccessViewProps) => {
  const router = useRouter();
  const orders = tab === "active" ? activeOrders : historyOrders;

  const openOrder = useCallback(
    (orderId: string) => {
      router.push({
        pathname: "/(customer-tabs)/requests/[orderId]",
        params: { orderId },
      });
    },
    [router],
  );

  const emptyTitle =
    tab === "active"
      ? CUSTOMER_REQUESTS_COPY.emptyActiveTitle
      : CUSTOMER_REQUESTS_COPY.emptyHistoryTitle;

  const emptyBody =
    tab === "active"
      ? CUSTOMER_REQUESTS_COPY.emptyActiveBody
      : CUSTOMER_REQUESTS_COPY.emptyHistoryBody;

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={tab}
        onValueChange={(v) => onTabChange(v as RequestTab)}
        buttons={REQUEST_TABS.map((t) => ({ value: t.value, label: t.label }))}
        style={styles.tabs}
      />

      {orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyBody}>{emptyBody}</Text>
          {tab === "active" && (
            <AppButton onPress={() => router.push("/(customer-tabs)/services")}>
              Browse services
            </AppButton>
          )}
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(order) => order.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <OrderListItem
              title={item.vehicleInfo}
              subtitle={item.description}
              status={item.status}
              trailing={trailingFor(item)}
              onPress={() => openOrder(item.id)}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  emptyBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
