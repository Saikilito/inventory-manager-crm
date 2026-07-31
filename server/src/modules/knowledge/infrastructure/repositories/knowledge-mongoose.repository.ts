import { IKnowledge } from '../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { IKnowledgeRepository } from '../../application/repositories/knowledge.repository.js';
import {
  makeMongooseBaseRepository,
  toObjectIdIfValid,
} from '../../../shared/infrastructure/repositories/mongoose-base.repository.js';
import {
  CreateEntityInput,
  UpdateEntityInput,
  IShared,
} from '../../../../../../shared-domain/src/shared/repository.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { DateTimeVO } from '../../../../../../shared-domain/src/shared/value-objects/date-time.vo.js';
import KnowledgeModel, { IKnowledgeDocument } from '../knowledge.model.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError, createDatabaseError } from '../../../../../../shared-domain/src/shared/errors.js';
import { doTryResult } from '../../../../../../shared-domain/src/shared/do-try-result.js';
import {
  KnowledgeCategory,
  KnowledgeCategoryVO,
} from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import type { KnowledgeCategoryType } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import {
  HierarchyLevel,
  HierarchyLevelVO,
} from '../../../../../../shared-domain/src/knowledge/value-objects/hierarchy-level.vo.js';
import type { HierarchyLevelType } from '../../../../../../shared-domain/src/knowledge/value-objects/hierarchy-level.vo.js';
import {
  KnowledgeStatus,
  KnowledgeStatusVO,
} from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import type { KnowledgeStatusType } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import {
  WikiLinkVO,
  IWikiLink,
} from '../../../../../../shared-domain/src/knowledge/value-objects/wiki-link.vo.js';

const mapSubLink = (link: IWikiLink): { title: string; url?: string } => {
  const title = link.title.toString();
  return link.url ? { title, url: link.url } : { title };
};

const mapToDomain = (doc: IKnowledgeDocument): IKnowledge => {
  const wikiLinks: IWikiLink[] = (doc.wikiLinks || []).map((link) => {
    const result = WikiLinkVO.createResult({
      title: link.title,
      ...(link.url ? { url: link.url } : {}),
    });
    if (result.isFailure) {
      return { title: NonEmptyStringVO.create(link.title) };
    }
    return result.getValue();
  });

  const statusResult = KnowledgeStatusVO.createResult(doc.status);
  const status: KnowledgeStatusType = statusResult.isFailure
    ? KnowledgeStatusVO.create(KnowledgeStatus.ACTIVE)
    : statusResult.getValue();

  return {
    id: doc._id.toString() as IKnowledge['id'],
    category: KnowledgeCategoryVO.create(doc.category) as IKnowledge['category'],
    title: NonEmptyStringVO.create(doc.title),
    content: NonEmptyStringVO.create(doc.content),
    wikiLinks,
    metadata: {
      hierarchyLevel: HierarchyLevelVO.create(doc.metadata.hierarchyLevel) as IKnowledge['metadata']['hierarchyLevel'],
      tags: doc.metadata.tags || [],
      createdBy: doc.metadata.createdBy.toString() as IKnowledge['metadata']['createdBy'],
      ...(doc.metadata.updatedBy
        ? { updatedBy: doc.metadata.updatedBy.toString() as IKnowledge['metadata']['updatedBy'] }
        : {}),
      ...(doc.metadata.lastVerified
        ? { lastVerified: DateTimeVO.create(doc.metadata.lastVerified.toISOString()) }
        : {}),
      ...(doc.metadata.productId
        ? { productId: doc.metadata.productId.toString() as IKnowledge['metadata']['productId'] }
        : {}),
    },
    status,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt
      ? (DateTimeVO.create(doc.createdAt.toISOString()) as IKnowledge['createdAt'])
      : undefined,
    updatedAt: doc.updatedAt
      ? (DateTimeVO.create(doc.updatedAt.toISOString()) as IKnowledge['updatedAt'])
      : undefined,
  };
};

const mapToDocumentData = (
  knowledge: CreateEntityInput<IKnowledge> | UpdateEntityInput<IKnowledge>,
): Partial<IKnowledgeDocument> => {
  const data: Partial<IKnowledgeDocument> = {};

  if (knowledge.category !== undefined) data.category = knowledge.category;
  if (knowledge.title !== undefined) data.title = knowledge.title.toString();
  if (knowledge.content !== undefined) data.content = knowledge.content.toString();
  if (knowledge.status !== undefined) data.status = knowledge.status.toString();
  if (knowledge.wikiLinks !== undefined) {
    data.wikiLinks = knowledge.wikiLinks.map(mapSubLink);
  }
  if (knowledge.isActive !== undefined) data.isActive = knowledge.isActive;

  if (knowledge.metadata) {
    data.metadata = {
      hierarchyLevel: knowledge.metadata.hierarchyLevel.toString(),
      tags: knowledge.metadata.tags || [],
      createdBy: toObjectIdIfValid(knowledge.metadata.createdBy.toString()),
      ...(knowledge.metadata.updatedBy
        ? { updatedBy: toObjectIdIfValid(knowledge.metadata.updatedBy.toString()) }
        : {}),
      ...(knowledge.metadata.lastVerified
        ? { lastVerified: new Date(knowledge.metadata.lastVerified.toString()) }
        : {}),
      ...(knowledge.metadata.productId
        ? { productId: toObjectIdIfValid(knowledge.metadata.productId.toString()) }
        : {}),
    };
  }

  return data;
};

const baseRepository = makeMongooseBaseRepository<IKnowledge, IKnowledgeDocument>({
  model: KnowledgeModel,
  mapToDomain,
  mapToDocumentData,
});

const textSearch = async (
  query: string,
  category?: KnowledgeCategoryType,
): Promise<IKnowledge[]> => {
  const result = await doTryResult(
    async () => {
      const filter: Record<string, unknown> = {
        isActive: true,
        status: KnowledgeStatus.ACTIVE,
        $text: { $search: query },
      };

      if (category) {
        filter.category = category;
      }

      const docs = await KnowledgeModel.find(filter).exec();
      return docs.map(mapToDomain);
    },
    (err) => createDatabaseError(err.message),
  );

  if (result.isFailure) return [];
  return result.getValue();
};

const softDeleteByIds = async (
  ids: IShared.VO.Id[],
  deletedBy: IShared.VO.Id,
): Promise<Result<void, DatabaseError>> => {
  return doTryResult(
    async () => {
      const objectIds = ids.map((id) => toObjectIdIfValid(id.toString()));
      await KnowledgeModel.updateMany(
        { _id: { $in: objectIds } },
        {
          $set: {
            isActive: false,
            'metadata.updatedBy': toObjectIdIfValid(deletedBy.toString()),
            updatedBy: toObjectIdIfValid(deletedBy.toString()),
          },
        },
      ).exec();
    },
    (err) => createDatabaseError(err.message),
  );
};

const findByStatus = async (status: KnowledgeStatusType): Promise<IKnowledge[]> => {
  const result = await doTryResult(
    async () => {
      const docs = await KnowledgeModel.find({
        status: status.toString(),
        isActive: { $ne: false },
      })
        .sort({ updatedAt: -1 })
        .exec();
      return docs.map(mapToDomain);
    },
    (err) => createDatabaseError(err.message),
  );

  if (result.isFailure) return [];
  return result.getValue();
};

const updateStatus = async (
  id: IShared.VO.Id,
  status: KnowledgeStatusType,
  updatedBy: IShared.VO.Id,
): Promise<Result<void, DatabaseError>> => {
  return doTryResult(
    async () => {
      const doc = await KnowledgeModel.findByIdAndUpdate(
        id,
        { $set: { status: status.toString(), updatedBy: updatedBy.toString() } },
        { new: true },
      ).exec();
      if (!doc) {
        throw new Error('Knowledge not found for status update');
      }
    },
    (err) => createDatabaseError(err.message),
  );
};

export const makeKnowledgeMongooseRepository = (): IKnowledgeRepository => {
  return {
    ...baseRepository,
    textSearch,
    softDeleteByIds,
    findByStatus,
    updateStatus,
  };
};

export { KnowledgeCategory, KnowledgeCategoryVO };
export type { KnowledgeCategoryType };
export { HierarchyLevel, HierarchyLevelVO };
export type { HierarchyLevelType };
export { KnowledgeStatus, KnowledgeStatusVO };
export type { KnowledgeStatusType };
