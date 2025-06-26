import { useQuery } from "@tanstack/react-query";
import { BaseURL } from "constants/BaseUrl";
import { USER_ID } from "constants/User";
import { AccountKey } from "keys/account";
import {
  CategoryExpenseQueryProps,
  CategoryExpensesProps,
} from "types/category";
import { indexToLinearGradient } from "utils";

export const useCategoryExpenseOverDurationQuery = (selectedPie: number) => {
  return useQuery<CategoryExpensesProps[], Error, CategoryExpenseQueryProps>({
    queryKey: AccountKey.categoryExpensesDuration(USER_ID),
    queryFn: async () => {
      const resp = await fetch(`${BaseURL}/stats/category/get`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const val = (await resp.json()) as CategoryExpensesProps[];
      return val.reverse();
    },
    placeholderData: (previousData) => {
      return previousData ?? [];
    },
    select: (data) => {
      const totalAmount = data.reduce((prevValue, currValue) => {
        return currValue.total_amount + prevValue;
      }, 0);
      return {
        totalAmount,
        categoryExpenseList: data.map((categoryExpense, i) => {
          const [color, gradientCenterColor] = indexToLinearGradient(
            i,
            data.length
          );
          return {
            ...categoryExpense,
            value: categoryExpense.total_amount,
            focused: i === selectedPie,
            color,
            gradientCenterColor,
          };
        }),
      };
    },
  });
};
