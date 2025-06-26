import { ArrowDown, ArrowUp } from "@tamagui/lucide-icons";
import StatsCard from "components/ui/StatsCard";
import { useAccountExpensesAtGlanceQuery } from "hooks/account/useAccountExpensesAtGlanceQuery";
import { XStack, SizableText, Separator, YStack, Text } from "tamagui";
import { formatNumber } from "utils";

export default function TransactionGlance() {
  const { data: expensesGlanceData } = useAccountExpensesAtGlanceQuery();

  const { past7DaysAvg = 0, past14DaysAvg = 0 } = expensesGlanceData ?? {};

  const formatted7Days = formatNumber(past7DaysAvg);
  const formatted14Days = formatNumber(past14DaysAvg);

  const percentageChangeForGlance = Number(
    ((past7DaysAvg - past14DaysAvg) / past14DaysAvg).toFixed(2)
  );

  const formattedPercentage = formatNumber(percentageChangeForGlance, "en-US", {
    signDisplay: "always",
    style: "percent",
  });

  return (
    <StatsCard title="Weekly Glance">
      <YStack justifyContent="space-evenly" alignItems="flex-start">
        <XStack gap={10} paddingRight={30}>
          <YStack gap={12} width={"55%"}>
            <YStack gap={4}>
              <XStack
                width={"100%"}
                alignItems="baseline"
                justifyContent="space-between"
                paddingRight={8}
              >
                <Text fontSize={14} color={"$color10"}>
                  Average Last 7 Days:
                </Text>
              </XStack>
              <SizableText size={"$7"}>{formatted7Days}</SizableText>
            </YStack>
            <YStack gap={4}>
              <Text fontSize={14} color={"$color10"}>
                Prev. Week&apos;s Avg:
              </Text>
              <XStack alignItems="baseline" gap={20}>
                <SizableText size={"$5"}>{formatted14Days}</SizableText>
              </XStack>
            </YStack>
          </YStack>
          <Separator marginHorizontal={10} vertical />
          <YStack gap={8} width={"45%"}>
            <Text fontSize={14} color={"$color10"}>
              vs. Last Week:
            </Text>
            <XStack gap={4} alignItems="center">
              {percentageChangeForGlance < 0 ? (
                <ArrowDown size={16} color={"green"} />
              ) : (
                <ArrowUp size={16} color="firebrick" />
              )}
              <Text
                fontSize={"$7"}
                color={percentageChangeForGlance < 0 ? "green" : "firebrick"}
              >
                {formattedPercentage}
              </Text>
            </XStack>
          </YStack>
        </XStack>
      </YStack>
    </StatsCard>
  );
}
