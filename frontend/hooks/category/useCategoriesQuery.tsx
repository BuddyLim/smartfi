import { useQuery } from "@tanstack/react-query";
import { BaseURL } from "constants/BaseUrl";
import { CategoryKey } from "keys/category";
import { CategoryRespProps } from "types/category";
import { TransactionTypeEum } from "types/transaction";

export const useCategoriesQuery = () => {
  return useQuery({
    queryKey: CategoryKey.all(),
    queryFn: async () => {
      const resp = await fetch(`${BaseURL}/categories/get`, {
        method: "GET",
      });
      const val: CategoryRespProps[] = await resp.json();

      return val;
    },
    select: (data) => {
      const debitList = data.filter(
        (category) => category.entry_type === TransactionTypeEum.EXPENSES
      );
      const creditList = data.filter(
        (category) => category.entry_type === TransactionTypeEum.INCOME
      );
      return {
        creditList,
        debitList,
      };
    },
  });
};
