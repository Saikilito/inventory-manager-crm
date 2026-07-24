export const ReconciliationStatus = {
  MATCHED: 'MATCHED',
  MISSING_TRANSACTION: 'MISSING_TRANSACTION',
  UNEXPECTED_TRANSACTION: 'UNEXPECTED_TRANSACTION',
  BALANCE_MISMATCH: 'BALANCE_MISMATCH',
} as const;

export type ReconciliationStatus = typeof ReconciliationStatus[keyof typeof ReconciliationStatus];

export const isReconciliationStatus = (value: string): value is ReconciliationStatus => {
  return Object.values(ReconciliationStatus).includes(value as ReconciliationStatus);
};
