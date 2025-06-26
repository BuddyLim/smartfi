import { PressableHeader } from "components/PressableHeader";
import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="add"
        options={{
          title: "Add Transactions",
          headerLeft: () => <PressableHeader.Left />,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
    </Stack>
  );
}
