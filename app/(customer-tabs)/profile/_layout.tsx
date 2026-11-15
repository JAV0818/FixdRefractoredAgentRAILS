import { Stack } from "expo-router";

// Profile stack: the index is headerless; add-vehicle opts into a modal header
// via its own <Stack.Screen> options.
export default function CustomerProfileStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
