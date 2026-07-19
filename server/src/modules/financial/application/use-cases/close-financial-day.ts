import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { DateOnlyVO } from '../../../../../../shared-domain/src/shared/value-objects/date-only.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { IAccount } from '../../../../../../shared-domain/src/financial/account.entity.js';
import { IFinancialDay, makeFinancialDay, FinancialDayStatus } from '../../../../../../shared-domain/src/financial/financial-day.entity.js';
import { IFinancialDayRepository, IAccountRepository } from '../repositories/financial.repository.js';
import { FinancialDayField } from '../repositories/financial-day.constants.js';
import { MongoQueryConstants } from '../../../chat/infrastructure/services/gemini.constants.js';

export interface CloseFinancialDayInput {
  date?: string;
}

export type CloseFinancialDay = UseCase<CloseFinancialDayInput, IFinancialDay, DomainError>;

export const makeCloseFinancialDay = (
  financialDayRepository: IFinancialDayRepository,
  accountRepository: IAccountRepository,
): CloseFinancialDay => {
  return async (input: CloseFinancialDayInput) => {
    const dateStr = DateOnlyVO.create(input.date);

    const existingResult = await financialDayRepository.getOne([
      { field: NonEmptyStringVO.create(FinancialDayField.Date), value: dateStr.toString(), operator: '=' }
    ]);

    if (existingResult.isFailure) {
      return Result.fail(existingResult.getError());
    }

    const financialDay = existingResult.getValue();
    if (!financialDay) {
      return Result.fail(new ValidationError(`Financial day not found for date ${dateStr}`));
    }

    if (financialDay.status === FinancialDayStatus.CLOSED) {
      return Result.fail(new ValidationError(`Financial day for date ${dateStr} is already closed`));
    }

    const accountsResult = await accountRepository.getAll({
      limit: PositiveNumberVO.create(MongoQueryConstants.DEFAULT_PAGE_LIMIT),
    });

    if (accountsResult.isFailure) {
      return Result.fail(accountsResult.getError());
    }

    const accounts = accountsResult.getValue().items;
    const closingBalances = accounts.map((acc: IAccount) => ({
      accountId: acc.id.toString(),
      balance: acc.balance,
    }));

    const updatedDay = makeFinancialDay({
      id: financialDay.id!.toString(),
      date: financialDay.date.toString(),
      status: FinancialDayStatus.CLOSED,
      openingBalances: financialDay.openingBalances.map(b => ({ accountId: b.accountId.toString(), balance: b.balance })),
      closingBalances,
      openedAt: financialDay.openedAt.toString(),
      closedAt: new Date().toISOString(),
    });

    const updateResult = await financialDayRepository.updateById(financialDay.id!, updatedDay, IdVO.generateNil());
    if (updateResult.isFailure) {
      return Result.fail(updateResult.getError());
    }

    return Result.ok<IFinancialDay, DomainError>(updatedDay);
  };
};
