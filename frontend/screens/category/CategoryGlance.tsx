import StatsCard from "components/ui/StatsCard";
import { useCategoryExpenseOverDurationQuery } from "hooks/category/useCategoryOverDurationQuery";
import { useState } from "react";
import { PieChart } from "react-native-gifted-charts";
import { XStack, SizableText, Separator, YStack, View, Text } from "tamagui";

export default function CategoryGlance() {
  const [selectedPie, setSelectedPie] = useState(-1);
  const { data: categoryExpensesData } =
    useCategoryExpenseOverDurationQuery(selectedPie);

  const handleSelectPie = (_item: number, index: number) => {
    setSelectedPie((prevIndex) => {
      if (prevIndex === index) {
        return -1;
      }

      return index;
    });
  };

  return (
    <StatsCard title="Expense Split">
      {(categoryExpensesData?.categoryExpenseList?.length ?? 0 > 0) ? (
        <XStack gap={5}>
          <YStack
            gap={10}
            height={110}
            flexWrap="wrap"
            justifyContent="flex-start"
            width={"55%"}
            paddingTop={10}
          >
            {categoryExpensesData?.categoryExpenseList.map(
              // TODO: Stop rendering after 4 items for this summary card
              (categoryExpense, index) => {
                if (index > 9) return null;

                if (index === 9) {
                  return (
                    <Text key={"more"} fontSize={10}>
                      + {categoryExpensesData?.categoryExpenseList.length - 9}{" "}
                      more
                    </Text>
                  );
                }

                return (
                  <XStack
                    key={categoryExpense.category_id}
                    alignItems="center"
                    gap={5}
                  >
                    <View
                      style={{
                        height: 10,
                        width: 10,
                        borderRadius: 5,
                        backgroundColor: categoryExpense.color,
                      }}
                    />
                    <Text color={"$color11"} fontSize={10}>
                      {categoryExpense.category_name}
                    </Text>
                  </XStack>
                );
              }
            )}
          </YStack>
          <Separator vertical />
          <XStack
            width={"35%"}
            justifyContent="flex-start"
            alignItems="flex-start"
            gap={2}
            marginLeft={10}
          >
            <PieChart
              data={categoryExpensesData?.categoryExpenseList ?? []}
              sectionAutoFocus
              focusOnPress
              showGradient
              onPress={handleSelectPie}
              radius={50}
              innerCircleColor={"#111111"}
            />
          </XStack>
        </XStack>
      ) : (
        <SizableText size={"$5"}>No Data This Month</SizableText>
      )}
    </StatsCard>
  );
}
