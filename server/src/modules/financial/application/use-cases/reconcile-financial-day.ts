import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, ReconciliationError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { DateOnlyVO } from '../../../../../../shared-domain/src/shared/value-objects/date-only.vo.js';
import { PositiveNumber, PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { IReconciliationReport, makeReconciliationReport, IReconciliationDiscrepancy } from '../../../../../../shared-domain/src/financial/reconciliation-report.vo.js';
import { ReconciliationStatus } from '../../../../../../shared-domain/src/financial/reconciliation-status.vo.js';
import { TransactionSource } from '../../../../../../shared-domain/src/financial/transaction-source.vo.js';
import { TransactionType } from '../../../../../../shared-domain/src/financial/transaction.entity.js';
import { PaymentStatus } from '../../../../../../shared-domain/src/order/order.entity.js';
import { ITransactionRepository, IFinancialDayRepository } from '../repositories/financial.repository.js';
import { IOrderRepository } from '../../../order/application/repositories/order.repository.js';
import { IExpenseRepository } from '../../../expense/application/repositories/expense.repository.js';

export interface ReconcileFinancialDayInput {
  date: string;
}

export type ReconcileFinancialDayUseCase = UseCase<ReconcileFinancialDayInput, IReconciliationReport, DomainError>;

export const makeReconcileFinancialDayUseCase = (
  transactionRepository: ITransactionRepository,
  financialDayRepository: IFinancialDayRepository,
  orderRepository: IOrderRepository,
  expenseRepository: IExpenseRepository,
): ReconcileFinancialDayUseCase => {
  return async (input: ReconcileFinancialDayInput) => {
    const date = DateOnlyVO.create(input.date);
    const dateStr = date.toString();

    // Get financial day
    const dayResult = await financialDayRepository.getOne([
      { field: 'date', value: dateStr, operator: '=' },
    ]);

    if (dayResult.isFailure) {
      return Result.fail(dayResult.getError());
    }

    const financialDay = dayResult.getValue();
    if (!financialDay) {
      return Result.fail(new ReconciliationError(`Financial day not found for date: ${dateStr}`));
    }

    // Get all PAID orders for date
    const ordersResult = await orderRepository.getAll([
      { field: 'paymentStatus', value: PaymentStatus.PAID, operator: '=' },
    ]);

    if (ordersResult.isFailure) {
      return Result.fail(ordersResult.getError());
    }

    const orders = ordersResult.getValue() || [];

    // Get all transactions for date
    const transactionsResult = await transactionRepository.getAll([
      { field: 'date', value: dateStr, operator: '=' },
    ]);

    if (transactionsResult.isFailure) {
      return Result.fail(transactionsResult.getError());
    }

    const transactions = transactionsResult.getValue() || [];

    // Get all expenses with accountId
    const expensesResult = await expenseRepository.getAll([]);
    if (expensesResult.isFailure) {
      return Result.fail(expensesResult.getError());
    }

    const expenses = (expensesResult.getValue() || []).filter((e) => e.accountId);

    // Build discrepancies
    const discrepancies: IReconciliationDiscrepancy[] = [];
    let matchedCount = 0;

    // Check expected order payment transactions
    for (const order of orders) {
      if (!order.payments) continue;

      for (const payment of order.payments) {
        const matchingTx = transactions.find(
          (tx) =>
            tx.source === TransactionSource.ORDER_PAYMENT &&
            tx.sourceReferenceId?.toString() === order.id?.toString() &&
            tx.accountId.toString() === payment.accountId.toString()
        );

        if (!matchingTx) {
          discrepancies.push({
            type: ReconciliationStatus.MISSING_TRANSACTION,
            source: TransactionSource.ORDER_PAYMENT,
            referenceId: order.id!,
            expectedAmount: payment.amount,
            description: `Missing CREDIT transaction for order ${order.id}`,
          });
        } else {
          matchedCount++;
        }
      }
    }

    // Check expected expense transactions
    for (const expense of expenses) {
      const matchingTx = transactions.find(
        (tx) =>
          tx.source === TransactionSource.EXPENSE &&
          tx.sourceReferenceId?.toString() === expense.id?.toString()
      );

      if (!matchingTx) {
        discrepancies.push({
          type: ReconciliationStatus.MISSING_TRANSACTION,
          source: TransactionSource.EXPENSE,
          referenceId: expense.id!,
          expectedAmount: expense.amount,
          description: `Missing DEBIT transaction for expense ${expense.id}`,
        });
      } else {
        matchedCount++;
      }
    }

    // Check for unexpected transactions
    for (const tx of transactions) {
      const isExpectedOrder = orders.some(
        (o) =>
          o.payments?.some(
            (p) =>
              tx.source === TransactionSource.ORDER_PAYMENT &&
              tx.sourceReferenceId?.toString() === o.id?.toString() &&
              tx.accountId.toString() === p.accountId.toString()
          )
      );

      const isExpectedExpense = expenses.some(
        (e) =>
          tx.source === TransactionSource.EXPENSE &&
          tx.sourceReferenceId?.toString() === e.id?.toString()
      );

      const isExpected =
        isExpectedOrder ||
        isExpectedExpense ||
        tx.source === TransactionSource.TRANSFER ||
        tx.source === TransactionSource.MANUAL ||
        tx.source === TransactionSource.ORDER_REFUND ||
        tx.source === TransactionSource.EXPENSE_REVERSAL ||
        tx.source === TransactionSource.FIXED_EXPENSE_PAYMENT;

      if (!isExpected) {
        discrepancies.push({
          type: ReconciliationStatus.UNEXPECTED_TRANSACTION,
          source: tx.source,
          referenceId: tx.sourceReferenceId || IdVO.generateNil(),
          actualAmount: tx.amount,
          description: `Unexpected transaction with source ${tx.source}`,
        });
      }
    }

    // Calculate balances
    const openingBalance = financialDay.openingBalances.reduce(
      (sum, b) => sum + b.balance,
      0
    );
    const closingBalance = financialDay.closingBalances?.reduce(
      (sum, b) => sum + b.balance,
      0
    ) || 0;

    const totalCredits = transactions
      .filter((tx) => tx.type === TransactionType.CREDIT)
      .reduce((sum, tx) => sum + (tx.amount as number), 0);

    const totalDebits = transactions
      .filter((tx) => tx.type === TransactionType.DEBIT)
      .reduce((sum, tx) => sum + (tx.amount as number), 0);

    // Determine overall status
    let status = ReconciliationStatus.MATCHED;
    if (discrepancies.length > 0) {
      const hasMissing = discrepancies.some((d) => d.type === ReconciliationStatus.MISSING_TRANSACTION);
      const hasUnexpected = discrepancies.some((d) => d.type === ReconciliationStatus.UNEXPECTED_TRANSACTION);
      
      if (hasMissing && hasUnexpected) {
        status = ReconciliationStatus.BALANCE_MISMATCH;
      } else if (hasMissing) {
        status = ReconciliationStatus.MISSING_TRANSACTION;
      } else {
        status = ReconciliationStatus.UNEXPECTED_TRANSACTION;
      }
    }

    const report = makeReconciliationReport({
      date: dateStr,
      status,
      matchedCount,
      discrepancies: discrepancies.map((d) => ({
        type: d.type,
        source: d.source,
        referenceId: d.referenceId.toString(),
        expectedAmount: d.expectedAmount ? Number(d.expectedAmount) : undefined,
        actualAmount: d.actualAmount ? Number(d.actualAmount) : undefined,
        description: d.description.toString(),
      })),
      openingBalance,
      closingBalance,
      totalCredits,
      totalDebits,
      financialDayId: financialDay.id!.toString(),
    });

    return Result.ok<IReconciliationReport, DomainError>(report);
  };
};
