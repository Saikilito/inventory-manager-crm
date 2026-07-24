import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { createNotFoundError, DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { IProductRepository } from '../../../product/application/repositories/product.repository.js';
import { IOrderRepository } from '../../../order/application/repositories/order.repository.js';
import { IContextRepository } from '../repositories/context.repository.js';
import { IExpenseRepository } from '../../../expense/application/repositories/expense.repository.js';
import { IAccountRepository } from '../../../financial/application/repositories/financial.repository.js';
import { calculateContextMetrics } from '../../domain/services/context-metrics-calculator.js';
import { MongoQueryConstants } from '../../../chat/infrastructure/services/gemini.constants.js';
import type { IAccount } from '../../../../../../shared-domain/src/financial/account.entity.js';
import type { IProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import type { IOrder } from '../../../../../../shared-domain/src/order/order.entity.js';
import type { IExpense } from '../../../../../../shared-domain/src/expense/expense.entity.js';

export type {
  PeriodMetric,
  TopSellerMetric,
  AccountDistribution,
  ContextMetrics,
} from '../../domain/services/context-metrics-calculator.js';

import { ContextMetrics } from '../../domain/services/context-metrics-calculator.js';

export interface GetContextMetricsInput {
  contextId?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
}

export type GetContextMetrics = UseCase<GetContextMetricsInput, ContextMetrics, DomainError>;

export const makeGetContextMetrics = (
  productRepository: IProductRepository,
  orderRepository: IOrderRepository,
  contextRepository: IContextRepository,
  expenseRepository: IExpenseRepository,
  accountRepository?: IAccountRepository,
): GetContextMetrics => {
  return async (input: GetContextMetricsInput) => {
    if (input.contextId) {
      const contextResult = await contextRepository.getById(IdVO.create(input.contextId));
      if (contextResult.isFailure) {
        return Result.fail(contextResult.getError());
      }
      if (!contextResult.getValue()) {
        return Result.fail(createNotFoundError(`Context ${input.contextId} not found`));
      }
    }

    let allAccounts: IAccount[] = [];
    if (accountRepository) {
      const accountsResult = await accountRepository.getAll({
        limit: PositiveNumberVO.create(MongoQueryConstants.MAX_PAGE_LIMIT),
      });
      if (accountsResult.isFailure) {
        return Result.fail(accountsResult.getError());
      }
      allAccounts = accountsResult.getValue().items;
    }

    const dateFilters = [];
    if (input.startDate) {
      dateFilters.push({
        field: NonEmptyStringVO.create('createdAt'),
        value: input.startDate,
        operator: '>=' as const,
      });
    }
    if (input.endDate) {
      dateFilters.push({
        field: NonEmptyStringVO.create('createdAt'),
        value: input.endDate,
        operator: '<=' as const,
      });
    }

    let allProducts: IProduct[] = [];
    let allOrders: IOrder[] = [];
    let allExpenses: IExpense[] = [];

    if (input.contextId) {
      const productsResult = await productRepository.getAll({
        limit: PositiveNumberVO.create(MongoQueryConstants.MAX_PAGE_LIMIT),
        where: {
          fields: [
            {
              field: NonEmptyStringVO.create('contextId'),
              value: input.contextId,
              operator: '=',
            },
          ],
        },
      });
      if (productsResult.isFailure) {
        return Result.fail(productsResult.getError());
      }
      allProducts = productsResult.getValue().items;

      const expensesResult = await expenseRepository.getAll({
        limit: PositiveNumberVO.create(MongoQueryConstants.MAX_PAGE_LIMIT),
        where: {
          fields: [
            {
              field: NonEmptyStringVO.create('contextId'),
              value: input.contextId,
              operator: '=',
            },
            ...dateFilters,
          ],
        },
      });
      if (expensesResult.isFailure) {
        return Result.fail(expensesResult.getError());
      }
      allExpenses = expensesResult.getValue().items;

      const contextProductIdsArray = allProducts.map((p) => p.id?.toString()).filter(Boolean) as string[];

      if (contextProductIdsArray.length > 0) {
        const ordersResult = await orderRepository.getAll({
          limit: PositiveNumberVO.create(MongoQueryConstants.MAX_PAGE_LIMIT),
          where: {
            fields: [
              {
                field: NonEmptyStringVO.create('items.productId'),
                value: contextProductIdsArray,
                operator: '=',
              },
              ...dateFilters,
            ],
          },
        });
        if (ordersResult.isFailure) {
          return Result.fail(ordersResult.getError());
        }
        allOrders = ordersResult.getValue().items;
      }
    } else {
      const [productsRes, ordersRes, expensesRes] = await Promise.all([
        productRepository.getAll({
          limit: PositiveNumberVO.create(MongoQueryConstants.MAX_PAGE_LIMIT),
        }),
        orderRepository.getAll({
          limit: PositiveNumberVO.create(MongoQueryConstants.MAX_PAGE_LIMIT),
          where: dateFilters.length > 0 ? { fields: dateFilters } : undefined,
        }),
        expenseRepository.getAll({
          limit: PositiveNumberVO.create(MongoQueryConstants.MAX_PAGE_LIMIT),
          where: dateFilters.length > 0 ? { fields: dateFilters } : undefined,
        }),
      ]);

      if (productsRes.isFailure) return Result.fail(productsRes.getError());
      if (ordersRes.isFailure) return Result.fail(ordersRes.getError());
      if (expensesRes.isFailure) return Result.fail(expensesRes.getError());

      allProducts = productsRes.getValue().items;
      allOrders = ordersRes.getValue().items;
      allExpenses = expensesRes.getValue().items;
    }

    const metrics = calculateContextMetrics({
      products: allProducts,
      orders: allOrders,
      expenses: allExpenses,
      accounts: allAccounts,
      contextId: input.contextId,
      startDate: input.startDate,
      endDate: input.endDate,
      period: input.period,
    });

    return Result.ok<ContextMetrics, DomainError>(metrics);
  };
};
