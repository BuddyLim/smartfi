import { PressableHeader } from "components/PressableHeader";
import { Stack } from "expo-router";

export default function StatsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="add"
        options={() => {
          return {
            title: "Add Category",
            headerBackButtonDisplayMode: "minimal",
            headerLeft: () => <PressableHeader.Left />,
          };
        }}
      />
    </Stack>
  );
}
