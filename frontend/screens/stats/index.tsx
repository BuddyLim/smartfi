import { SafeAreaView } from "react-native-safe-area-context";
import TransactionGlance from "screens/transaction/TransactionGlance";
import CategoryGlance from "screens/category/CategoryGlance";
import { H3, XStack, YStack } from "tamagui";
import AccountGlance from "screens/account/AccountGlance";

export default function Stats() {
  return (
    <SafeAreaView>
      <YStack paddingHorizontal={20} paddingVertical={10} gap={20}>
        <H3 fontWeight={"bold"}>Stats</H3>
        <XStack flexDirection="row" flexWrap="wrap" width={"100%"} gap={20}>
          <TransactionGlance />
          <CategoryGlance />
          <AccountGlance />
        </XStack>
      </YStack>
    </SafeAreaView>
  );
}
