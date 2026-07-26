import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, createNotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { createValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IAccount, makeAccount } from '../../../../../../shared-domain/src/financial/account.entity.js';
import { TransactionSource } from '../../../../../../shared-domain/src/financial/transaction-source.vo.js';
import { TransactionType } from '../../../../../../shared-domain/src/financial/transaction.entity.js';
import { IAccountRepository, ITransactionRepository, IFinancialDayRepository } from '../repositories/financial.repository.js';
import { makeCreateTransaction } from './create-transaction.js';

export interface AdjustAccountInput {
  accountId: string;
  name?: string;
  newBalance?: number;
  justification?: string;
}

export type AdjustAccount = UseCase<AdjustAccountInput, IAccount, DomainError>;

export const makeAdjustAccount = (
  accountRepository: IAccountRepository,
  transactionRepository: ITransactionRepository,
  financialDayRepository: IFinancialDayRepository,
): AdjustAccount => {
  const createTransaction = makeCreateTransaction(transactionRepository, accountRepository, financialDayRepository);

  return async (input: AdjustAccountInput) => {
    const accountResult = await accountRepository.getById(IdVO.create(input.accountId));
    if (accountResult.isFailure) return Result.fail(accountResult.getError());

    let account = accountResult.getValue() as IAccount | null;
    if (!account) return Result.fail(createNotFoundError('Account not found'));

    if (input.newBalance !== undefined && input.newBalance !== account.balance) {
      if (!input.justification || input.justification.trim() === '') {
        return Result.fail(createValidationError('A justification is required to change the account balance'));
      }

      const diff = input.newBalance - account.balance;
      const type = diff > 0 ? TransactionType.CREDIT : TransactionType.DEBIT;
      const amount = Math.abs(diff);

      const txResult = await createTransaction({
        accountId: input.accountId,
        type,
        amount,
        description: input.justification,
        source: TransactionSource.MANUAL,
      });

      if (txResult.isFailure) return Result.fail(txResult.getError());

      // Fetch the updated account
      const updatedAccountResult = await accountRepository.getById(IdVO.create(input.accountId));
      if (updatedAccountResult.isFailure) return Result.fail(updatedAccountResult.getError());
      account = updatedAccountResult.getValue() as IAccount | null;
      if (!account) return Result.fail(createNotFoundError('Account not found after transaction'));
    }

    if (input.name !== undefined && input.name !== account.name.toString()) {
      const updatedAccount = makeAccount({
        id: account.id!.toString(),
        name: input.name,
        currency: account.currency.toString(),
        balance: account.balance,
        createdAt: account.createdAt.toString(),
      });

      const updateResult = await accountRepository.updateById(account.id!, updatedAccount, IdVO.generateNil());
      if (updateResult.isFailure) return Result.fail(updateResult.getError());
      
      account = updatedAccount;
    }

    return Result.ok(account);
  };
};
