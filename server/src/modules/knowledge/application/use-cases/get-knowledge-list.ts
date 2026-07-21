import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { KnowledgeCategoryVO } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import { KnowledgeStatus, KnowledgeStatusVO } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { IKnowledge } from '../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import type { KnowledgeCategoryType } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import type { KnowledgeStatusType } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { IKnowledgeRepository } from '../repositories/knowledge.repository.js';

export const getKnowledgeListInputSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  status: z.enum([KnowledgeStatus.DRAFT, KnowledgeStatus.ACTIVE, KnowledgeStatus.REJECTED]).optional(),
});

export type GetKnowledgeListInput = z.infer<typeof getKnowledgeListInputSchema>;

export interface KnowledgeListResult {
  items: IKnowledge[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export type GetKnowledgeList = UseCase<GetKnowledgeListInput, KnowledgeListResult, DomainError>;

export const makeGetKnowledgeList = (knowledgeRepository: IKnowledgeRepository): GetKnowledgeList => {
  return async (input: GetKnowledgeListInput) => {
    const parsed = getKnowledgeListInputSchema.safeParse(input);
    if (!parsed.success) {
      return Result.fail(new ValidationError(parsed.error.issues.map((i) => i.message).join(', ')));
    }

    let validatedCategory: KnowledgeCategoryType | undefined;
    if (parsed.data.category) {
      const categoryResult = KnowledgeCategoryVO.createResult(parsed.data.category);
      if (categoryResult.isFailure) {
        return Result.fail(new ValidationError(categoryResult.getError().message));
      }
      validatedCategory = categoryResult.getValue();
    }

    let validatedStatus: KnowledgeStatusType | undefined;
    if (parsed.data.status) {
      validatedStatus = KnowledgeStatusVO.create(parsed.data.status);
    }

    const limit = parsed.data.limit ?? 20;
    const page = parsed.data.page ?? 1;
    const isActive = parsed.data.isActive === undefined ? true : parsed.data.isActive;

    const composerResult = await ResultComposer.start()
      .useResult('page', () => Result.ok(PositiveNumberVO.create(page)))
      .useResult('limit', () => Result.ok(PositiveNumberVO.create(limit)))
      .useResult('result', ({ page, limit }) =>
        knowledgeRepository.getAll({
          page,
          limit,
          where: {
            fields: [
              ...(validatedCategory
                ? [{ field: NonEmptyStringVO.create('category'), value: validatedCategory }]
                : []),
              ...(isActive ? [{ field: NonEmptyStringVO.create('isActive'), value: true }] : []),
              ...(validatedStatus
                ? [{ field: NonEmptyStringVO.create('status'), value: validatedStatus.toString() }]
                : []),
            ],
          },
          sort: { field: 'updatedAt', direction: 'DESC' },
        }),
      )
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const { result, page: usedPage, limit: usedLimit } = composerResult.getValue();

    return Result.ok({
      items: result.items as IKnowledge[],
      total: result.total,
      page: usedPage,
      limit: usedLimit,
      pages: result.pages,
    });
  };
};
