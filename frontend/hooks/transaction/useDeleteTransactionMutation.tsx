import { useQueryClient, useMutation } from "@tanstack/react-query";
import { BaseURL } from "constants/BaseUrl";
import { USER_ID } from "constants/User";
import { AccountKey } from "keys/account";
import { TransactionKey } from "keys/transaction";

interface DeleteTransactionProps {
  transaction_id: number;
  user_id: number;
}

export const useDeleteTransactionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, DeleteTransactionProps>({
    mutationFn: async (data) => {
      const resp = await fetch(`${BaseURL}/transaction/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
        }),
      });

      if (!resp.ok) {
        throw new Error("Failed to delete transaction");
      }

      const val = await resp.json();
      return val;
    },
    onError: (error) => {
      console.error("Error deleting transaction:", error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TransactionKey.all(USER_ID) });
      queryClient.invalidateQueries({ queryKey: AccountKey.all(USER_ID) });
    },
  });
};
