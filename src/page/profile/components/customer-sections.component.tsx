// CustomerSections — the customer-only parts of the profile: saved vehicles
// (add / remove) and activity stats. Dumb: data in, events out.

import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";

import { AppButton, GlassCard, StatPill } from "@/components";
import { colors, fontSize, fontWeight, spacing } from "@/theme";
import { MAX_VEHICLES, type Vehicle } from "@/types/user.interface";
import { vehicleDetail, vehicleTitle } from "@/utils/vehicle";

import { PROFILE_COPY } from "../profile.constants";
import { formatRating } from "../utils/profile-format";

type CustomerSectionsProps = {
  vehicles: Vehicle[];
  averageRating: number | null;
  totalRatingsCount: number;
  completedOrdersCount: number;
  removingVehicleId: string | null;
  onAddVehicle: () => void;
  onRemoveVehicle: (vehicle: Vehicle) => void;
};

export const CustomerSections = memo(function CustomerSections({
  vehicles,
  averageRating,
  totalRatingsCount,
  completedOrdersCount,
  removingVehicleId,
  onAddVehicle,
  onRemoveVehicle,
}: CustomerSectionsProps) {
  return (
    <>
      <GlassCard style={styles.card}>
        <Text style={styles.title}>{PROFILE_COPY.vehiclesTitle}</Text>
        {vehicles.length === 0 ? (
          <Text style={styles.muted}>{PROFILE_COPY.noVehicles}</Text>
        ) : (
          vehicles.map((v) => {
            const detail = vehicleDetail(v);
            return (
              <View key={v.id} style={styles.vehicleRow}>
                <View style={styles.vehicle}>
                  <Text style={styles.vehicleName}>{vehicleTitle(v)}</Text>
                  {detail ? <Text style={styles.muted}>{detail}</Text> : null}
                </View>
                <IconButton
                  icon="trash-can-outline"
                  iconColor={colors.danger}
                  size={20}
                  disabled={removingVehicleId !== null}
                  loading={removingVehicleId === v.id}
                  onPress={() => onRemoveVehicle(v)}
                />
              </View>
            );
          })
        )}
        {vehicles.length < MAX_VEHICLES ? (
          <AppButton variant="tertiary" icon="plus" onPress={onAddVehicle}>
            {PROFILE_COPY.addVehicle}
          </AppButton>
        ) : null}
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.title}>{PROFILE_COPY.customerStatsTitle}</Text>
        <View style={styles.stats}>
          <StatPill
            label={`${PROFILE_COPY.rating}${totalRatingsCount ? ` (${totalRatingsCount})` : ""}`}
            value={formatRating(averageRating)}
          />
          <StatPill label={PROFILE_COPY.completedOrders} value={String(completedOrdersCount)} />
        </View>
      </GlassCard>
    </>
  );
});

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vehicle: {
    flex: 1,
    gap: spacing.xxs,
  },
  vehicleName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  muted: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  stats: {
    flexDirection: "row",
    gap: spacing.md,
  },
});
