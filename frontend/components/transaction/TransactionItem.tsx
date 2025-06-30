import { AlertCircle } from "@tamagui/lucide-icons";
import {
  YStack,
  YGroup,
  ListItem,
  SizableText,
  XStack,
  Separator,
  Text,
} from "tamagui";
import { TransactionProps, TransactionTypeEum } from "types/transaction";
import { formatNumber } from "utils";

export default function TransactionItem({
  transaction,
  handleSelectedItem,
}: {
  transaction: TransactionProps;
  handleSelectedItem?: (transaction: TransactionProps) => void;
}) {
  const { account_name: accountName, running_balance } = transaction;

  const amount =
    transaction.entry_type === TransactionTypeEum.EXPENSES
      ? -transaction.amount
      : transaction.amount;

  const transactionAmount = formatNumber(amount, "en-US", {
    currencyDisplay: "symbol",
    currencySign: "standard",
    currency: "USD",
    style: "currency",
    roundingMode: "halfCeil",
    signDisplay: "always",
  });

  const runningBalance = formatNumber(running_balance, "en-US", {
    roundingMode: "halfCeil",
    maximumFractionDigits: 2,
  });

  return (
    <YStack flex={1} marginHorizontal={15} marginVertical={8} paddingLeft={75}>
      <YGroup>
        <YGroup.Item>
          <ListItem
            marginBottom={transaction.lastItem ? 20 : 0}
            hoverTheme
            pressTheme
            title={<SizableText size={"$5"}>{transaction.name}</SizableText>}
            subTitle={
              <XStack gap={5}>
                {transaction.category_name === "Unknown" ? (
                  <AlertCircle size={16} color={"darkkhaki"} />
                ) : undefined}
                <Text color={"$color10"}>{transaction.category_name}</Text>
              </XStack>
            }
            iconAfter={
              <YStack gap={5} justifyContent="space-between">
                <SizableText
                  size={"$5"}
                  color={"$color11"}
                  style={{
                    textAlign: "right",
                  }}
                >
                  {transactionAmount}
                </SizableText>
                <XStack gap={5} justifyContent="flex-end">
                  <Text color={"$color9"}>{accountName}</Text>
                  <Separator vertical />
                  <Text color={"$color9"}>{runningBalance}</Text>
                </XStack>
              </YStack>
            }
            onPress={() => handleSelectedItem?.(transaction)}
          />
        </YGroup.Item>
      </YGroup>
    </YStack>
  );
}
