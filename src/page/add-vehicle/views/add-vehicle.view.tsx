// Single-step add-vehicle form (react-hook-form + Zod). Saves via useAddVehicle
// and dismisses on success. Shows the cap message instead of the form when the
// customer already has MAX_VEHICLES (covers stale buttons / deep links).

import { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { HelperText, Text } from "react-native-paper";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";

import { AppButton, AppTextInput, KeyboardSafeView } from "@/components";
import { useCustomerVehicles } from "@/hooks/use-customer-vehicles";
import { colors, fontSize, spacing } from "@/theme";
import { MAX_VEHICLES } from "@/types/user.interface";

import { ADD_VEHICLE_COPY } from "../add-vehicle.constants";
import { addVehicleSchema, type AddVehicleForm } from "../interfaces/add-vehicle.interface";
import { useAddVehicle } from "../hooks/use-add-vehicle";

type FieldName = keyof AddVehicleForm;

const FIELDS: {
  name: FieldName;
  label: string;
  autoCapitalize: "words" | "characters" | "none";
  keyboardType?: "numeric";
  maxLength?: number;
}[] = [
  { name: "make", label: ADD_VEHICLE_COPY.make, autoCapitalize: "words" },
  { name: "model", label: ADD_VEHICLE_COPY.model, autoCapitalize: "words" },
  { name: "year", label: ADD_VEHICLE_COPY.year, autoCapitalize: "none", keyboardType: "numeric", maxLength: 4 },
  { name: "color", label: ADD_VEHICLE_COPY.color, autoCapitalize: "words" },
  { name: "licensePlate", label: ADD_VEHICLE_COPY.plate, autoCapitalize: "characters" },
];

export const AddVehicleView = () => {
  const router = useRouter();
  const { vehicles } = useCustomerVehicles();
  const addVehicle = useAddVehicle();

  const { control, handleSubmit } = useForm<AddVehicleForm>({
    resolver: zodResolver(addVehicleSchema),
    mode: "onTouched",
    defaultValues: { make: "", model: "", year: "", color: "", licensePlate: "" },
  });

  const onValid = useCallback(
    async (values: AddVehicleForm) => {
      try {
        await addVehicle.mutateAsync({
          make: values.make,
          model: values.model,
          year: values.year,
          color: values.color,
          licensePlate: values.licensePlate,
        });
        router.back();
      } catch {
        // Surfaced via addVehicle.isError below.
      }
    },
    [addVehicle, router],
  );

  if (vehicles.length >= MAX_VEHICLES) {
    return (
      <View style={styles.content}>
        <Text style={styles.subtitle}>{ADD_VEHICLE_COPY.capReached}</Text>
        <AppButton variant="tertiary" onPress={() => router.back()}>
          {ADD_VEHICLE_COPY.cancel}
        </AppButton>
      </View>
    );
  }

  return (
    <KeyboardSafeView contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>{ADD_VEHICLE_COPY.subtitle}</Text>

      <View style={styles.form}>
        {FIELDS.map((f) => (
          <Controller
            key={f.name}
            control={control}
            name={f.name}
            render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
              <AppTextInput
                label={f.label}
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                error={error?.message}
                autoCapitalize={f.autoCapitalize}
                keyboardType={f.keyboardType}
                maxLength={f.maxLength}
              />
            )}
          />
        ))}
      </View>

      {addVehicle.isError && (
        <HelperText type="error" visible style={styles.error}>
          {ADD_VEHICLE_COPY.saveError}
        </HelperText>
      )}

      <View style={styles.footer}>
        <AppButton variant="tertiary" onPress={() => router.back()} disabled={addVehicle.isPending}>
          {ADD_VEHICLE_COPY.cancel}
        </AppButton>
        <AppButton
          onPress={handleSubmit(onValid)}
          loading={addVehicle.isPending}
          disabled={addVehicle.isPending}
          style={styles.save}
        >
          {ADD_VEHICLE_COPY.save}
        </AppButton>
      </View>
    </KeyboardSafeView>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  save: {
    flex: 1,
  },
});
