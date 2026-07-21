import { z } from 'zod';
import { match } from 'ts-pattern';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import {
  IKnowledge,
  makeKnowledgeResult,
  type IKnowledgeMetadata,
} from '../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { KnowledgeCategoryVO } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import { HierarchyLevelVO } from '../../../../../../shared-domain/src/knowledge/value-objects/hierarchy-level.vo.js';
import { KnowledgeStatus, KnowledgeStatusVO } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { WikiLinkVO } from '../../../../../../shared-domain/src/knowledge/value-objects/wiki-link.vo.js';
import { IKnowledgeRepository } from '../repositories/knowledge.repository.js';

export const updateKnowledgeInputSchema = z.object({
  id: z.string().min(1, 'id is required'),
  category: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  hierarchyLevel: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum([KnowledgeStatus.DRAFT, KnowledgeStatus.ACTIVE, KnowledgeStatus.REJECTED]).optional(),
  productId: z.string().min(1).optional(),
  updatedBy: z.string().min(1, 'updatedBy is required'),
});

export type UpdateKnowledgeInput = z.infer<typeof updateKnowledgeInputSchema>;

export type UpdateKnowledge = UseCase<UpdateKnowledgeInput, void, DomainError>;

export const makeUpdateKnowledge = (knowledgeRepository: IKnowledgeRepository): UpdateKnowledge => {
  return async (input: UpdateKnowledgeInput) => {
    const parsed = updateKnowledgeInputSchema.safeParse(input);
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => i.message).join(', ');
      return Result.fail(new ValidationError(message));
    }

    const existingResult = await knowledgeRepository.getById(IdVO.create(parsed.data.id));
    if (existingResult.isFailure) {
      return Result.fail(existingResult.getError());
    }

    const existing = existingResult.getValue();
    if (!existing) {
      return Result.fail(new NotFoundError(`Knowledge not found: ${parsed.data.id}`));
    }

    const composerResult = await ResultComposer.start()
      .useResult('updated', () => {
        const nextCategory = match(parsed.data.category)
          .when(
            (v) => v !== undefined,
            () => {
              const r = KnowledgeCategoryVO.createResult(parsed.data.category!);
              if (r.isFailure) throw new ValidationError(r.getError().message);
              return r.getValue();
            },
          )
          .otherwise(() => existing.category);

        const nextHierarchy = match(parsed.data.hierarchyLevel)
          .when(
            (v) => v !== undefined,
            () => {
              const r = HierarchyLevelVO.createResult(parsed.data.hierarchyLevel!);
              if (r.isFailure) throw new ValidationError(r.getError().message);
              return r.getValue();
            },
          )
          .otherwise(() => existing.metadata.hierarchyLevel);

        const nextStatus = match(parsed.data.status)
          .when(
            (v) => v !== undefined,
            () => KnowledgeStatusVO.create(parsed.data.status!),
          )
          .otherwise(() => existing.status);

        const nextTitle = parsed.data.title !== undefined
          ? NonEmptyStringVO.create(parsed.data.title)
          : existing.title;
        const nextContent = parsed.data.content !== undefined
          ? NonEmptyStringVO.create(parsed.data.content)
          : existing.content;

        const wikiLinks = WikiLinkVO.extractFromContent(nextContent.toString());

        const nextProductId = parsed.data.productId !== undefined
          ? IdVO.create(parsed.data.productId)
          : existing.metadata.productId;

        const metadata: IKnowledgeMetadata = {
          hierarchyLevel: nextHierarchy,
          tags: parsed.data.tags !== undefined ? parsed.data.tags : existing.metadata.tags,
          createdBy: existing.metadata.createdBy,
          updatedBy: IdVO.create(parsed.data.updatedBy),
          ...(nextProductId ? { productId: nextProductId } : {}),
        };

        if (existing.metadata.lastVerified) {
          metadata.lastVerified = existing.metadata.lastVerified;
        }

        const result = makeKnowledgeResult({
          id: parsed.data.id,
          category: nextCategory,
          title: nextTitle.toString(),
          content: nextContent.toString(),
          hierarchyLevel: nextHierarchy,
          tags: metadata.tags,
          status: nextStatus,
          productId: nextProductId?.toString(),
          createdBy: existing.metadata.createdBy.toString(),
          updatedBy: parsed.data.updatedBy,
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
          IdVO.create(parsed.data.id),
          updated as unknown as IKnowledge,
          IdVO.create(parsed.data.updatedBy),
        ),
      )
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok<void, DomainError>();
  };
};
