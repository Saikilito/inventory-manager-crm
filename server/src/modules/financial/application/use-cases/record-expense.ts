import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { ITransaction } from '../../../../../../shared-domain/src/financial/transaction.entity.js';
import { FinancialTransactionService } from '../services/financial-transaction.service.js';
import { IFinancialDayRepository } from '../repositories/financial.repository.js';
import { IAccountRepository } from '../repositories/financial.repository.js';
import { makeFindOrOpenFinancialDay } from '../services/find-or-open-financial-day.js';
import { DateOnlyVO } from '../../../../../../shared-domain/src/shared/value-objects/date-only.vo.js';

export interface RecordExpenseInput {
  expenseId: string;
  accountId: string;
  amount: number;
  date?: string;
}

export type RecordExpenseUseCase = UseCase<RecordExpenseInput, ITransaction, DomainError>;

export const makeRecordExpenseUseCase = (
  financialTransactionService: FinancialTransactionService,
  financialDayRepository: IFinancialDayRepository,
  accountRepository: IAccountRepository,
): RecordExpenseUseCase => {
  const findOrOpenFinancialDay = makeFindOrOpenFinancialDay(
    financialDayRepository,
    accountRepository,
  );

  return async (input: RecordExpenseInput) => {
    const dateStr = DateOnlyVO.create(input.date ?? new Date().toISOString());

    const dayResult = await findOrOpenFinancialDay(dateStr.toString());
    if (dayResult.isFailure) {
      return Result.fail(dayResult.getError());
    }

    const financialDay = dayResult.getValue();

    const result = await financialTransactionService.recordExpense({
      expenseId: IdVO.create(input.expenseId),
      accountId: IdVO.create(input.accountId),
      amount: PositiveNumberVO.create(input.amount),
      financialDayId: financialDay.id!,
    });

    if (result.isFailure) {
      return Result.fail(result.getError());
    }

    return Result.ok<ITransaction, DomainError>(result.getValue());
  };
};
