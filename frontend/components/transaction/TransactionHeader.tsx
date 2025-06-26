import { Text, YStack } from "tamagui";
import { TransactionHeaderProps } from "types/transaction";
import { formatDateString, formatNumber } from "utils";

export default function TransactionHeader({
  item,
  activeHeader,
  isDynamicHeader = false,
  top = 12,
}: {
  item: TransactionHeaderProps;
  activeHeader: TransactionHeaderProps | null;
  isDynamicHeader?: boolean;
  top?: number;
}) {
  const { date, totalAmountSpent } = item;

  const transacitonDay = formatDateString(date, {
    weekday: "short",
  });

  const transactionDayNum = formatDateString(date, {
    day: "numeric",
  });

  const totalAmount = totalAmountSpent ? formatNumber(totalAmountSpent) : null;

  const headerProps = isDynamicHeader
    ? {
        top,
      }
    : {
        visibility: activeHeader?.date === date ? "hidden" : "visible",
      };

  return (
    <YStack
      borderTopLeftRadius={20}
      marginTop={10}
      marginLeft={5}
      marginRight={10}
      backgroundColor={"black"}
      position="absolute"
      width={80}
      justifyContent="space-between"
      alignItems="center"
      {...headerProps}
    >
      <Text>{transacitonDay}</Text>
      <Text fontSize={20} fontWeight={"500"} marginTop={5}>
        {transactionDayNum}
      </Text>
      <Text fontSize={12} marginTop={5}>
        {totalAmount}
      </Text>
    </YStack>
  );
}
