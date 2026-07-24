import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, createNotFoundError, createValidationError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { zodIdString, zodNonEmptyString, zodOptionalNullableIdString, zodPositiveNumber } from '../../../../../../shared-domain/src/shared/zod-schemas.js';
import { makeFixedExpense, IFixedExpense } from '../../../../../../shared-domain/src/expense/fixed-expense.entity.js';
import { ExpenseCategory } from '../../../../../../shared-domain/src/expense/expense.entity.js';
import { IFixedExpenseRepository } from '../repositories/fixed-expense.repository.js';

export const UpdateFixedExpenseSchema = z.object({
  id: zodIdString,
  name: zodNonEmptyString.optional(),
  category: z.nativeEnum(ExpenseCategory).optional(),
  amount: zodPositiveNumber.optional(),
  isActive: z.boolean().optional(),
  contextId: zodOptionalNullableIdString,
});

export type UpdateFixedExpenseInput = z.infer<typeof UpdateFixedExpenseSchema>;

export type UpdateFixedExpense = UseCase<UpdateFixedExpenseInput, IFixedExpense, DomainError>;

export const makeUpdateFixedExpense = (fixedExpenseRepository: IFixedExpenseRepository): UpdateFixedExpense => {
  return async (input: UpdateFixedExpenseInput) => {
    const parseResult = UpdateFixedExpenseSchema.safeParse(input);
    if (!parseResult.success) {
      return Result.fail(createValidationError(parseResult.error.message));
    }

    const composerResult = await ResultComposer.start()
      .useResult('existing', () => fixedExpenseRepository.getById(IdVO.create(input.id)))
      .useResult('validateExisting', ({ existing }) => {
        const exp = existing as IFixedExpense | null;
        if (!exp) {
          return Result.fail(createNotFoundError('Fixed expense template not found'));
        }
        return Result.ok(exp);
      })
      .useResult('updated', ({ validateExisting }) => {
        const existingExp = validateExisting as IFixedExpense;
        return Result.ok(makeFixedExpense({
          id: input.id,
          name: input.name !== undefined ? input.name : String(existingExp.name),
          category: input.category !== undefined ? input.category : String(existingExp.category),
          amount: input.amount !== undefined ? input.amount : Number(existingExp.amount),
          isActive: input.isActive !== undefined ? input.isActive : existingExp.isActive,
          contextId: input.contextId !== undefined
            ? (input.contextId || undefined)
            : (existingExp.contextId ? existingExp.contextId.toString() : undefined),
          createdAt: existingExp.createdAt ? existingExp.createdAt.toString() : undefined,
          updatedAt: new Date().toISOString(),
        }));
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const { updated } = composerResult.getValue() as { updated: IFixedExpense };

    const saveResult = await fixedExpenseRepository.updateById(IdVO.create(input.id), updated, IdVO.generateNil());
    if (saveResult.isFailure) {
      return Result.fail(saveResult.getError());
    }

    return Result.ok<IFixedExpense, DomainError>(updated);
  };
};
