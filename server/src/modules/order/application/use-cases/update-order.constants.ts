export const StockOperation = {
  DEDUCT: "-",
  RESTORE: "+",
  NONE: "",
} as const;

export type StockOperation = (typeof StockOperation)[keyof typeof StockOperation];
