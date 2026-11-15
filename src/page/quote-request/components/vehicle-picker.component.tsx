// VehiclePicker — selectable list of the customer's saved vehicles plus an
// "add a vehicle" row. Dumb: data in, events out. Selection is by Vehicle.id.

import { memo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { colors, fontSize, fontWeight, radii, spacing } from "@/theme";
import { MAX_VEHICLES, type Vehicle } from "@/types/user.interface";
import { vehicleDetail, vehicleTitle } from "@/utils/vehicle";

import { QUOTE_REQUEST_COPY } from "../quote-request.constants";

type VehiclePickerProps = {
  vehicles: Vehicle[];
  selected: string | null;
  onSelect: (vehicle: Vehicle) => void;
  onAddNew: () => void;
};

export const VehiclePicker = memo(function VehiclePicker({
  vehicles,
  selected,
  onSelect,
  onAddNew,
}: VehiclePickerProps) {
  const canAdd = vehicles.length < MAX_VEHICLES;
  const { vehiclePicker } = QUOTE_REQUEST_COPY;

  return (
    <View style={styles.list}>
      {vehicles.map((v) => {
        const isSelected = v.id === selected;
        const detail = vehicleDetail(v);
        return (
          <TouchableOpacity
            key={v.id}
            activeOpacity={0.7}
            onPress={() => onSelect(v)}
            style={[styles.row, isSelected && styles.rowSelected]}
          >
            <View style={styles.text}>
              <Text style={styles.name}>{vehicleTitle(v)}</Text>
              {detail ? <Text style={styles.detail}>{detail}</Text> : null}
            </View>
            {isSelected ? (
              <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
            ) : null}
          </TouchableOpacity>
        );
      })}

      {canAdd ? (
        <TouchableOpacity activeOpacity={0.7} onPress={onAddNew} style={styles.addRow}>
          <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
          <Text style={styles.addText}>
            {vehicles.length === 0 ? vehiclePicker.addFirst : vehiclePicker.addAnother}
          </Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.detail}>{vehiclePicker.capHint}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.outline,
    padding: spacing.lg,
  },
  rowSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  detail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primary,
    padding: spacing.lg,
  },
  addText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
});
