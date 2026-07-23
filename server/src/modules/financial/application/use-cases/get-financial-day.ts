import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { DateOnlyVO } from '../../../../../../shared-domain/src/shared/value-objects/date-only.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { IFinancialDay } from '../../../../../../shared-domain/src/financial/financial-day.entity.js';
import { IFinancialDayRepository, IExchangeRateRepository } from '../repositories/financial.repository.js';
import { FinancialDayField, EXCHANGE_RATE_FALLBACK_DAYS_LIMIT } from '../repositories/financial-day.constants.js';

export interface GetFinancialDayInput {
  date?: string;
}

export interface GetFinancialDayResult {
  financialDay: IFinancialDay | null;
  exchangeRate: number | null;
}

export type GetFinancialDayByDate = UseCase<GetFinancialDayInput, GetFinancialDayResult, DomainError>;

export const makeGetFinancialDayByDate = (
  financialDayRepository: IFinancialDayRepository,
  exchangeRateRepository: IExchangeRateRepository,
): GetFinancialDayByDate => {
  return async (input: GetFinancialDayInput) => {
    const dateStr = DateOnlyVO.create(input.date);

    const dayResult = await financialDayRepository.getOne([
      { field: NonEmptyStringVO.create(FinancialDayField.Date), value: dateStr.toString(), operator: '=' }
    ]);

    if (dayResult.isFailure) {
      return Result.fail(dayResult.getError());
    }

    const financialDay = dayResult.getValue();

    const getRateWithFallback = async (currentDateStr: string, limit = EXCHANGE_RATE_FALLBACK_DAYS_LIMIT): Promise<number | null> => {
      const rateResult = await exchangeRateRepository.getOne([
        { field: NonEmptyStringVO.create(FinancialDayField.Date), value: currentDateStr, operator: '=' }
      ]);
      if (!rateResult.isFailure) {
        const rate = rateResult.getValue();
        if (rate) {
          return rate.rate;
        }
      }
      if (limit <= 0) {
        return null;
      }
      const date = new Date(currentDateStr + 'T00:00:00Z');
      date.setUTCDate(date.getUTCDate() - 1);
      const prevDateStr = date.toISOString().split('T')[0];
      return getRateWithFallback(prevDateStr, limit - 1);
    };

    const exchangeRate = await getRateWithFallback(dateStr.toString());

    return Result.ok<GetFinancialDayResult, DomainError>({
      financialDay,
      exchangeRate,
    });
  };
};
