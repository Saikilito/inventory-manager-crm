import { z } from 'zod';
import { match } from 'ts-pattern';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { zodIdString, zodKnowledgeStatus } from '../../../../../../shared-domain/src/shared/zod-schemas.js';
import { validateInput } from '../../../../../../shared-domain/src/shared/validate-input.js';
import {
  IKnowledge,
  makeKnowledgeResult,
  type IKnowledgeMetadata,
} from '../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { KnowledgeCategoryVO } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import { HierarchyLevelVO } from '../../../../../../shared-domain/src/knowledge/value-objects/hierarchy-level.vo.js';
import { KnowledgeStatusVO } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { WikiLinkVO } from '../../../../../../shared-domain/src/knowledge/value-objects/wiki-link.vo.js';
import { IKnowledgeRepository } from '../repositories/knowledge.repository.js';

export const updateKnowledgeInputSchema = z.object({
  id: zodIdString,
  category: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  hierarchyLevel: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: zodKnowledgeStatus.optional(),
  productId: zodIdString.optional(),
  updatedBy: zodIdString,
});

export type UpdateKnowledgeInput = z.infer<typeof updateKnowledgeInputSchema>;

export type UpdateKnowledge = UseCase<UpdateKnowledgeInput, void, DomainError>;

export const makeUpdateKnowledge = (knowledgeRepository: IKnowledgeRepository): UpdateKnowledge => {
  return async (input: UpdateKnowledgeInput) => {
    const parsed = validateInput(updateKnowledgeInputSchema, input);
    if (parsed.isFailure) return Result.fail(parsed.getError());

    const validated = parsed.getValue();

    const existingResult = await knowledgeRepository.getById(IdVO.create(validated.id));
    if (existingResult.isFailure) {
      return Result.fail(existingResult.getError());
    }

    const existing = existingResult.getValue();
    if (!existing) {
      return Result.fail(createNotFoundError(`Knowledge not found: ${validated.id}`));
    }

    const composerResult = await ResultComposer.start()
      .useResult('updated', () => {
        const nextCategory = match(validated.category)
          .when(
            (v) => v !== undefined,
            () => {
              const r = KnowledgeCategoryVO.createResult(validated.category!);
              if (r.isFailure) throw createValidationError(r.getError().message);
              return r.getValue();
            },
          )
          .otherwise(() => existing.category);

        const nextHierarchy = match(validated.hierarchyLevel)
          .when(
            (v) => v !== undefined,
            () => {
              const r = HierarchyLevelVO.createResult(validated.hierarchyLevel!);
              if (r.isFailure) throw createValidationError(r.getError().message);
              return r.getValue();
            },
          )
          .otherwise(() => existing.metadata.hierarchyLevel);

        const nextStatus = match(validated.status)
          .when(
            (v) => v !== undefined,
            () => KnowledgeStatusVO.create(validated.status!),
          )
          .otherwise(() => existing.status);

        const nextTitle = validated.title !== undefined
          ? NonEmptyStringVO.create(validated.title)
          : existing.title;
        const nextContent = validated.content !== undefined
          ? NonEmptyStringVO.create(validated.content)
          : existing.content;

        const wikiLinks = WikiLinkVO.extractFromContent(nextContent.toString());

        const nextProductId = validated.productId !== undefined
          ? IdVO.create(validated.productId)
          : existing.metadata.productId;

        const metadata: IKnowledgeMetadata = {
          hierarchyLevel: nextHierarchy,
          tags: validated.tags !== undefined ? validated.tags : existing.metadata.tags,
          createdBy: existing.metadata.createdBy,
          updatedBy: IdVO.create(validated.updatedBy),
          ...(nextProductId ? { productId: nextProductId } : {}),
        };

        if (existing.metadata.lastVerified) {
          metadata.lastVerified = existing.metadata.lastVerified;
        }

        const result = makeKnowledgeResult({
          id: validated.id,
          category: nextCategory,
          title: nextTitle.toString(),
          content: nextContent.toString(),
          hierarchyLevel: nextHierarchy,
          tags: metadata.tags,
          status: nextStatus,
          productId: nextProductId?.toString(),
          createdBy: existing.metadata.createdBy.toString(),
          updatedBy: validated.updatedBy,
          ...(existing.metadata.lastVerified ? { lastVerified: existing.metadata.lastVerified.toString() } : {}),
          isActive: existing.isActive,
          wikiLinks,
          createdAt: existing.createdAt?.toString(),
          updatedAt: new Date().toISOString(),
        });

        return result;
      })
      .useResult('save', ({ updated }) =>
        knowledgeRepository.updateById(
          IdVO.create(validated.id),
          updated as unknown as IKnowledge,
          IdVO.create(validated.updatedBy),
        ),
      )
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok<void, DomainError>();
  };
};
