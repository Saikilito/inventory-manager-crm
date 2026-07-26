import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, ReconciliationError, createReconciliationError } from '../../../../../../shared-domain/src/shared/errors.js';
import { createValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { DateOnlyVO } from '../../../../../../shared-domain/src/shared/value-objects/date-only.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { IAccount } from '../../../../../../shared-domain/src/financial/account.entity.js';
import { IFinancialDay, makeFinancialDay, FinancialDayStatus } from '../../../../../../shared-domain/src/financial/financial-day.entity.js';
import { IReconciliationReport } from '../../../../../../shared-domain/src/financial/reconciliation-report.vo.js';
import { ReconciliationStatus } from '../../../../../../shared-domain/src/financial/reconciliation-status.vo.js';
import { IFinancialDayRepository, IAccountRepository, ITransactionRepository } from '../repositories/financial.repository.js';
import { IOrderRepository } from '../../../order/application/repositories/order.repository.js';
import { IExpenseRepository } from '../../../expense/application/repositories/expense.repository.js';
import { FinancialDayField } from '../repositories/financial-day.constants.js';
import { MongoQueryConstants } from '../../../chat/infrastructure/services/gemini.constants.js';
import { makeReconcileFinancialDayUseCase } from './reconcile-financial-day.js';

export interface CloseFinancialDayInput {
  date?: string;
  blockOnDiscrepancy?: boolean;
}

export interface CloseFinancialDayOutput {
  financialDay: IFinancialDay;
  reconciliationReport?: IReconciliationReport;
}

export type CloseFinancialDay = UseCase<CloseFinancialDayInput, CloseFinancialDayOutput, DomainError>;

export const makeCloseFinancialDay = (
  financialDayRepository: IFinancialDayRepository,
  accountRepository: IAccountRepository,
  transactionRepository: ITransactionRepository,
  orderRepository: IOrderRepository,
  expenseRepository: IExpenseRepository,
): CloseFinancialDay => {
  const reconcileFinancialDay = makeReconcileFinancialDayUseCase(
    transactionRepository,
    financialDayRepository,
    orderRepository,
    expenseRepository,
  );

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
      return Result.fail(createValidationError(`Financial day not found for date ${dateStr}`));
    }

    if (financialDay.status === FinancialDayStatus.CLOSED) {
      return Result.fail(createValidationError(`Financial day for date ${dateStr} is already closed`));
    }

    // Run reconciliation before closing
    const reconciliationResult = await reconcileFinancialDay({ date: dateStr.toString() });
    
    let reconciliationReport: IReconciliationReport | undefined;
    if (!reconciliationResult.isFailure) {
      reconciliationReport = reconciliationResult.getValue();
      
      // Block closing if discrepancies exist and blockOnDiscrepancy is true
      if (input.blockOnDiscrepancy && reconciliationReport) {
        const hasDiscrepancies = reconciliationReport.status !== ReconciliationStatus.MATCHED;
        if (hasDiscrepancies) {
          return Result.fail(createReconciliationError(
            `Cannot close financial day: ${reconciliationReport.discrepancies.length} discrepancies found`
          ));
        }
      }
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

    return Result.ok<CloseFinancialDayOutput, DomainError>({
      financialDay: updatedDay,
      reconciliationReport,
    });
  };
};
