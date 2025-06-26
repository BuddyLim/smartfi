export const CategoryKey = {
  all: () => ["categories"] as const,
  income: () => [CategoryKey.all(), "income"] as const,
  expense: () => [CategoryKey.all(), "expense"] as const,
};
