import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CategoryKey } from "app/(tabs)/profile/categories";
import { BaseURL } from "constants/BaseUrl";
import { CreateCategoryMutationProps } from "types/category";

export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CreateCategoryMutationProps[],
    Error,
    CreateCategoryMutationProps
  >({
    mutationFn: async (data) => {
      const resp = await fetch(`${BaseURL}/category/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_create_list: [
            {
              ...data,
            },
          ],
        }),
      });
      const val = (await resp.json()) as CreateCategoryMutationProps[];
      return val;
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: CategoryKey.all(),
      });
    },
  });
};
