import { useQuery } from "@tanstack/react-query";
import { BaseURL } from "constants/BaseUrl";
import { TransactionKey } from "keys/transaction";
import { TransactionProps } from "types/transaction";
import { formatTransactions } from "utils";

export const useTransactionQuery = (userID: number) => {
  return useQuery({
    queryKey: TransactionKey.all(userID),
    queryFn: async () => {
      try {
        const resp = await fetch(`${BaseURL}/transactions/get`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userID }),
        });
        const val = await resp.json();
        return val;
      } catch (err) {
        console.error(err);
        return [];
      }
    },
    select: (data: TransactionProps[]) => {
      return formatTransactions(data);
    },
  });
};
