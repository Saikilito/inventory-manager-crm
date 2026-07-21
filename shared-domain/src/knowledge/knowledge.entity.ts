import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { DateTime, DateTimeVO } from '../shared/value-objects/date-time.vo.js';
import { ValidationError } from '../shared/validation-error.js';
import { Result } from '../shared/result.js';
import {
  KnowledgeCategory,
  KnowledgeCategoryType,
  KnowledgeCategoryVO,
} from './value-objects/knowledge-category.vo.js';
import {
  HierarchyLevel,
  HierarchyLevelType,
  HierarchyLevelVO,
} from './value-objects/hierarchy-level.vo.js';
import {
  KnowledgeStatus,
  KnowledgeStatusType,
  KnowledgeStatusVO,
} from './value-objects/knowledge-status.vo.js';
import { IWikiLink, WikiLinkVO } from './value-objects/wiki-link.vo.js';

export type { KnowledgeCategoryType } from './value-objects/knowledge-category.vo.js';
export type { HierarchyLevelType } from './value-objects/hierarchy-level.vo.js';
export type { KnowledgeStatusType } from './value-objects/knowledge-status.vo.js';
export { KnowledgeCategoryVO } from './value-objects/knowledge-category.vo.js';
export { HierarchyLevelVO } from './value-objects/hierarchy-level.vo.js';
export { KnowledgeStatusVO } from './value-objects/knowledge-status.vo.js';

export interface IKnowledgeMetadata {
  hierarchyLevel: HierarchyLevelType;
  tags: string[];
  createdBy: Id;
  updatedBy?: Id;
  lastVerified?: DateTime;
  productId?: Id;
}

export interface IKnowledge {
  id?: Id;
  category: KnowledgeCategoryType;
  title: NonEmptyString;
  content: NonEmptyString;
  wikiLinks: IWikiLink[];
  metadata: IKnowledgeMetadata;
  status: KnowledgeStatusType;
  isActive: boolean;
  createdAt?: DateTime;
  updatedAt?: DateTime;
}

export interface MakeKnowledgeProps {
  id?: string;
  category: string;
  title: string;
  content: string;
  wikiLinks?: IWikiLink[];
  hierarchyLevel: string;
  tags?: string[];
  createdBy: string;
  updatedBy?: string;
  lastVerified?: string;
  status?: string;
  productId?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const KNOWN_HIERARCHY_LEVELS: readonly HierarchyLevel[] = HierarchyLevelVO.getAll();
export const KNOWN_KNOWLEDGE_CATEGORIES: readonly KnowledgeCategory[] = KnowledgeCategoryVO.getAll();
export const KNOWN_KNOWLEDGE_STATUSES: readonly KnowledgeStatus[] = KnowledgeStatusVO.getAll();

const validateTags = (tags: string[]): string[] => {
  const cleaned: string[] = [];

  for (const tag of tags) {
    if (typeof tag !== 'string') continue;
    const trimmed = tag.trim();
    if (trimmed.length > 0) cleaned.push(trimmed);
  }

  return cleaned;
};

export const makeKnowledge = (props: MakeKnowledgeProps): IKnowledge => {
  const categoryResult = KnowledgeCategoryVO.createResult(props.category);
  if (categoryResult.isFailure) {
    throw new ValidationError(categoryResult.getError().message);
  }

  const hierarchyResult = HierarchyLevelVO.createResult(props.hierarchyLevel);
  if (hierarchyResult.isFailure) {
    throw new ValidationError(hierarchyResult.getError().message);
  }

  const statusResult = KnowledgeStatusVO.createResult(props.status ?? KnowledgeStatus.DRAFT);
  if (statusResult.isFailure) {
    throw new ValidationError(statusResult.getError().message);
  }

  const title = NonEmptyStringVO.create(props.title);
  const content = NonEmptyStringVO.create(props.content);

  const wikiLinks = props.wikiLinks && props.wikiLinks.length > 0
    ? props.wikiLinks
    : WikiLinkVO.extractFromContent(content);

  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    category: categoryResult.getValue(),
    title,
    content,
    wikiLinks,
    metadata: {
      hierarchyLevel: hierarchyResult.getValue(),
      tags: validateTags(props.tags || []),
      createdBy: IdVO.create(props.createdBy),
      ...(props.updatedBy ? { updatedBy: IdVO.create(props.updatedBy) } : {}),
      ...(props.lastVerified ? { lastVerified: DateTimeVO.create(props.lastVerified) } : {}),
      ...(props.productId ? { productId: IdVO.create(props.productId) } : {}),
    },
    status: statusResult.getValue(),
    isActive: props.isActive === undefined ? true : props.isActive,
    createdAt: DateTimeVO.create(props.createdAt),
    updatedAt: DateTimeVO.create(props.updatedAt),
  };
};

export const makeKnowledgeResult = (props: MakeKnowledgeProps): Result<IKnowledge, ValidationError> => {
  try {
    return Result.ok(makeKnowledge(props));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Result.fail(new ValidationError(message));
  }
};
