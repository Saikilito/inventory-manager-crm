export const TransactionSource = {
  ORDER_PAYMENT: 'ORDER_PAYMENT',
  ORDER_REFUND: 'ORDER_REFUND',
  EXPENSE: 'EXPENSE',
  EXPENSE_REVERSAL: 'EXPENSE_REVERSAL',
  FIXED_EXPENSE_PAYMENT: 'FIXED_EXPENSE_PAYMENT',
  TRANSFER: 'TRANSFER',
  MANUAL: 'MANUAL',
  DELIVERY: 'DELIVERY',
} as const;

export type TransactionSource = typeof TransactionSource[keyof typeof TransactionSource];

export const isTransactionSource = (value: string): value is TransactionSource => {
  return Object.values(TransactionSource).includes(value as TransactionSource);
};
