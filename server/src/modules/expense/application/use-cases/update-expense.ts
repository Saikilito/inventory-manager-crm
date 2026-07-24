import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError, createNotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError, createValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import {
  zodIdString,
  zodNonEmptyString,
  zodOptionalNullableIdString,
  zodPositiveNumber,
  zodOptionalIdString,
} from '../../../../../../shared-domain/src/shared/zod-schemas.js';
import {
  makeExpense,
  ExpenseCategory,
  ExpenseReferenceType,
  IExpense,
} from '../../../../../../shared-domain/src/expense/expense.entity.js';
import { IExpenseRepository } from '../repositories/expense.repository.js';
import { RecordExpenseUseCase } from '../../../financial/application/use-cases/record-expense.js';
import { ReverseExpenseUseCase } from '../../../financial/application/use-cases/reverse-expense.js';

export const UpdateExpenseSchema = z.object({
  id: zodIdString,
  amount: zodPositiveNumber.optional(),
  description: zodNonEmptyString.optional(),
  category: z.nativeEnum(ExpenseCategory).optional(),
  contextId: zodOptionalNullableIdString,
  referenceId: zodOptionalNullableIdString,
  referenceType: z.nativeEnum(ExpenseReferenceType).optional().nullable(),
  accountId: zodOptionalIdString,
});

export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>;

export type UpdateExpense = UseCase<UpdateExpenseInput, IExpense, DomainError>;

export const makeUpdateExpense = (
  expenseRepository: IExpenseRepository,
  recordExpense?: RecordExpenseUseCase,
  reverseExpense?: ReverseExpenseUseCase,
): UpdateExpense => {
  return async (input: UpdateExpenseInput) => {
    const parseResult = UpdateExpenseSchema.safeParse(input);
    if (!parseResult.success) {
      return Result.fail(createValidationError(parseResult.error.message));
    }

    const composerResult = await ResultComposer.start()
      .useResult('existing', () => expenseRepository.getById(IdVO.create(input.id)))
      .useResult('validateExisting', ({ existing }) => {
        const exp = existing as IExpense | null;
        if (!exp) {
          return Result.fail(createNotFoundError('Expense not found'));
        }
        return Result.ok(exp);
      })
      .useResult('updated', ({ validateExisting }) => {
        const existingExp = validateExisting as IExpense;
        return Result.ok(
          makeExpense({
            id: input.id,
            amount: input.amount !== undefined ? input.amount : Number(existingExp.amount),
            description: input.description !== undefined ? input.description : String(existingExp.description),
            category: input.category !== undefined ? input.category : String(existingExp.category),
            contextId:
              input.contextId !== undefined
                ? input.contextId || undefined
                : existingExp.contextId
                  ? existingExp.contextId.toString()
                  : undefined,
            referenceId:
              input.referenceId !== undefined
                ? input.referenceId || undefined
                : existingExp.referenceId
                  ? existingExp.referenceId.toString()
                  : undefined,
            referenceType:
              input.referenceType !== undefined
                ? input.referenceType || undefined
                : existingExp.referenceType
                  ? existingExp.referenceType.toString()
                  : undefined,
            accountId:
              input.accountId !== undefined
                ? input.accountId || undefined
                : existingExp.accountId
                  ? existingExp.accountId.toString()
                  : undefined,
            transactionId: existingExp.transactionId ? existingExp.transactionId.toString() : undefined,
            createdAt: existingExp.createdAt ? existingExp.createdAt.toString() : undefined,
            updatedAt: new Date().toISOString(),
          }),
        );
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const { validateExisting, updated } = composerResult.getValue() as {
      validateExisting: IExpense;
      updated: IExpense;
    };
    const existingExp = validateExisting as IExpense;

    if (recordExpense && reverseExpense) {
      const oldAccountId = existingExp.accountId?.toString();
      const newAccountId = input.accountId;
      const oldAmount = Number(existingExp.amount);
      const newAmount = input.amount !== undefined ? input.amount : oldAmount;

      if (oldAccountId && (oldAccountId !== newAccountId || oldAmount !== newAmount)) {
        await reverseExpense({
          expenseId: input.id,
          amount: Number(existingExp.amount),
          accountId: oldAccountId,
        });
      }

      if (newAccountId && (oldAccountId !== newAccountId || oldAmount !== newAmount)) {
        const txResult = await recordExpense({
          expenseId: input.id,
          accountId: newAccountId,
          amount: Number(updated.amount),
        });

        if (!txResult.isFailure && txResult.getValue()) {
          const finalExpense = makeExpense({
            id: updated.id?.toString(),
            amount: Number(updated.amount),
            description: String(updated.description),
            category: String(updated.category),
            contextId: updated.contextId?.toString(),
            referenceId: updated.referenceId?.toString(),
            referenceType: updated.referenceType?.toString(),
            accountId: newAccountId,
            transactionId: txResult.getValue().id?.toString(),
            createdAt: updated.createdAt?.toString(),
            updatedAt: new Date().toISOString(),
          });

          const saveResult = await expenseRepository.updateById(
            IdVO.create(input.id),
            finalExpense,
            IdVO.generateNil(),
          );
          if (saveResult.isFailure) {
            return Result.fail(saveResult.getError());
          }

          return Result.ok<IExpense, DomainError>(finalExpense);
        }
      }
    }

    const saveResult = await expenseRepository.updateById(IdVO.create(input.id), updated, IdVO.generateNil());
    if (saveResult.isFailure) {
      return Result.fail(saveResult.getError());
    }

    return Result.ok<IExpense, DomainError>(updated);
  };
};
