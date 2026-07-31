import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { zodIdString } from '../../../../../../shared-domain/src/shared/zod-schemas.js';
import { validateInput } from '../../../../../../shared-domain/src/shared/validate-input.js';
import { KnowledgeStatus } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { zodKnowledgeStatus } from '../../../../../../shared-domain/src/shared/zod-schemas.js';
import { WikiLinkVO, IWikiLink, wikiLinkSchema } from '../../../../../../shared-domain/src/knowledge/value-objects/wiki-link.vo.js';
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
  status: zodKnowledgeStatus.optional(),
  productId: zodIdString.optional(),
  createdBy: zodIdString,
  wikiLinks: z.array(wikiLinkSchema).optional(),
});

export type CreateKnowledgeInput = z.infer<typeof createKnowledgeInputSchema>;

export type CreateKnowledge = UseCase<CreateKnowledgeInput, IKnowledge, DomainError>;

export const makeCreateKnowledge = (knowledgeRepository: IKnowledgeRepository): CreateKnowledge => {
  return async (input: CreateKnowledgeInput) => {
    const parsed = validateInput(createKnowledgeInputSchema, input);
    if (parsed.isFailure) return Result.fail(parsed.getError());

    const rawLinks = parsed.getValue().wikiLinks;
    const wikiLinks: IWikiLink[] | undefined = rawLinks && rawLinks.length > 0
      ? rawLinks.map((link) => WikiLinkVO.create(link))
      : undefined;

    const composerResult = await ResultComposer.start()
      .useResult('knowledge', () => {
        return makeKnowledgeResult({
          category: parsed.getValue().category,
          title: parsed.getValue().title,
          content: parsed.getValue().content,
          hierarchyLevel: parsed.getValue().hierarchyLevel,
          tags: parsed.getValue().tags || [],
          status: parsed.getValue().status ?? KnowledgeStatus.DRAFT,
          productId: parsed.getValue().productId,
          createdBy: parsed.getValue().createdBy,
          isActive: true,
          ...(wikiLinks ? { wikiLinks } : {}),
        });
      })
      .useResult('saved', ({ knowledge }) => knowledgeRepository.create(knowledge, IdVO.create(parsed.getValue().createdBy)))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const saved = composerResult.getValue().saved;
    return Result.ok(Array.isArray(saved) ? saved[0]! : (saved as IKnowledge));
  };
};
