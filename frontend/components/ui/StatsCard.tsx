import { ChevronRight } from "@tamagui/lucide-icons";
import { XStack, SizableText, Separator, Button } from "tamagui";
import { LinearGradient as ViewLinearGradient } from "tamagui/linear-gradient";

export default function StatsCard({
  title,
  children,
}: {
  title: string;
  children: JSX.Element | JSX.Element[];
}) {
  return (
    <ViewLinearGradient
      style={{
        height: 190,
        width: "100%",
        backgroundColor: "#111111",
        borderRadius: 10,
        paddingTop: 15,
        paddingBottom: 10,
        paddingLeft: 20,
        paddingRight: 10,
      }}
    >
      <XStack justifyContent="space-between" alignItems="center">
        <XStack gap={10} alignItems="center">
          <SizableText size={"$6"} fontWeight={"400"} marginBottom={0}>
            {title}
          </SizableText>
        </XStack>
        <XStack gap={14} justifyContent="center">
          <Button
            size={"$2"}
            chromeless
            iconAfter={ChevronRight}
            borderWidth={0.5}
          />
        </XStack>
      </XStack>
      <Separator marginVertical={10} />
      {children}
    </ViewLinearGradient>
  );
}
