import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { PositiveNumber, PositiveNumberVO } from '../shared/value-objects/positive-number.vo.js';
import { NonNegativeNumber, NonNegativeNumberVO } from '../shared/value-objects/non-negative-number.vo.js';
import { ValidationError } from '../shared/validation-error.js';

export type PayableStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface IPaymentRecord {
  id?: Id;
  amount: PositiveNumber;
  accountId: Id;
  transactionId: Id;
  expenseId: Id;
  paidAt: Date;
}

export interface IAccountsPayable {
  id?: Id;
  stockLotId?: Id;
  supplier: NonEmptyString;
  totalAmount: PositiveNumber;
  remainingBalance: NonNegativeNumber;
  payments: IPaymentRecord[];
  status: PayableStatus;
  contextId?: Id;
  createdAt: Date;
  updatedAt: Date;
}

export const makePaymentRecord = (props: {
  id?: string;
  amount: number;
  accountId: string;
  transactionId: string;
  expenseId: string;
  paidAt?: Date;
}): IPaymentRecord => {
  if (props.amount <= 0) {
    throw new ValidationError('Payment amount must be positive');
  }
  if (!props.accountId) {
    throw new ValidationError('Account ID is required');
  }
  if (!props.transactionId) {
    throw new ValidationError('Transaction ID is required');
  }
  if (!props.expenseId) {
    throw new ValidationError('Expense ID is required');
  }

  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    amount: PositiveNumberVO.create(Number(props.amount.toFixed(2))),
    accountId: IdVO.create(props.accountId),
    transactionId: IdVO.create(props.transactionId),
    expenseId: IdVO.create(props.expenseId),
    paidAt: props.paidAt || new Date(),
  };
};

export const makeAccountsPayable = (props: {
  id?: string;
  stockLotId?: string;
  supplier: string;
  totalAmount: number;
  remainingBalance?: number;
  payments?: IPaymentRecord[];
  status?: PayableStatus;
  contextId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}): IAccountsPayable => {
  if (!props.supplier || props.supplier.trim().length === 0) {
    throw new ValidationError('Supplier name is required');
  }
  if (props.totalAmount <= 0) {
    throw new ValidationError('Total amount must be positive');
  }

  const balance = props.remainingBalance !== undefined ? props.remainingBalance : props.totalAmount;

  let status: PayableStatus = 'PENDING';
  if (balance <= 0) {
    status = 'PAID';
  } else if (balance < props.totalAmount) {
    status = 'PARTIAL';
  } else if (props.status) {
    status = props.status;
  }

  const now = new Date();

  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    stockLotId: props.stockLotId ? IdVO.create(props.stockLotId) : undefined,
    supplier: NonEmptyStringVO.create(props.supplier.trim()),
    totalAmount: PositiveNumberVO.create(Number(props.totalAmount.toFixed(2))),
    remainingBalance: NonNegativeNumberVO.create(Number(balance.toFixed(2))),
    payments: props.payments || [],
    status,
    contextId: props.contextId ? IdVO.create(props.contextId) : undefined,
    createdAt: props.createdAt || now,
    updatedAt: props.updatedAt || now,
  };
};

export const addPaymentToAccountsPayable = (payable: IAccountsPayable, payment: IPaymentRecord): IAccountsPayable => {
  const currentBalance = Number(payable.remainingBalance);
  const paymentAmount = Number(payment.amount);

  if (paymentAmount > currentBalance) {
    throw new ValidationError('Payment cannot exceed remaining balance');
  }

  const newBalance = currentBalance - paymentAmount;
  const newPayments = [...payable.payments, payment];

  return makeAccountsPayable({
    id: payable.id?.toString(),
    stockLotId: payable.stockLotId?.toString(),
    supplier: payable.supplier.toString(),
    totalAmount: Number(payable.totalAmount),
    remainingBalance: newBalance,
    payments: newPayments,
    contextId: payable.contextId?.toString(),
    createdAt: payable.createdAt,
    updatedAt: new Date(),
  });
};
