import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { zodNonEmptyString, zodOptionalNullableIdString, zodPositiveNumber } from '../../../../../../shared-domain/src/shared/zod-schemas.js';
import { makeFixedExpense, IFixedExpense } from '../../../../../../shared-domain/src/expense/fixed-expense.entity.js';
import { ExpenseCategory } from '../../../../../../shared-domain/src/expense/expense.entity.js';
import { IFixedExpenseRepository } from '../repositories/fixed-expense.repository.js';
import { CreateEntityInput } from '../../../../../../shared-domain/src/shared/repository.js';

export const CreateFixedExpenseSchema = z.object({
  name: zodNonEmptyString,
  category: z.nativeEnum(ExpenseCategory),
  amount: zodPositiveNumber,
  isActive: z.boolean().optional(),
  contextId: zodOptionalNullableIdString,
  isTesting: z.boolean().optional(),
});

export type CreateFixedExpenseInput = z.infer<typeof CreateFixedExpenseSchema>;

export type CreateFixedExpense = UseCase<CreateFixedExpenseInput, IFixedExpense, DomainError>;

export const makeCreateFixedExpense = (fixedExpenseRepository: IFixedExpenseRepository): CreateFixedExpense => {
  return async (input: CreateFixedExpenseInput) => {
    const parseResult = CreateFixedExpenseSchema.safeParse(input);
    if (!parseResult.success) {
      return Result.fail(new ValidationError(parseResult.error.message));
    }

    const composerResult = await ResultComposer.start()
      .useResult('fixedExpense', () => {
        return Result.ok(makeFixedExpense({
          name: input.name,
          category: input.category,
          amount: input.amount,
          isActive: input.isActive,
          contextId: input.contextId || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      })
      .useResult('save', ({ fixedExpense }) => {
        const entity = fixedExpense as IFixedExpense;
        const createInput = input.isTesting !== undefined
          ? { ...entity, isTesting: input.isTesting }
          : entity;
        return fixedExpenseRepository.create(createInput as CreateEntityInput<IFixedExpense>, IdVO.generateNil());
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok<IFixedExpense, DomainError>(composerResult.getValue().save);
  };
};
