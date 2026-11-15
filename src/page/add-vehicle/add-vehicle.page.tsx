// Composition shell for the Add Vehicle modal. The native header is replaced by
// our own centered title under the top safe-area inset, so the title never
// slides behind the status bar (time / battery / wifi) however the modal is
// presented. The same page is mounted from the Profile and Services stacks so
// dismissing returns to whichever screen opened it.

import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";

import { colors, fontSize, fontWeight, spacing } from "@/theme";

import { ADD_VEHICLE_COPY } from "./add-vehicle.constants";
import { AddVehicleView } from "./views";

export const AddVehiclePage = () => (
  <>
    <Stack.Screen options={{ headerShown: false, presentation: "modal" }} />
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{ADD_VEHICLE_COPY.title}</Text>
      </View>
      <AddVehicleView />
    </SafeAreaView>
  </>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: "center",
  },
});
