import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { DateOnlyVO } from '../../../../../../shared-domain/src/shared/value-objects/date-only.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { IExchangeRate, makeExchangeRate } from '../../../../../../shared-domain/src/financial/exchange-rate.entity.js';
import { IExchangeRateRepository } from '../repositories/financial.repository.js';
import { FinancialDayField } from '../repositories/financial-day.constants.js';

export interface UpdateExchangeRateInput {
  date?: string;
  rate: number;
}

export type UpdateExchangeRate = UseCase<UpdateExchangeRateInput, IExchangeRate, DomainError>;

export const makeUpdateExchangeRate = (exchangeRateRepository: IExchangeRateRepository): UpdateExchangeRate => {
  return async (input: UpdateExchangeRateInput) => {
    const dateStr = DateOnlyVO.create(input.date);

    const existingResult = await exchangeRateRepository.getOne([
      { field: NonEmptyStringVO.create(FinancialDayField.Date), value: dateStr.toString(), operator: '=' }
    ]);

    if (existingResult.isFailure) {
      return Result.fail(existingResult.getError());
    }

    const existing = existingResult.getValue();
    if (existing) {
      const updated = makeExchangeRate({
        id: existing.id!.toString(),
        date: existing.date.toString(),
        rate: input.rate,
        createdAt: existing.createdAt.toString(),
      });
      const updateResult = await exchangeRateRepository.updateById(existing.id!, updated, IdVO.generateNil());
      if (updateResult.isFailure) {
        return Result.fail(updateResult.getError());
      }
      return Result.ok<IExchangeRate, DomainError>(updated);
    } else {
      const newRate = makeExchangeRate({
        date: dateStr.toString(),
        rate: input.rate,
      });
      const createResult = await exchangeRateRepository.create(newRate, IdVO.generateNil());
      if (createResult.isFailure) {
        return Result.fail(createResult.getError());
      }
      return Result.ok<IExchangeRate, DomainError>(createResult.getValue());
    }
  };
};
