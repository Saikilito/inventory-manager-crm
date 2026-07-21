import { IKnowledge } from '../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { KnowledgeStatus } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import type { KnowledgeCategoryType } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';

export const KNOWLEDGE_RELEVANCE_WEIGHTS = Object.freeze({
  TITLE_MATCH: 0.4,
  CONTENT_DENSITY_MAX: 0.3,
  CONTENT_DENSITY_PER_KEYWORD: 0.1,
  CATEGORY_BONUS: 0.2,
  RECENCY_BONUS: 0.1,
  RECENCY_THRESHOLD_DAYS: 30,
  MS_PER_DAY: 86_400_000,
  MAX_SCORE: 1.0,
} as const);

export const DEFAULT_TOP_N = 5;

export const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'have', 'had', 'he', 'in', 'is', 'it', 'its', 'of', 'on',
  'or', 'that', 'the', 'to', 'was', 'were', 'what', 'when', 'where',
  'who', 'why', 'how', 'will', 'with', 'this', 'these', 'those',
  'i', 'you', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'our', 'their', 'do', 'does', 'did', 'can',
  'could', 'should', 'would', 'que', 'de', 'la', 'el', 'en', 'un',
  'una', 'los', 'las', 'es', 'se', 'no', 'si', 'por', 'con',
  'para', 'como', 'pero', 'del', 'al', 'lo', 'le', 'su', 'sus',
  'yo', 'tu', 'mi', 'este', 'esta', 'estos', 'estas', 'aquel',
  'aquella', 'muy', 'más', 'menos', 'tan', 'tanto', 'poco', 'mucho',
]);

export interface CognitiveRouterSearchParams {
  query: string;
  topN?: number;
  category?: KnowledgeCategoryType;
  now?: Date;
}

export interface CognitiveRouterSearchResult {
  knowledge: IKnowledge;
  score: number;
}

export type CognitiveRouter = (
  params: CognitiveRouterSearchParams,
) => Promise<CognitiveRouterSearchResult[]>;

export const extractKeywords = (query: string): string[] => {
  if (!query || typeof query !== 'string') return [];

  return Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((token) => token.length >= 2 && !STOP_WORDS.has(token)),
    ),
  );
};

export const calculateRelevanceScore = (
  knowledge: IKnowledge,
  keywords: string[],
  preferredCategory: KnowledgeCategoryType | undefined,
  now: Date,
): number => {
  if (keywords.length === 0) return 0;

  const titleText = knowledge.title.toString().toLowerCase();
  const contentText = knowledge.content.toString().toLowerCase();
  const tagList = (knowledge.metadata.tags || []).map((t) => t.toLowerCase());

  let score = 0;

  const titleMatched = keywords.some((kw) => titleText.includes(kw));
  if (titleMatched) {
    score += KNOWLEDGE_RELEVANCE_WEIGHTS.TITLE_MATCH;
  }

  const matchedKeywords = new Set<string>();
  for (const kw of keywords) {
    if (contentText.includes(kw) || tagList.some((tag) => tag.includes(kw))) {
      matchedKeywords.add(kw);
    }
  }

  const densityBoost = Math.min(
    matchedKeywords.size * KNOWLEDGE_RELEVANCE_WEIGHTS.CONTENT_DENSITY_PER_KEYWORD,
    KNOWLEDGE_RELEVANCE_WEIGHTS.CONTENT_DENSITY_MAX,
  );
  score += densityBoost;

  if (preferredCategory && knowledge.category === preferredCategory) {
    score += KNOWLEDGE_RELEVANCE_WEIGHTS.CATEGORY_BONUS;
  }

  if (knowledge.updatedAt) {
    const updatedAt = new Date(knowledge.updatedAt);
    if (!isNaN(updatedAt.getTime())) {
      const ageMs = now.getTime() - updatedAt.getTime();
      const ageDays = ageMs / KNOWLEDGE_RELEVANCE_WEIGHTS.MS_PER_DAY;

      if (ageDays >= 0 && ageDays < KNOWLEDGE_RELEVANCE_WEIGHTS.RECENCY_THRESHOLD_DAYS) {
        score += KNOWLEDGE_RELEVANCE_WEIGHTS.RECENCY_BONUS;
      }
    }
  }

  return Math.min(KNOWLEDGE_RELEVANCE_WEIGHTS.MAX_SCORE, score);
};

export const makeCognitiveRouter = (deps: {
  textSearch: (query: string, category?: KnowledgeCategoryType) => Promise<IKnowledge[]>;
}): CognitiveRouter => {
  return async (params: CognitiveRouterSearchParams): Promise<CognitiveRouterSearchResult[]> => {
    const keywords = extractKeywords(params.query);
    const topN = params.topN ?? DEFAULT_TOP_N;
    const now = params.now ?? new Date();

    if (keywords.length === 0) return [];

    const searchQuery = keywords.join(' ');
    const matches = await deps.textSearch(searchQuery, params.category);

    if (matches.length === 0) return [];

    const scored = matches
      .filter((knowledge) => knowledge.isActive && knowledge.status === KnowledgeStatus.ACTIVE)
      .map((knowledge) => ({
        knowledge,
        score: calculateRelevanceScore(knowledge, keywords, params.category, now),
      }))
      .filter((entry) => entry.score > 0);

    return scored.sort((a, b) => b.score - a.score).slice(0, topN);
  };
};
