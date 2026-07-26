export interface PaymentRecord {
  id: string;
  amount: number;
  accountId: string;
  transactionId: string;
  expenseId: string;
  paidAt: string;
}

export interface AccountsPayable {
  id: string;
  stockLotId: string;
  supplier: string;
  totalAmount: number;
  remainingBalance: number;
  payments: PaymentRecord[];
  status: 'PENDING' | 'PARTIAL' | 'PAID';
  contextId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayAccountsPayablePayload {
  accountsPayable?: AccountsPayable;
  transaction?: {
    id: string;
    amount: number;
    type: string;
    description: string;
    accountId: string;
    createdAt: string;
  };
  expense?: {
    id: string;
    amount: number;
    description: string;
    category: string;
    date: string;
  };
  success: boolean;
  message: string;
}
