import { CognitiveRouter, DEFAULT_TOP_N } from '../../../knowledge/domain/services/cognitive-router.js';
import { KnowledgeCategoryType } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import { IKnowledge } from '../../../../../../shared-domain/src/knowledge/knowledge.entity.js';

export const KNOWLEDGE_INJECTOR_DEFAULTS = Object.freeze({
  TOP_N: 3,
  TOKEN_BUDGET: 500,
  CHARS_PER_TOKEN: 4,
} as const);

export const KNOWLEDGE_CONTEXT_HEADER = `==================================================
BASE DE CONOCIMIENTO DE LA EMPRESA (CONTEXTO RELEVANTE):
==================================================`;
export const KNOWLEDGE_CONTEXT_EMPTY = '[NO_RELEVANT_KNOWLEDGE]';
export const KNOWLEDGE_CONTEXT_FOOTER = '==================================================';

export interface KnowledgeInjectorOptions {
  query: string;
  topN?: number;
  category?: KnowledgeCategoryType;
  tokenBudget?: number;
  now?: Date;
}

export interface KnowledgeInjectorDeps {
  cognitiveRouter: CognitiveRouter;
}

export interface KnowledgeInjectorResult {
  block: string;
  includedTitles: string[];
}

export type KnowledgeInjector = (options: KnowledgeInjectorOptions) => Promise<KnowledgeInjectorResult>;

const formatEntry = (entry: { knowledge: IKnowledge; score: number }): string => {
  const category = entry.knowledge.category.toString();
  const title = entry.knowledge.title.toString();
  const content = entry.knowledge.content.toString();
  const tags = (entry.knowledge.metadata.tags || []).join(', ');
  const scorePct = (entry.score * 100).toFixed(0);

  const lines = [
    `### [${category}] ${title} (relevancia: ${scorePct}%)`,
    content,
  ];

  if (tags.length > 0) {
    lines.push(`Tags: ${tags}`);
  }

  return lines.join('\n\n');
};

const truncate = (text: string, charBudget: number): string => {
  if (text.length <= charBudget) return text;
  return `${text.slice(0, charBudget).trimEnd()}...`;
};

export const makeKnowledgeInjector = (deps: KnowledgeInjectorDeps): KnowledgeInjector => {
  return async (options) => {
    const topN = options.topN ?? KNOWLEDGE_INJECTOR_DEFAULTS.TOP_N;
    const tokenBudget = options.tokenBudget ?? KNOWLEDGE_INJECTOR_DEFAULTS.TOKEN_BUDGET;
    const charBudget = tokenBudget * KNOWLEDGE_INJECTOR_DEFAULTS.CHARS_PER_TOKEN;

    void DEFAULT_TOP_N;

    const results = await deps.cognitiveRouter({
      query: options.query,
      topN,
      ...(options.category ? { category: options.category } : {}),
      ...(options.now ? { now: options.now } : {}),
    });

    if (results.length === 0) {
      return { block: KNOWLEDGE_CONTEXT_EMPTY, includedTitles: [] };
    }

    const headerChars = KNOWLEDGE_CONTEXT_HEADER.length + KNOWLEDGE_CONTEXT_FOOTER.length + 4;
    const perEntryChars = Math.max(80, Math.floor((charBudget - headerChars) / results.length));
    const entries = results.map((entry) => truncate(formatEntry(entry), perEntryChars));
    const includedTitles = results.map((entry) => entry.knowledge.title.toString());

    const block = [
      KNOWLEDGE_CONTEXT_HEADER,
      entries.join('\n\n---\n\n'),
      KNOWLEDGE_CONTEXT_FOOTER,
    ].join('\n\n');

    return { block, includedTitles };
  };
};
