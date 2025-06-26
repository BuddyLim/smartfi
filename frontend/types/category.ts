import { TransactionTypeEum } from "./transaction";

export interface CreateCategoryMutationProps {
  user_id: number;
  entry_type: TransactionTypeEum;
  name: string;
}

export interface AddCategoryProps {
  name: string;
  transactionType: TransactionTypeEum;
}

export enum AddCategoryStatusEnum {
  OFF = "off",
  SUBMITTING = "submitting",
  SUBMITTED = "submitted",
}

export type CategoryExpensesProps = {
  category_id: number;
  category_name: string;
  total_amount: number;
  value: number;
  color: string;
};

export interface CategoryExpenseQueryProps {
  totalAmount: number;
  categoryExpenseList: CategoryExpensesProps[];
}

export interface CategoryRespProps {
  name: string;
  id: number;
  entry_type: TransactionTypeEum;
}
