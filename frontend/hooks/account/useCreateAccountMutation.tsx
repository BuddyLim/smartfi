import { useQueryClient, useMutation } from "@tanstack/react-query";
import { BaseURL } from "constants/BaseUrl";
import { USER_ID } from "constants/User";
import { AccountKey } from "keys/account";
import { CreateAccountMutationProps } from "types/account";

export const useCreateAccountMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CreateAccountMutationProps,
    Error,
    CreateAccountMutationProps
  >({
    mutationFn: async (data) => {
      const resp = await fetch(`${BaseURL}/account/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
        }),
      });
      const val = (await resp.json()) as CreateAccountMutationProps;
      return val;
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: AccountKey.all(USER_ID),
      });
    },
  });
};
