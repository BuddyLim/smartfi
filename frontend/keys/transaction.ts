export const TransactionKey = {
  all: (userID: number) => [userID, "transaction"] as const,
  transaction: (userID: number, transactionID: number) =>
    [...TransactionKey.all(userID), transactionID] as const,
  stream: () => ["stream"] as const,
};
