import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { DomainError, createNotFoundError } from "../../../../../../shared-domain/src/shared/errors.js";
import { createValidationError } from "../../../../../../shared-domain/src/shared/validation-error.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { ResultComposer } from "../../../../../../shared-domain/src/shared/result-composer.js";
import { IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { DateOnlyVO } from "../../../../../../shared-domain/src/shared/value-objects/date-only.vo.js";
import { NonEmptyStringVO } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { PositiveNumberVO } from "../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js";
import { IAccount } from "../../../../../../shared-domain/src/financial/account.entity.js";
import { ITransaction, makeTransactionResult, TransactionType } from "../../../../../../shared-domain/src/financial/transaction.entity.js";
import { TransactionSource } from "../../../../../../shared-domain/src/financial/transaction-source.vo.js";
import { IFinancialDay, FinancialDayStatus, makeFinancialDay } from "../../../../../../shared-domain/src/financial/financial-day.entity.js";
import { IAccountRepository, ITransactionRepository, IFinancialDayRepository } from "../repositories/financial.repository.js";
import { FinancialDayField } from "../repositories/financial-day.constants.js";

export interface TransferFundsInput {
  sourceAccountId: string;
  targetAccountId: string;
  amount: number;
  targetAmount?: number | null;
  exchangeRate?: number | null;
  description?: string | null;
  date?: string | null;
}

export interface TransferFundsOutput {
  sourceTransaction: ITransaction;
  targetTransaction: ITransaction;
}

export type TransferFunds = UseCase<TransferFundsInput, TransferFundsOutput, DomainError>;

export const makeTransferFunds = (
  transactionRepository: ITransactionRepository,
  accountRepository: IAccountRepository,
  financialDayRepository: IFinancialDayRepository,
): TransferFunds => {
  return async (input: TransferFundsInput) => {
    const sourceId = IdVO.create(input.sourceAccountId);
    const targetId = IdVO.create(input.targetAccountId);
    const amount = PositiveNumberVO.create(input.amount);
    const exchangeRate = input.exchangeRate ? PositiveNumberVO.create(input.exchangeRate) : undefined;
    const dateStr = DateOnlyVO.create(input.date || undefined);

    const dayResult = await financialDayRepository.getOne([
      { field: NonEmptyStringVO.create(FinancialDayField.Date), value: dateStr.toString(), operator: "=" }
    ]);

    if (dayResult.isFailure) {
      return Result.fail(dayResult.getError());
    }

    const financialDay = dayResult.getValue();
    if (!financialDay) {
      return Result.fail(
        createValidationError(`No financial day open for date ${dateStr}. Open a financial day first.`)
      );
    }

    if (!financialDay.isOpen()) {
      return Result.fail(
        createValidationError(`Financial day for date ${dateStr} is closed`)
      );
    }

    const accountsResult = await ResultComposer.start()
      .useResult("source", () => accountRepository.getById(sourceId))
      .useResult("target", () => accountRepository.getById(targetId))
      .run();

    if (accountsResult.isFailure) {
      return Result.fail(accountsResult.getError());
    }

    const { source, target } = accountsResult.getValue() as {
      source: IAccount | null;
      target: IAccount | null;
    };

    if (!source) {
      return Result.fail(createNotFoundError("Source account not found"));
    }

    if (!target) {
      return Result.fail(createNotFoundError("Target account not found"));
    }

    if (source.isSame(target)) {
      return Result.fail(createValidationError("Cannot transfer funds to the same account"));
    }

    if (!source.canDebit(amount)) {
      return Result.fail(createValidationError("Insufficient funds in source account"));
    }

    const creditResult = source.calculateCreditFor(target, amount, exchangeRate);
    if (creditResult.isFailure) {
      return Result.fail(creditResult.getError());
    }
    const creditAmount = creditResult.getValue();

    const transferId = IdVO.generate();
    const defaultSourceDescription = `Transfer to ${target.name.toString()}`;
    const defaultTargetDescription = `Transfer from ${source.name.toString()}`;

    
      const sourceTxResult = makeTransactionResult({
        accountId: source.id!.toString(),
        type: TransactionType.DEBIT,
        amount,
        currency: source.currency.toString(),
        description: input.description || defaultSourceDescription,
        date: dateStr.toString(),
        financialDayId: financialDay.id!.toString(),
        sourceReferenceId: transferId.toString(),
        source: TransactionSource.TRANSFER,
      });

      const targetTxResult = makeTransactionResult({
        accountId: target.id!.toString(),
        type: TransactionType.CREDIT,
        amount: creditAmount,
        currency: target.currency.toString(),
        description: input.description || defaultTargetDescription,
        date: dateStr.toString(),
        financialDayId: financialDay.id!.toString(),
        sourceReferenceId: transferId.toString(),
        source: TransactionSource.TRANSFER,
      });

      if (sourceTxResult.isFailure) return Result.fail(sourceTxResult.getError());
      if (targetTxResult.isFailure) return Result.fail(targetTxResult.getError());
      
      const sourceTx = sourceTxResult.getValue();
      const targetTx = targetTxResult.getValue();
    

    const updatedSource = source.debit(amount);
    const updatedTarget = target.credit(creditAmount);

    const composerResult = await ResultComposer.start()
      .useResult("updateSource", () =>
        accountRepository.updateById(source.id!, updatedSource, IdVO.generateNil()),
      )
      .useResult("updateTarget", () =>
        accountRepository.updateById(target.id!, updatedTarget, IdVO.generateNil()),
      )
      .useResult("saveSourceTx", () =>
        transactionRepository.create(sourceTx, IdVO.generateNil()),
      )
      .useResult("saveTargetTx", () =>
        transactionRepository.create(targetTx, IdVO.generateNil()),
      )
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const { saveSourceTx, saveTargetTx } = composerResult.getValue() as {
      saveSourceTx: ITransaction;
      saveTargetTx: ITransaction;
    };

    return Result.ok<TransferFundsOutput, DomainError>({
      sourceTransaction: saveSourceTx,
      targetTransaction: saveTargetTx,
    });
  };
};
