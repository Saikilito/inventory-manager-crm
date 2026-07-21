import { z } from 'zod';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { KnowledgeStatus, KnowledgeStatusType, KnowledgeStatusVO } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { IKnowledge } from '../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { IKnowledgeRepository } from '../repositories/knowledge.repository.js';
import { IKnowledgeEdge, IKnowledgeGraph, IKnowledgeNode } from '../services/knowledge-graph.types.js';

export const getKnowledgeGraphInputSchema = z
  .object({
    status: z.enum([KnowledgeStatus.DRAFT, KnowledgeStatus.ACTIVE, KnowledgeStatus.REJECTED]).optional(),
  })
  .optional();

export type GetKnowledgeGraphInput = z.infer<typeof getKnowledgeGraphInputSchema>;

export type GetKnowledgeGraph = UseCase<GetKnowledgeGraphInput | undefined, IKnowledgeGraph, DomainError>;

const stripParentheses = (value: string): string => value.replace(/\([^)]*\)/g, '').trim();

const buildTitleKey = (title: string): string => stripParentheses(title).toLowerCase();

export const makeGetKnowledgeGraph = (
  knowledgeRepository: IKnowledgeRepository,
): GetKnowledgeGraph => {
  return async (input) => {
    if (input !== undefined) {
      const parsed = getKnowledgeGraphInputSchema.safeParse(input);
      if (!parsed.success) {
        return Result.fail(new ValidationError(parsed.error.issues.map((i) => i.message).join(', ')));
      }
    }

    const statusToQuery: KnowledgeStatusType = input?.status
      ? KnowledgeStatusVO.create(input.status)
      : KnowledgeStatusVO.create(KnowledgeStatus.ACTIVE);

    const entries = await knowledgeRepository.findByStatus(statusToQuery);

    return Result.ok(aggregateGraph(entries));
  };
};

export const aggregateGraph = (entries: IKnowledge[]): IKnowledgeGraph => {
  const nodes: IKnowledgeNode[] = entries.map((entry) => ({
    id: entry.id?.toString() ?? '',
    title: entry.title.toString(),
    category: entry.category,
    status: entry.status,
  }));

  const titleIndex = new Map<string, string>();
  for (const node of nodes) {
    if (!node.id) continue;
    titleIndex.set(buildTitleKey(node.title), node.id);
  }

  const edges: IKnowledgeEdge[] = [];
  const seenEdge = new Set<string>();

  for (const entry of entries) {
    const sourceId = entry.id?.toString() ?? '';
    if (!sourceId) continue;

    for (const link of entry.wikiLinks) {
      const linkTitle = link.title.toString();
      const resolvedId = titleIndex.get(buildTitleKey(linkTitle));
      const dedupeKey = `${sourceId}::${linkTitle}`;

      if (seenEdge.has(dedupeKey)) continue;
      seenEdge.add(dedupeKey);

      if (resolvedId) {
        edges.push({
          sourceId,
          targetTitle: linkTitle,
          targetId: resolvedId,
          resolved: true,
        });
      } else {
        edges.push({
          sourceId,
          targetTitle: linkTitle,
          resolved: false,
        });
      }
    }
  }

  return { nodes, edges };
};
