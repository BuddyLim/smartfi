import StatsCard from "components/ui/StatsCard";
import { useAccountBalanceAtGlanceQuery } from "hooks/account/useAccountBalanceAtGlanceQuery";
import { XStack, SizableText, Separator, YStack, Text } from "tamagui";
import { formatNumber, getMonthDaysLeft } from "utils";

export default function AccountGlance() {
  const { data: accountGlanceData } = useAccountBalanceAtGlanceQuery();

  const currentAccountBalance = accountGlanceData?.currentAccountBalance ?? 0;

  const formattedCAB = formatNumber(currentAccountBalance, "en-US");

  const endOfLastMonthAccountBalance =
    accountGlanceData?.endOfLastMonthAccountBalance ?? 0;

  const formattedELMAB = formatNumber(endOfLastMonthAccountBalance, "en-US");

  const balanceDiff = currentAccountBalance - endOfLastMonthAccountBalance;
  const safeBudget = formatNumber(
    balanceDiff / getMonthDaysLeft(new Date()),
    "en-US"
  );

  return (
    <StatsCard title="Account Summary">
      <XStack gap={10} paddingRight={30}>
        <YStack gap={12} width={"55%"}>
          <YStack gap={4}>
            <Text fontSize={14} color={"$color10"}>
              {accountGlanceData?.accountName} Balance:
            </Text>
            <SizableText size={"$7"}>{formattedCAB}</SizableText>
          </YStack>
          <YStack gap={4}>
            <Text fontSize={14} color={"$color10"}>
              Last Month&apos;s Ending:
            </Text>
            <XStack alignItems="baseline" gap={20}>
              <SizableText size={"$5"}>{formattedELMAB}</SizableText>
            </XStack>
          </YStack>
        </YStack>
        <Separator marginHorizontal={10} vertical />

        <YStack gap={4} width={"45%"}>
          <Text fontSize={14} color={"$color10"}>
            Budget Per Day
          </Text>
          <XStack alignItems="baseline" gap={20}>
            <SizableText size={"$5"}>{safeBudget}</SizableText>
          </XStack>
        </YStack>
      </XStack>
    </StatsCard>
  );
}
