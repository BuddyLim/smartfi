import { useQuery } from "@tanstack/react-query";
import { BaseURL } from "constants/BaseUrl";
import { AccountKey } from "keys/account";
import { AccountProps } from "types/account";

export const useAccountQuery = (userID: number) => {
  return useQuery<AccountProps[], Error>({
    queryKey: AccountKey.all(userID),
    queryFn: async () => {
      try {
        const resp = await fetch(`${BaseURL}/accounts/get`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userID }),
        });

        const val: AccountProps[] = await resp.json();
        return val;
      } catch (err) {
        console.error(err);
        return [] satisfies AccountProps[];
      }
    },
  });
};
