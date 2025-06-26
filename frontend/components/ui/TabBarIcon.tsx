import type { IconProps } from "@tamagui/helpers-icon";

import { NamedExoticComponent } from "react";

const ICON_SIZE = 22;

export default function TabBarIcon({
  Icon,
  color,
}: {
  Icon: NamedExoticComponent<IconProps>;
  color: string;
}) {
  return <Icon size={ICON_SIZE} color={color} />;
}
