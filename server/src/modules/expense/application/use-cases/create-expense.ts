import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { zodNonEmptyString, zodOptionalNullableIdString, zodPositiveNumber } from '../../../../../../shared-domain/src/shared/zod-schemas.js';
import { makeExpense, ExpenseCategory, ExpenseReferenceType, IExpense } from '../../../../../../shared-domain/src/expense/expense.entity.js';
import { IExpenseRepository } from '../repositories/expense.repository.js';
import { CreateEntityInput } from '../../../../../../shared-domain/src/shared/repository.js';

export const CreateExpenseSchema = z.object({
  amount: zodPositiveNumber,
  description: zodNonEmptyString,
  category: z.nativeEnum(ExpenseCategory),
  contextId: zodOptionalNullableIdString,
  referenceId: zodOptionalNullableIdString,
  referenceType: z.nativeEnum(ExpenseReferenceType).optional().nullable(),
  isTesting: z.boolean().optional(),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

export type CreateExpense = UseCase<CreateExpenseInput, IExpense, DomainError>;

export const makeCreateExpense = (expenseRepository: IExpenseRepository): CreateExpense => {
  return async (input: CreateExpenseInput) => {
    const parseResult = CreateExpenseSchema.safeParse(input);
    if (!parseResult.success) {
      return Result.fail(new ValidationError(parseResult.error.message));
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

    return Result.ok<IExpense, DomainError>(composerResult.getValue().save);
  };
};
