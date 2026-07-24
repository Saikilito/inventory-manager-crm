import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { createValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { DateOnlyVO } from '../../../../../../shared-domain/src/shared/value-objects/date-only.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { IFinancialDay } from '../../../../../../shared-domain/src/financial/financial-day.entity.js';
import { IFinancialDayRepository, IAccountRepository } from '../repositories/financial.repository.js';
import { FinancialDayField } from '../repositories/financial-day.constants.js';
import { makeFindOrOpenFinancialDay } from '../services/find-or-open-financial-day.js';

export interface OpenFinancialDayInput {
  date?: string;
}

export type OpenFinancialDay = UseCase<OpenFinancialDayInput, IFinancialDay, DomainError>;

export const makeOpenFinancialDay = (
  financialDayRepository: IFinancialDayRepository,
  accountRepository: IAccountRepository,
): OpenFinancialDay => {
  const findOrOpenFinancialDay = makeFindOrOpenFinancialDay(
    financialDayRepository,
    accountRepository,
  );

  return async (input: OpenFinancialDayInput) => {
    const dateStr = DateOnlyVO.create(input.date);

    const existingResult = await financialDayRepository.getOne([
      { field: NonEmptyStringVO.create(FinancialDayField.Date), value: dateStr.toString(), operator: '=' }
    ]);

    if (existingResult.isFailure) {
      return Result.fail(existingResult.getError());
    }

    if (existingResult.getValue()) {
      return Result.fail(createValidationError(`Financial day already exists for date ${dateStr}`));
    }

    return findOrOpenFinancialDay(dateStr.toString());
  };
};
