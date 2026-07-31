import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import {
  DomainError,
  createDatabaseError,
  createValidationError,
  createNotFoundError,
} from '../../../../../../shared-domain/src/shared/errors.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { DateOnlyVO } from '../../../../../../shared-domain/src/shared/value-objects/date-only.vo.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import {
  IAccountsPayable,
  makeAccountsPayable,
} from '../../../../../../shared-domain/src/financial/accounts-payable.entity.js';
import {
  makeTransactionResult,
  ITransaction,
} from '../../../../../../shared-domain/src/financial/transaction.entity.js';
import {
  IAccountRepository,
  ITransactionRepository,
} from '../../../financial/application/repositories/financial.repository.js';
import { IAccountsPayableRepository } from '../../../financial/application/repositories/accounts-payable.repository.js';

export interface ExecuteCashPaymentParams {
  supplier: string;
  purchaseDate: string;
  totalCost: number;
  accountId: string;
  userId: string;
  stockLotId: string;
  financialDayId: string;
  transactionId?: string;
  accountRepository: IAccountRepository;
  transactionRepository: ITransactionRepository;
}

export interface ExecuteCashPaymentResult {
  transactionId: string;
}

export const executeCashPayment = async (
  params: ExecuteCashPaymentParams,
): Promise<Result<ExecuteCashPaymentResult, DomainError>> => {
  const {
    supplier,
    purchaseDate,
    totalCost,
    accountId,
    userId,
    stockLotId,
    financialDayId,
    accountRepository,
    transactionRepository,
  } = params;

  const accountResult = await accountRepository.getById(IdVO.create(accountId));
  if (accountResult.isFailure || !accountResult.getValue()) {
    return Result.fail(createNotFoundError('Account not found'));
  }

  const account = accountResult.getValue()!;
  const requiredAmount = PositiveNumberVO.create(Number(totalCost));
  if (!account.canDebit(requiredAmount)) {
    return Result.fail(createValidationError('Insufficient account balance'));
  }

  const dateStr = DateOnlyVO.create(purchaseDate);
  const generatedTransactionId = params.transactionId || IdVO.generate().toString();

  const transactionResult = makeTransactionResult({
    id: generatedTransactionId,
    accountId,
    type: 'DEBIT',
    amount: Number(totalCost),
    currency: account.currency.toString(),
    description: `[Stock Purchase] ${supplier}`,
    date: dateStr.toString(),
    financialDayId,
    source: 'STOCK_PURCHASE',
    sourceReferenceId: stockLotId,
  });

  if (transactionResult.isFailure) {
    return Result.fail(transactionResult.getError());
  }

  const transaction = transactionResult.getValue();

  const saveTxResult = await transactionRepository.create(transaction, IdVO.create(userId));
  if (saveTxResult.isFailure) {
    return Result.fail(saveTxResult.getError());
  }

  const savedTx = saveTxResult.getValue() as ITransaction;
  const finalTxId = savedTx.id ? savedTx.id.toString() : generatedTransactionId;

  const debitedAccount = account.debit(requiredAmount);
  const updateAccResult = await accountRepository.updateById(
    IdVO.create(accountId),
    debitedAccount,
    IdVO.create(userId),
  );

  if (updateAccResult.isFailure) {
    return Result.fail(createDatabaseError('Failed to update account balance'));
  }

  return Result.ok({ transactionId: finalTxId });
};

export interface ExecuteCreditPaymentParams {
  supplier: string;
  stockLotId: string;
  totalAmount: number;
  contextId?: string;
  userId: string;
  accountsPayableRepository: IAccountsPayableRepository;
}

export interface ExecuteCreditPaymentResult {
  accountsPayableId: string;
  savedPayable: IAccountsPayable;
}

export const executeCreditPayment = async (
  params: ExecuteCreditPaymentParams,
): Promise<Result<ExecuteCreditPaymentResult, DomainError>> => {
  const { supplier, stockLotId, totalAmount, contextId, userId, accountsPayableRepository } = params;

  const accountsPayable = makeAccountsPayable({
    supplier,
    stockLotId,
    totalAmount,
    contextId,
  });

  const savePayableResult = await accountsPayableRepository.create(accountsPayable, IdVO.create(userId));
  if (savePayableResult.isFailure) {
    return Result.fail(savePayableResult.getError());
  }

  const savedPayable = savePayableResult.getValue() as IAccountsPayable;
  const accountsPayableId = savedPayable.id!.toString();

  return Result.ok({ accountsPayableId, savedPayable });
};
