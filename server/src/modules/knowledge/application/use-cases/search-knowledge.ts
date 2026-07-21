import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { CognitiveRouter, CognitiveRouterSearchResult, DEFAULT_TOP_N } from '../../domain/services/cognitive-router.js';
import { KnowledgeCategoryVO } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import type { KnowledgeCategoryType } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import { IKnowledgeRepository } from '../repositories/knowledge.repository.js';

export const searchKnowledgeInputSchema = z.object({
  query: z.string().trim().min(1, 'query is required'),
  topN: z.coerce.number().int().positive().max(50).optional(),
  category: z.string().optional(),
});

export type SearchKnowledgeInput = z.infer<typeof searchKnowledgeInputSchema>;

export type SearchKnowledge = UseCase<SearchKnowledgeInput, CognitiveRouterSearchResult[], DomainError>;

export const makeSearchKnowledge = (deps: {
  knowledgeRepository: IKnowledgeRepository;
  cognitiveRouter: CognitiveRouter;
}): SearchKnowledge => {
  const router = deps.cognitiveRouter;
  const knowledgeRepository = deps.knowledgeRepository;

  return async (input: SearchKnowledgeInput) => {
    const parsed = searchKnowledgeInputSchema.safeParse(input);
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

    const topN = parsed.data.topN ?? DEFAULT_TOP_N;

    const results = await router({
      query: parsed.data.query,
      topN,
      ...(validatedCategory ? { category: validatedCategory } : {}),
    });

    void knowledgeRepository;

    return Result.ok(results);
  };
};
