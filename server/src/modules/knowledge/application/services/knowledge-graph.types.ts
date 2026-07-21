import { IKnowledge } from '../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import type { KnowledgeCategoryType } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import type { KnowledgeStatusType } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';

export interface IKnowledgeNode {
  id: string;
  title: string;
  category: KnowledgeCategoryType;
  status: KnowledgeStatusType;
}

export interface IKnowledgeEdge {
  sourceId: string;
  targetTitle: string;
  targetId?: string;
  resolved: boolean;
}

export interface IKnowledgeGraph {
  nodes: IKnowledgeNode[];
  edges: IKnowledgeEdge[];
}
