import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IKnowledge } from '../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { IKnowledgeRepository } from '../repositories/knowledge.repository.js';

export const getKnowledgeInputSchema = z.object({
  id: z.string().min(1, 'id is required'),
});

export type GetKnowledgeInput = z.infer<typeof getKnowledgeInputSchema>;

export type GetKnowledge = UseCase<GetKnowledgeInput, IKnowledge, DomainError>;

export const makeGetKnowledge = (knowledgeRepository: IKnowledgeRepository): GetKnowledge => {
  return async (input: GetKnowledgeInput) => {
    const parsed = getKnowledgeInputSchema.safeParse(input);
    if (!parsed.success) {
      return Result.fail(new ValidationError(parsed.error.issues.map((i) => i.message).join(', ')));
    }

    const result = await knowledgeRepository.getById(IdVO.create(parsed.data.id));
    if (result.isFailure) {
      return Result.fail(result.getError());
    }

    const knowledge = result.getValue();
    if (!knowledge) {
      return Result.fail(new NotFoundError(`Knowledge not found: ${parsed.data.id}`));
    }

    return Result.ok(knowledge);
  };
};
