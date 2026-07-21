import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { IKnowledge } from '../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { KnowledgeStatus } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { WikiLinkVO, IWikiLink } from '../../../../../../shared-domain/src/knowledge/value-objects/wiki-link.vo.js';
import { IKnowledgeRepository } from '../repositories/knowledge.repository.js';
import { IWebEnricher } from '../services/web-enricher.js';

export const enrichKnowledgeInputSchema = z.object({
  id: z.string().min(1, 'id is required'),
  updatedBy: z.string().min(1, 'updatedBy is required'),
});

export type EnrichKnowledgeInput = z.infer<typeof enrichKnowledgeInputSchema>;

export type EnrichKnowledge = UseCase<EnrichKnowledgeInput, IKnowledge, DomainError>;

const summarizeExternalContent = (raw: string): string => {
  const stripped = raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  if (stripped.length <= 800) return stripped;
  return `${stripped.slice(0, 800).trimEnd()}...`;
};

export const makeEnrichKnowledge = (deps: {
  knowledgeRepository: IKnowledgeRepository;
  webEnricher: IWebEnricher;
}): EnrichKnowledge => {
  return async (input) => {
    const parsed = enrichKnowledgeInputSchema.safeParse(input);
    if (!parsed.success) {
      return Result.fail(new ValidationError(parsed.error.issues.map((i) => i.message).join(', ')));
    }

    const existingResult = await deps.knowledgeRepository.getById(IdVO.create(parsed.data.id));
    if (existingResult.isFailure) {
      return Result.fail(existingResult.getError());
    }

    const existing = existingResult.getValue();
    if (!existing) {
      return Result.fail(new NotFoundError(`Knowledge not found: ${parsed.data.id}`));
    }

    if (existing.status === KnowledgeStatus.ACTIVE) {
      return Result.fail(new DomainError('CANNOT_ENRICH_ACTIVE: Cannot enrich ACTIVE entries. Only DRAFT entries can be enriched.'));
    }

    const linksWithUrl = existing.wikiLinks.filter((link: IWikiLink) => link.url);

    if (linksWithUrl.length === 0) {
      return Result.ok(existing);
    }

    const fetches = await Promise.allSettled(
      linksWithUrl.map(async (link) => {
        const fetched = await deps.webEnricher.fetch(link.url as string);
        return { title: link.title.toString(), summary: summarizeExternalContent(fetched) };
      }),
    );

    const enrichedSections: string[] = [];
    for (const [index, result] of fetches.entries()) {
      if (result.status === 'rejected') continue;
      const link = linksWithUrl[index];
      if (!link) continue;
      enrichedSections.push(
        `[[${link.title.toString()}]] (auto-enriched): ${result.value.summary}`,
      );
    }

    if (enrichedSections.length === 0) {
      return Result.ok(existing);
    }

    const appendedContent = `${existing.content.toString()}\n\n## Auto-enriched references\n\n${enrichedSections.join('\n\n')}`;

    const newContent = NonEmptyStringVO.create(appendedContent);
    const wikiLinks = WikiLinkVO.extractFromContent(newContent.toString());

    const updateResult = await deps.knowledgeRepository.updateById(
      IdVO.create(parsed.data.id),
      {
        content: newContent,
        wikiLinks,
      } as unknown as Partial<IKnowledge>,
      IdVO.create(parsed.data.updatedBy),
    );

    if (updateResult.isFailure) {
      return Result.fail(updateResult.getError());
    }

    const refreshedResult = await deps.knowledgeRepository.getById(IdVO.create(parsed.data.id));
    if (refreshedResult.isFailure) {
      return Result.fail(refreshedResult.getError());
    }

    const refreshed = refreshedResult.getValue();
    if (!refreshed) {
      return Result.fail(new NotFoundError(`Knowledge not found after enrich: ${parsed.data.id}`));
    }

    return Result.ok(refreshed);
  };
};
