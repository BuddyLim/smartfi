import { ChevronLeft, Plus } from "@tamagui/lucide-icons";
import { Pressable } from "react-native";
import { View } from "tamagui";
import { router, Route } from "expo-router";

export const PressableHeaderRoot = ({
  children,
}: {
  children: JSX.Element;
}) => <View>{children}</View>;

const PressableHeaderRight = ({ pathname }: { pathname: Route }) => (
  <Pressable onPress={() => router.push(pathname)}>
    {({ pressed }) => <Plus color={pressed ? "$color10" : "white"} />}
  </Pressable>
);

const PressableHeaderLeft = () => (
  <Pressable onPress={() => router.back()}>
    {({ pressed }) => <ChevronLeft color={pressed ? "$color10" : "white"} />}
  </Pressable>
);

export const PressableHeader =
  PressableHeaderRoot as typeof PressableHeaderRoot & {
    Right: typeof PressableHeaderRight;
    Left: typeof PressableHeaderLeft;
  };

PressableHeader.Right = PressableHeaderRight;
PressableHeader.Left = PressableHeaderLeft;
