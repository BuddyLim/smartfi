import { USER_ID } from "constants/User";
import { useAccountQuery } from "hooks/account/useAccountQuery";
import { ScrollView } from "react-native";
import { YStack, YGroup, ListItem, Text } from "tamagui";
import { formatNumber } from "utils";

export default function Accounts() {
  const { data: accountList } = useAccountQuery(USER_ID);

  return (
    <ScrollView>
      <YStack padding={15} gap={10}>
        {accountList?.map((account) => {
          const latestBalance = formatNumber(account.latest_balance, "en-US");

          return (
            <YGroup key={account.id}>
              <YGroup.Item>
                <ListItem
                  hoverTheme
                  pressTheme
                  title={account.name}
                  iconAfter={() => (
                    <YStack>
                      <Text color={"$color9"}>{latestBalance}</Text>
                    </YStack>
                  )}
                />
              </YGroup.Item>
            </YGroup>
          );
        })}
      </YStack>
    </ScrollView>
  );
}
