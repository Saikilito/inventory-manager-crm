import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError, createValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { zodNonEmptyString, zodOptionalNullableIdString, zodPositiveNumber, zodOptionalIdString } from '../../../../../../shared-domain/src/shared/zod-schemas.js';
import { makeExpense, ExpenseCategory, ExpenseReferenceType, IExpense, attachTransactionToExpense } from '../../../../../../shared-domain/src/expense/expense.entity.js';
import { IExpenseRepository } from '../repositories/expense.repository.js';
import { CreateEntityInput } from '../../../../../../shared-domain/src/shared/repository.js';
import { RecordExpenseUseCase } from '../../../financial/application/use-cases/record-expense.js';

export const CreateExpenseSchema = z.object({
  amount: zodPositiveNumber,
  description: zodNonEmptyString,
  category: z.nativeEnum(ExpenseCategory),
  contextId: zodOptionalNullableIdString,
  referenceId: zodOptionalNullableIdString,
  referenceType: z.nativeEnum(ExpenseReferenceType).optional().nullable(),
  accountId: zodOptionalIdString,
  isTesting: z.boolean().optional(),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

export type CreateExpense = UseCase<CreateExpenseInput, IExpense, DomainError>;

export const makeCreateExpense = (
  expenseRepository: IExpenseRepository,
  recordExpense?: RecordExpenseUseCase,
): CreateExpense => {
  return async (input: CreateExpenseInput) => {
    const parseResult = CreateExpenseSchema.safeParse(input);
    if (!parseResult.success) {
      return Result.fail(createValidationError(parseResult.error.message));
    }

    const composerResult = await ResultComposer.start()
      .useResult('expense', () => {
        return Result.ok(makeExpense({
          amount: input.amount,
          description: input.description,
          category: input.category,
          contextId: input.contextId || undefined,
          referenceId: input.referenceId || undefined,
          referenceType: input.referenceType || undefined,
          accountId: input.accountId || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      })
      .useResult('save', ({ expense }) => {
        const entity = expense as IExpense;
        const createInput = input.isTesting !== undefined 
          ? { ...entity, isTesting: input.isTesting }
          : entity;
        return expenseRepository.create(createInput as CreateEntityInput<IExpense>, IdVO.generateNil());
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const savedExpense = composerResult.getValue().save as IExpense;

    // Create financial transaction if accountId is provided
    let finalExpenseEntity = savedExpense;

    if (recordExpense && input.accountId && savedExpense.id) {
      const txResult = await recordExpense({
        expenseId: savedExpense.id.toString(),
        accountId: input.accountId,
        amount: Number(savedExpense.amount),
        description: `Expense - ${input.description}`,
      });

      if (txResult.isFailure) {
        console.error('[CreateExpense] Transaction recording failed:', txResult.getError());
        await expenseRepository.deleteByIds([savedExpense.id], IdVO.generateNil());
        return Result.fail(txResult.getError());
      }

      if (txResult.getValue()?.id) {
        // Update expense with transactionId
        const transactionId = txResult.getValue().id!;
        const updatedExpense = attachTransactionToExpense(savedExpense, transactionId);
        
        await expenseRepository.updateById(savedExpense.id!, updatedExpense, IdVO.generateNil());
        finalExpenseEntity = updatedExpense;
      }
    }

    return Result.ok<IExpense, DomainError>(finalExpenseEntity);
  };
};
