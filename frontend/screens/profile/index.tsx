import { SafeAreaView } from "react-native";
import { H3, ListItem, YGroup, YStack } from "tamagui";
import { ChevronRight, Group } from "@tamagui/lucide-icons";
import { router } from "expo-router";

function ProfileOptions() {
  return (
    <YGroup alignSelf="center" borderRadius={"$4"}>
      <YGroup.Item>
        <ListItem
          hoverTheme
          pressTheme
          title="Accounts"
          icon={Group}
          iconAfter={ChevronRight}
          onPress={() => router.push("/profile/accounts")}
        ></ListItem>
      </YGroup.Item>
      <YGroup.Item>
        <ListItem
          hoverTheme
          pressTheme
          title="Categories"
          icon={Group}
          iconAfter={ChevronRight}
          onPress={() => router.push("/profile/categories")}
        ></ListItem>
      </YGroup.Item>
    </YGroup>
  );
}

export default function Profile() {
  return (
    <SafeAreaView>
      <YStack paddingVertical={10} paddingHorizontal={20} gap={20}>
        <H3 fontWeight={"bold"}>Profile</H3>
        <ProfileOptions />
      </YStack>
    </SafeAreaView>
  );
}
