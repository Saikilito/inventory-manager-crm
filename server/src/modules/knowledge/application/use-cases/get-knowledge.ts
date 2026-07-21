import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { zodIdString } from '../../../../../../shared-domain/src/shared/zod-schemas.js';
import { validateInput } from '../../../../../../shared-domain/src/shared/validate-input.js';
import { IKnowledge } from '../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { IKnowledgeRepository } from '../repositories/knowledge.repository.js';

export const getKnowledgeInputSchema = z.object({
  id: zodIdString,
});

export type GetKnowledgeInput = z.infer<typeof getKnowledgeInputSchema>;

export type GetKnowledge = UseCase<GetKnowledgeInput, IKnowledge, DomainError>;

export const makeGetKnowledge = (knowledgeRepository: IKnowledgeRepository): GetKnowledge => {
  return async (input: GetKnowledgeInput) => {
    const parsed = validateInput(getKnowledgeInputSchema, input);
    if (parsed.isFailure) return Result.fail(parsed.getError());

    const { id } = parsed.getValue();

    const result = await knowledgeRepository.getById(IdVO.create(id));
    if (result.isFailure) return Result.fail(result.getError());

    const knowledge = result.getValue();
    if (!knowledge) return Result.fail(new NotFoundError(`Knowledge not found: ${id}`));

    return Result.ok(knowledge);
  };
};
