import { useQueryClient, useMutation } from "@tanstack/react-query";
import { BaseURL } from "constants/BaseUrl";
import { USER_ID } from "constants/User";
import { AccountKey } from "keys/account";
import { TransactionKey } from "keys/transaction";
import {
  CreateByTextMutationProps,
  TransactionStartStream,
} from "types/transaction";

export const useCreateTransactionByTextMutation = (
  handleTransactionText: () => void
) => {
  const queryClient = useQueryClient();

  return useMutation<TransactionStartStream, Error, CreateByTextMutationProps>({
    mutationFn: async (data) => {
      const resp = await fetch(`${BaseURL}/transaction/create-by-text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
        }),
      });

      const val: TransactionStartStream = await resp.json();
      return val;
    },
    onError: (error) => {
      console.error(error);
    },
    onSuccess: (data) => {
      handleTransactionText();
      return data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TransactionKey.all(USER_ID) });
      queryClient.invalidateQueries({ queryKey: AccountKey.all(USER_ID) });
    },
  });
};
