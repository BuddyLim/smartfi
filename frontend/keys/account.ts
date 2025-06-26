import { AccountDurationProps } from "types/account";

export const AccountKey = {
  all: (userID: number) => [userID, "account"] as const,
  account: (userID: number, accountID: number) =>
    [...AccountKey.all(userID), accountID] as const,
  expensesDuration: (
    userID: number,
    duration: AccountDurationProps["label"],
    accounts: number[]
  ) => [...AccountKey.all(userID), "expenses", duration, ...accounts] as const,
  incomeDuration: (
    userID: number,
    duration: AccountDurationProps["label"],
    accounts: number[]
  ) => [...AccountKey.all(userID), "incomes", duration, ...accounts] as const,
  categoryExpensesDuration: (userID: number) =>
    [...AccountKey.all(userID), "categoryExpenses"] as const,
  expensesGlance: (userID: number) =>
    [...AccountKey.all(userID), "expensesGlance"] as const,
  accountGlance: (userID: number) =>
    [...AccountKey.all(userID), "accountGlance"] as const,
};
