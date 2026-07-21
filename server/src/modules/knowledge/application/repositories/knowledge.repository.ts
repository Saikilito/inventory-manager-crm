import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError } from '../../../../../../shared-domain/src/shared/errors.js';
import { BaseRepository, IShared } from '../../../../../../shared-domain/src/shared/repository.js';
import { IKnowledge } from '../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import type { KnowledgeCategoryType } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import type { KnowledgeStatusType } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';

export interface IKnowledgeRepository extends BaseRepository<IKnowledge> {
  textSearch(query: string, category?: KnowledgeCategoryType): Promise<IKnowledge[]>;
  softDeleteByIds(
    ids: IShared.VO.Id[],
    deletedBy: IShared.VO.Id,
  ): Promise<ReturnType<BaseRepository<IKnowledge>['deleteByIds']>>;
  findByStatus(status: KnowledgeStatusType): Promise<IKnowledge[]>;
  updateStatus(
    id: IShared.VO.Id,
    status: KnowledgeStatusType,
    updatedBy: IShared.VO.Id,
  ): Promise<Result<void, DatabaseError>>;
}
