import { router } from "expo-router";
import { useCategoriesQuery } from "hooks/category/useCategoriesQuery";
import { ScrollView } from "react-native";
import { ListItem, SizableText, YGroup, YStack } from "tamagui";

export default function Categories() {
  const { data: categoryList } = useCategoriesQuery();

  return (
    <ScrollView>
      <YStack padding={15} gap={10}>
        <SizableText size={"$4"} fontFamily="$body">
          Expenses
        </SizableText>

        {categoryList?.debitList.map((debit) => (
          <YGroup key={debit.id}>
            <YGroup.Item>
              <ListItem
                hoverTheme
                pressTheme
                title={debit.name}
                onPress={() =>
                  router.push({
                    pathname: "/profile/[category]",
                    params: {
                      category: debit.name,
                    },
                  })
                }
              />
            </YGroup.Item>
          </YGroup>
        ))}

        <SizableText size={"$4"} fontFamily="$body">
          Incomes
        </SizableText>
        {categoryList?.creditList.map((credit) => (
          <YGroup key={credit.id}>
            <YGroup.Item>
              <ListItem
                hoverTheme
                pressTheme
                title={credit.name}
                onPress={() =>
                  router.push({
                    pathname: "/profile/[category]",
                    params: {
                      category: credit.name,
                    },
                  })
                }
              />
            </YGroup.Item>
          </YGroup>
        ))}
      </YStack>
    </ScrollView>
  );
}
