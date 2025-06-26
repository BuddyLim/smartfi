import { HapticTab } from "components/HapticTab";
import BlurTabBarBackground from "components/ui/TabBarBackground.ios";
import { Colors } from "constants/Colors";
import {
  Tabs,
  useNavigation,
  usePathname,
  useRootNavigationState,
} from "expo-router";
import { useColorScheme } from "hooks/useColorScheme.web";
import { Platform } from "react-native";
import { ChartSpline, DollarSign, Settings } from "@tamagui/lucide-icons";
import TabBarIcon from "components/ui/TabBarIcon";
import { View } from "tamagui";
import { useRouteInfo } from "expo-router/build/hooks";

const hiddenTabPath = ["(tabs)/(index)/add"];

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const { segments } = useRouteInfo();
  const path = segments.join("/");

  const shouldHide = hiddenTabPath.includes(path);

  const platformStyle = Platform.select({
    ios: {
      position: "absolute",
    },
    default: {},
  });

  return (
    <Tabs
      screenOptions={{
        hiddenTabPath: hiddenTabPath,
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: BlurTabBarBackground,
        tabBarStyle: {
          ...platformStyle,
          display: shouldHide ? "none" : "initial",
        },
      }}
    >
      <Tabs.Screen
        name="(index)"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color }: { color: string }) => (
            <TabBarIcon Icon={DollarSign} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color }: { color: string }) => (
            <TabBarIcon Icon={ChartSpline} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }: { color: string }) => (
            <TabBarIcon Icon={Settings} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
