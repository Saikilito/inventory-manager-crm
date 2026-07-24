import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { createNotFoundError, DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { createValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IKnowledge } from '../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { IKnowledgeRepository } from '../repositories/knowledge.repository.js';

export const deleteKnowledgeInputSchema = z.object({
  id: z.string().min(1, 'id is required'),
  deletedBy: z.string().min(1, 'deletedBy is required'),
});

export type DeleteKnowledgeInput = z.infer<typeof deleteKnowledgeInputSchema>;

export type DeleteKnowledge = UseCase<DeleteKnowledgeInput, void, DomainError>;

export const makeDeleteKnowledge = (knowledgeRepository: IKnowledgeRepository): DeleteKnowledge => {
  return async (input: DeleteKnowledgeInput) => {
    const parsed = deleteKnowledgeInputSchema.safeParse(input);
    if (!parsed.success) {
      return Result.fail(createValidationError(parsed.error.issues.map((i) => i.message).join(', ')));
    }

    const composerResult = await ResultComposer.start()
      .useResult('existing', () =>
        knowledgeRepository.getById(IdVO.create(parsed.data.id)),
      )
      .useResult('validateExisting', ({ existing }) => {
        const k = existing as IKnowledge | null;
        if (!k) {
          return Result.fail(createNotFoundError(`Knowledge not found: ${parsed.data.id}`));
        }
        return Result.ok(k);
      })
      .useResult('softDelete', async () => {
        const result = await knowledgeRepository.softDeleteByIds(
          [IdVO.create(parsed.data.id)],
          IdVO.create(parsed.data.deletedBy),
        );
        return result;
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok<void, DomainError>();
  };
};
