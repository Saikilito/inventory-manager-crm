import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { IFinancialDay, makeFinancialDay, FinancialDayStatus } from '../../../../../../shared-domain/src/financial/financial-day.entity.js';
import { IAccount } from '../../../../../../shared-domain/src/financial/account.entity.js';
import { IAccountRepository, IFinancialDayRepository } from '../repositories/financial.repository.js';
import { FinancialDayField } from '../repositories/financial-day.constants.js';
import { MongoQueryConstants } from '../../../chat/infrastructure/services/gemini.constants.js';

export const makeFindOrOpenFinancialDay = (
  financialDayRepository: IFinancialDayRepository,
  accountRepository: IAccountRepository,
) => async (dateStr: string): Promise<Result<IFinancialDay, DomainError>> => {
  const existingResult = await financialDayRepository.getOne([
    { field: NonEmptyStringVO.create(FinancialDayField.Date), value: dateStr, operator: '=' }
  ]);

  if (existingResult.isFailure) {
    return Result.fail(existingResult.getError());
  }

  if (existingResult.getValue()) {
    return Result.ok<IFinancialDay, DomainError>(existingResult.getValue() as IFinancialDay);
  }

  const accountsResult = await accountRepository.getAll({
    limit: PositiveNumberVO.create(MongoQueryConstants.DEFAULT_PAGE_LIMIT),
  });

  if (accountsResult.isFailure) {
    return Result.fail(accountsResult.getError());
  }

  const accounts = accountsResult.getValue().items;
  const openingBalances = accounts.map((acc: IAccount) => ({
    accountId: acc.id.toString(),
    balance: acc.balance,
  }));

  const newDay = makeFinancialDay({
    date: dateStr,
    status: FinancialDayStatus.OPEN,
    openingBalances,
    closingBalances: [],
    openedAt: new Date().toISOString(),
  });

  const createResult = await financialDayRepository.create(newDay, IdVO.generateNil());
  if (createResult.isFailure) {
    return Result.fail(createResult.getError());
  }

  return Result.ok<IFinancialDay, DomainError>(createResult.getValue());
};
