import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { KnowledgeStatus } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import {
  IKnowledge,
  makeKnowledgeResult,
} from '../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { IKnowledgeRepository } from '../repositories/knowledge.repository.js';

export const createKnowledgeInputSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  title: z.string().trim().min(1, 'Title is required'),
  content: z.string().trim().min(1, 'Content is required'),
  hierarchyLevel: z.string().min(1, 'Hierarchy level is required'),
  tags: z.array(z.string()).optional(),
  status: z.enum([KnowledgeStatus.DRAFT, KnowledgeStatus.ACTIVE, KnowledgeStatus.REJECTED]).optional(),
  productId: z.string().min(1).optional(),
  createdBy: z.string().min(1, 'createdBy is required'),
});

export type CreateKnowledgeInput = z.infer<typeof createKnowledgeInputSchema>;

export type CreateKnowledge = UseCase<CreateKnowledgeInput, IKnowledge, DomainError>;

export const makeCreateKnowledge = (knowledgeRepository: IKnowledgeRepository): CreateKnowledge => {
  return async (input: CreateKnowledgeInput) => {
    const parsed = createKnowledgeInputSchema.safeParse(input);
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ');
      return Result.fail(new ValidationError(message));
    }

    const composerResult = await ResultComposer.start()
      .useResult('knowledge', () => {
        return makeKnowledgeResult({
          category: parsed.data.category,
          title: parsed.data.title,
          content: parsed.data.content,
          hierarchyLevel: parsed.data.hierarchyLevel,
          tags: parsed.data.tags || [],
          status: parsed.data.status ?? KnowledgeStatus.DRAFT,
          productId: parsed.data.productId,
          createdBy: parsed.data.createdBy,
          isActive: true,
        });
      })
      .useResult('saved', ({ knowledge }) => knowledgeRepository.create(knowledge, IdVO.create(parsed.data.createdBy)))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const saved = composerResult.getValue().saved;
    return Result.ok(Array.isArray(saved) ? saved[0]! : (saved as IKnowledge));
  };
};
