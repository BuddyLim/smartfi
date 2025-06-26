import { useQuery } from "@tanstack/react-query";
import { BaseURL } from "constants/BaseUrl";
import { USER_ID } from "constants/User";
import { AccountKey } from "keys/account";
import { AccountGlanceRespProps, AccountGlanceQueryProps } from "types/account";

export const useAccountBalanceAtGlanceQuery = () => {
  return useQuery<AccountGlanceRespProps, Error, AccountGlanceQueryProps>({
    queryKey: AccountKey.accountGlance(USER_ID),
    queryFn: async () => {
      const resp = await fetch(`${BaseURL}/stats/account/get`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const val = (await resp.json()) as AccountGlanceRespProps;
      return val;
    },
    select: (data) => {
      return {
        accountId: data.account_id,
        accountName: data.account_name,
        currentAccountBalance: data.current_account_balance,
        endOfLastMonthAccountBalance: data.end_of_last_month_account_balance,
      };
    },
  });
};
