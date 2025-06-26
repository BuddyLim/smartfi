import { PressableHeader } from "components/PressableHeader";
import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="categories"
        options={{
          title: "Categories",
          headerRight: () => (
            <PressableHeader.Right pathname="/profile/categories/add" />
          ),
          headerLeft: () => <PressableHeader.Left />,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="accounts"
        options={{
          title: "Accounts",
          headerRight: () => (
            <PressableHeader.Right pathname="/profile/accounts/add" />
          ),
          headerLeft: () => <PressableHeader.Left />,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="categories/add"
        options={() => {
          return {
            title: "Add Category",
            headerBackButtonDisplayMode: "minimal",
          };
        }}
      />
      <Stack.Screen
        name="accounts/add"
        options={() => {
          return {
            title: "Add Account",
            headerBackButtonDisplayMode: "minimal",
          };
        }}
      />
    </Stack>
  );
}
