import { useQuery } from "@tanstack/react-query";
import { BaseURL } from "constants/BaseUrl";
import { USER_ID } from "constants/User";
import { AccountKey } from "keys/account";
import {
  ExpensesGlanceQueryProps,
  ExpensesGlanceRespProps,
} from "types/transaction";

export const useAccountExpensesAtGlanceQuery = () => {
  return useQuery<ExpensesGlanceRespProps, Error, ExpensesGlanceQueryProps>({
    queryKey: AccountKey.expensesGlance(USER_ID),
    queryFn: async () => {
      const resp = await fetch(`${BaseURL}/stats/expenses/glance`);

      const val = (await resp.json()) satisfies ExpensesGlanceRespProps;
      return val;
    },
    placeholderData: (previousData) => {
      return previousData;
    },
    select: (data) => {
      return {
        past7DaysAvg: data.past_7_days_avg,
        past14DaysAvg: data.past_14_days_avg,
      };
    },
  });
};
