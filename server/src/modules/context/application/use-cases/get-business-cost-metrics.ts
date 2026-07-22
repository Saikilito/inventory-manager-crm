import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { IExpenseRepository } from '../../../expense/application/repositories/expense.repository.js';
import { IClientRepository } from '../../../client/application/repositories/client.repository.js';
import { IFixedExpenseRepository } from '../../../expense/application/repositories/fixed-expense.repository.js';
import { calculateBusinessCostMetrics } from '../../domain/services/business-cost-metrics-calculator.js';
import { BusinessCostMetrics } from '../../domain/services/business-cost-metrics.types.js';
import { MongoQueryConstants } from '../../../chat/infrastructure/services/gemini.constants.js';
import ClientModel from '../../../client/infrastructure/client.model.js';

export type { BusinessCostMetrics } from '../../domain/services/business-cost-metrics.types.js';

export interface GetBusinessCostMetricsInput {
  contextId?: string;
  referenceDate?: string;
}

export type GetBusinessCostMetrics = UseCase<
  GetBusinessCostMetricsInput,
  BusinessCostMetrics,
  DomainError
>;

export const makeGetBusinessCostMetrics = (
  expenseRepository: IExpenseRepository,
  fixedExpenseRepository: IFixedExpenseRepository,
  clientRepository: IClientRepository,
): GetBusinessCostMetrics => {
  return async (input: GetBusinessCostMetricsInput) => {
    const referenceDate = input.referenceDate ? new Date(input.referenceDate) : new Date();

    const whereClause = input.contextId
      ? {
          fields: [
            {
              field: NonEmptyStringVO.create('contextId'),
              value: input.contextId,
              operator: '=' as const,
            },
          ],
        }
      : undefined;

    const [expensesResult, fixedExpensesResult] = await Promise.all([
      expenseRepository.getAll({
        limit: PositiveNumberVO.create(MongoQueryConstants.MAX_PAGE_LIMIT),
        where: whereClause,
      }),
      fixedExpenseRepository.getAll({
        limit: PositiveNumberVO.create(MongoQueryConstants.MAX_PAGE_LIMIT),
        where: whereClause,
      }),
    ]);

    if (expensesResult.isFailure) {
      return Result.fail(expensesResult.getError());
    }
    if (fixedExpensesResult.isFailure) {
      return Result.fail(fixedExpensesResult.getError());
    }

    // Query clients directly from Mongoose to get createdAt
    const clientQuery = input.contextId
      ? ClientModel.find({ contextId: input.contextId }).lean()
      : ClientModel.find().lean();

    const clientDocs = await clientQuery;

    const expenses = expensesResult.getValue().items.map((e) => ({
      amount: Number(e.amount),
      createdAt: e.createdAt,
      contextId: e.contextId?.toString(),
    }));

    const fixedExpenses = fixedExpensesResult.getValue().items.map((fe) => ({
      amount: Number(fe.amount),
      isActive: fe.isActive,
      contextId: fe.contextId?.toString(),
    }));

    const clients = clientDocs.map((c) => ({
      createdAt: c.createdAt,
    }));

    const metrics = calculateBusinessCostMetrics({
      expenses,
      fixedExpenses,
      clients,
      contextId: input.contextId,
      referenceDate,
    });

    return Result.ok<BusinessCostMetrics, DomainError>(metrics);
  };
};
