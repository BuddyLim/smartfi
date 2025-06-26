export enum TransactionTypeEum {
  INCOME = "credit",
  EXPENSES = "debit",
}

export enum TransactionRenderEnum {
  HEADER = "header",
  ITEM = "item",
}
export interface TransactionProps {
  category_name: string;
  name: string;
  amount: number;
  date: string;
  id: number;
  category_id: number;
  account_id: number;
  user_id: number;
  entry_type: TransactionTypeEum;
  account_name: string;
  currency: string;
  running_balance: number;
  type: TransactionRenderEnum;
  lastItem: boolean;
}

export interface TransactionHeaderProps {
  date: string;
  type: TransactionRenderEnum.HEADER;
  totalAmountSpent: number;
}

export interface TransactionStartStream {
  job_id: string;
}

export type TransactionList = (TransactionHeaderProps | TransactionProps)[];

export interface TransactionByDateProps {
  transactionList: TransactionProps[];
  totalDaySpent: number;
}

export interface CreateByTextMutationProps {
  text: string;
  account_id: number;
  user_id: number;
}

export interface ExpensesGlanceRespProps {
  past_7_days_avg: number;
  past_14_days_avg: number;
}

export interface ExpensesGlanceQueryProps {
  past7DaysAvg: number;
  past14DaysAvg: number;
}
