import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { DateOnlyVO } from '../../../../../../shared-domain/src/shared/value-objects/date-only.vo.js';
import { ITransaction, makeTransaction, TransactionType } from '../../../../../../shared-domain/src/financial/transaction.entity.js';
import { IFinancialDay, FinancialDayStatus } from '../../../../../../shared-domain/src/financial/financial-day.entity.js';
import { IAccount, makeAccount } from '../../../../../../shared-domain/src/financial/account.entity.js';
import { IAccountRepository, ITransactionRepository, IFinancialDayRepository } from '../repositories/financial.repository.js';
import { makeFindOrOpenFinancialDay } from '../services/find-or-open-financial-day.js';

export interface CreateTransactionInput {
  accountId: string;
  type: string;
  amount: number;
  description: string;
  date?: string;
  referenceId?: string;
}

export type CreateTransaction = UseCase<CreateTransactionInput, ITransaction, DomainError>;

export const makeCreateTransaction = (
  transactionRepository: ITransactionRepository,
  accountRepository: IAccountRepository,
  financialDayRepository: IFinancialDayRepository,
): CreateTransaction => {
  const findOrOpenFinancialDay = makeFindOrOpenFinancialDay(
    financialDayRepository,
    accountRepository,
  );

  return async (input: CreateTransactionInput) => {
    const dateStr = DateOnlyVO.create(input.date);

    const dayResult = await findOrOpenFinancialDay(dateStr.toString());
    if (dayResult.isFailure) {
      return Result.fail(dayResult.getError());
    }

    const financialDay = dayResult.getValue();
    if (financialDay.status !== FinancialDayStatus.OPEN) {
      return Result.fail(new ValidationError(`Financial day for date ${dateStr} is closed`));
    }

    const accountResult = await accountRepository.getById(IdVO.create(input.accountId));
    if (accountResult.isFailure) {
      return Result.fail(accountResult.getError());
    }

    const account = accountResult.getValue() as IAccount | null;
    if (!account) {
      return Result.fail(new NotFoundError(`Account not found`));
    }

    let transaction: ITransaction;
    try {
      transaction = makeTransaction({
        accountId: input.accountId,
        type: input.type,
        amount: input.amount,
        currency: account.currency.toString(),
        description: input.description,
        date: dateStr.toString(),
        financialDayId: financialDay.id!.toString(),
        referenceId: input.referenceId,
      });
    } catch (e: unknown) {
      return Result.fail(new ValidationError(e instanceof Error ? e.message : 'Invalid transaction properties'));
    }

    let newBalance = account.balance;
    if (transaction.type === TransactionType.CREDIT) {
      newBalance += transaction.amount;
    } else {
      newBalance -= transaction.amount;
    }

    const updatedAccount = makeAccount({
      id: account.id!.toString(),
      name: account.name.toString(),
      currency: account.currency.toString(),
      balance: newBalance,
      createdAt: account.createdAt.toString(),
    });

    const composerResult = await ResultComposer.start()
      .useResult('updateAccount', () => accountRepository.updateById(account.id!, updatedAccount, IdVO.generateNil()))
      .useResult('saveTx', () => transactionRepository.create(transaction, IdVO.generateNil()))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const { saveTx: savedTx } = composerResult.getValue() as { saveTx: ITransaction };
    return Result.ok<ITransaction, DomainError>(savedTx);
  };
};
