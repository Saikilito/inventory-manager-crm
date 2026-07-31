import { IContext } from '../../../config/apollo.js';
import { IKnowledge } from '../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { UserRole } from '../../../../../shared-domain/src/shared/value-objects/role.vo.js';
import { IdVO } from '../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { KnowledgeStatus, KnowledgeStatusType, KnowledgeCategory, KnowledgeCategoryType, HierarchyLevel, HierarchyLevelType } from '../../../../../shared-domain/src/knowledge/index.js';
import { IKnowledgeGraph, IKnowledgeNode, IKnowledgeEdge } from '../application/services/knowledge-graph.types.js';

interface KnowledgeWikiLinkInput {
  title: string;
  url?: string;
}

interface KnowledgeMetadataInput {
  hierarchyLevel: HierarchyLevel;
  tags?: string[];
  lastVerified?: string;
  productId?: string;
}

interface CreateKnowledgeInput {
  category: KnowledgeCategory;
  title: string;
  content: string;
  metadata: KnowledgeMetadataInput;
  status?: KnowledgeStatus;
  wikiLinks?: KnowledgeWikiLinkInput[];
}

interface UpdateKnowledgeInput {
  _id: string;
  category?: KnowledgeCategory;
  title?: string;
  content?: string;
  metadata?: KnowledgeMetadataInput;
  status?: KnowledgeStatus;
  wikiLinks?: KnowledgeWikiLinkInput[];
}

const mapSubLink = (link: { title: string; url?: string }) => ({
  title: link.title.toString(),
  ...(link.url ? { url: link.url } : {}),
});

const mapMetadata = (
  metadata: IKnowledge['metadata'],
  productIdOverride?: string,
) => ({
  hierarchyLevel: metadata.hierarchyLevel as HierarchyLevel,
  tags: metadata.tags || [],
  createdBy: metadata.createdBy,
  ...(metadata.updatedBy ? { updatedBy: metadata.updatedBy } : {}),
  ...(metadata.lastVerified
    ? { lastVerified: metadata.lastVerified.toString() }
    : {}),
  ...(productIdOverride
    ? { productId: productIdOverride }
    : metadata.productId
      ? { productId: metadata.productId.toString() }
      : {}),
});

const mapToGql = (knowledge: IKnowledge) => ({
  _id: knowledge.id,
  category: knowledge.category as KnowledgeCategory,
  title: knowledge.title.toString(),
  content: knowledge.content.toString(),
  wikiLinks: (knowledge.wikiLinks || []).map(mapSubLink),
  metadata: mapMetadata(knowledge.metadata),
  status: knowledge.status as KnowledgeStatus,
  isActive: knowledge.isActive,
  createdAt: knowledge.createdAt?.toString() ?? null,
  updatedAt: knowledge.updatedAt?.toString() ?? null,
});

const requireAdmin = async (
  ctx: IContext,
): Promise<{ _id: string; role: string }> => {
  const decoded = (await ctx.token()) as { email?: string } | null;
  if (!decoded || !decoded.email) {
    throw new Error('Unauthorized: authentication required');
  }

  const result = await ctx.container.user.getUserByEmail(decoded.email);
  if (result.isFailure || !result.getValue()) {
    throw new Error('Unauthorized: user not found');
  }

  const user = result.getValue()!;
  
  if (user.role !== UserRole.ADMIN) {
    throw new Error('Forbidden: admin role required');
  }
  return { _id: user.id!.toString(), role: user.role };
};

const requireAuth = async (ctx: IContext): Promise<void> => {
  const decoded = await ctx.token();
  if (!decoded) {
    throw new Error('Unauthorized: authentication required');
  }
};

const buildTagsPayload = (input: { metadata?: KnowledgeMetadataInput; tags?: string[] }) => {
  if (input.tags !== undefined) return input.tags;
  return input.metadata?.tags || [];
};

const mapGraphToGql = (graph: IKnowledgeGraph) => ({
  nodes: graph.nodes.map((node: IKnowledgeNode) => ({
    id: node.id.toString(),
    title: node.title,
    category: node.category as KnowledgeCategory,
    status: node.status as KnowledgeStatus,
    hierarchyLevel: node.hierarchyLevel as HierarchyLevel,
    content: node.content,
    tags: node.tags,
  })),
  edges: graph.edges.map((edge: IKnowledgeEdge) => ({
    sourceId: edge.sourceId.toString(),
    targetTitle: edge.targetTitle,
    ...(edge.targetId ? { targetId: edge.targetId.toString() } : {}),
    resolved: edge.resolved,
  })),
});

export default {
  Query: {
    knowledgeList: async (
      _parent: unknown,
      args: { page?: number; limit?: number; category?: KnowledgeCategory; isActive?: boolean; status?: KnowledgeStatus },
      ctx: IContext,
    ) => {
      const admin = await requireAdmin(ctx);
      const result = await ctx.container.knowledge.getKnowledgeList({
        ...(args.page !== undefined ? { page: args.page } : {}),
        ...(args.limit !== undefined ? { limit: args.limit } : {}),
        ...(args.category ? { category: args.category as KnowledgeCategoryType } : {}),
        ...(args.isActive !== undefined ? { isActive: args.isActive } : {}),
        ...(args.status ? { status: args.status as KnowledgeStatusType } : {}),
      });
      if (result.isFailure) {
        throw result.getError();
      }
      const payload = result.getValue();
      void admin;
      return {
        items: payload.items.map(mapToGql),
        total: payload.total,
        page: payload.page,
        limit: payload.limit,
        pages: payload.pages,
      };
    },

    knowledge: async (_parent: unknown, { _id }: { _id: string }, ctx: IContext) => {
      await requireAdmin(ctx);
      const result = await ctx.container.knowledge.getKnowledge({ id: _id });
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },

    searchKnowledge: async (
      _parent: unknown,
      args: { query: string; topN?: number; category?: KnowledgeCategory },
      ctx: IContext,
    ) => {
      await requireAdmin(ctx);
      const result = await ctx.container.knowledge.searchKnowledge({
        query: args.query,
        ...(args.topN !== undefined ? { topN: args.topN } : {}),
        ...(args.category ? { category: args.category as KnowledgeCategoryType } : {}),
      });
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue().map((entry) => ({
        knowledge: mapToGql(entry.knowledge),
        score: entry.score,
      }));
    },

    knowledgePending: async (
      _parent: unknown,
      args: { status?: KnowledgeStatus },
      ctx: IContext,
    ) => {
      await requireAdmin(ctx);
      const result = await ctx.container.knowledge.getPendingKnowledge(
        args.status ? { status: args.status as KnowledgeStatusType } : undefined,
      );
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue().map(mapToGql);
    },

    knowledgeGraph: async (
      _parent: unknown,
      args: { status?: KnowledgeStatus; includeDrafts?: boolean },
      ctx: IContext,
    ) => {
      if (args.includeDrafts) {
        await requireAdmin(ctx);
      } else {
        await requireAuth(ctx);
      }
      const result = await ctx.container.knowledge.getKnowledgeGraph({
        ...(args.status ? { status: args.status as KnowledgeStatusType } : {}),
        ...(args.includeDrafts ? { includeDrafts: true } : {}),
      });
      if (result.isFailure) {
        throw result.getError();
      }
      return mapGraphToGql(result.getValue());
    },
  },

  Mutation: {
    createKnowledge: async (
      _parent: unknown,
      { input }: { input: CreateKnowledgeInput },
      ctx: IContext,
    ) => {
      const admin = await requireAdmin(ctx);
      const result = await ctx.container.knowledge.createKnowledge({
        category: input.category,
        title: input.title,
        content: input.content,
        hierarchyLevel: input.metadata.hierarchyLevel as HierarchyLevelType,
        tags: buildTagsPayload({ metadata: input.metadata }),
        ...(input.status ? { status: input.status } : {}),
        ...(input.metadata.productId ? { productId: input.metadata.productId } : {}),
        ...(input.wikiLinks ? { wikiLinks: input.wikiLinks } : {}),
        createdBy: admin._id,
      });
      if (result.isFailure) {
        throw result.getError();
      }
      const created = result.getValue();
      const fetched = await ctx.container.knowledge.getKnowledge({ id: created.id!.toString() });
      if (fetched.isFailure) {
        throw fetched.getError();
      }
      return mapToGql(fetched.getValue());
    },

    updateKnowledge: async (
      _parent: unknown,
      { input }: { input: UpdateKnowledgeInput },
      ctx: IContext,
    ) => {
      const admin = await requireAdmin(ctx);
      const tags = buildTagsPayload({ tags: input.metadata?.tags });

      const result = await ctx.container.knowledge.updateKnowledge({
        id: input._id,
        ...(input.category ? { category: input.category } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.content !== undefined ? { content: input.content } : {}),
        ...(input.metadata?.hierarchyLevel
          ? { hierarchyLevel: input.metadata.hierarchyLevel as HierarchyLevelType }
          : {}),
        ...(tags.length > 0 ? { tags } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.metadata?.productId ? { productId: input.metadata.productId } : {}),
        ...(input.wikiLinks !== undefined ? { wikiLinks: input.wikiLinks } : {}),
        updatedBy: admin._id,
      });
      if (result.isFailure) {
        throw result.getError();
      }
      return true;
    },

    deleteKnowledge: async (
      _parent: unknown,
      { _id }: { _id: string },
      ctx: IContext,
    ) => {
      const admin = await requireAdmin(ctx);
      void IdVO;
      const result = await ctx.container.knowledge.deleteKnowledge({
        id: _id,
        deletedBy: admin._id,
      });
      if (result.isFailure) {
        throw result.getError();
      }
      return true;
    },

    knowledgeApprove: async (
      _parent: unknown,
      { _id }: { _id: string },
      ctx: IContext,
    ) => {
      const admin = await requireAdmin(ctx);
      const result = await ctx.container.knowledge.approveKnowledge({
        id: _id,
        updatedBy: admin._id,
      });
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },

    knowledgeReject: async (
      _parent: unknown,
      { _id }: { _id: string },
      ctx: IContext,
    ) => {
      const admin = await requireAdmin(ctx);
      const result = await ctx.container.knowledge.rejectKnowledge({
        id: _id,
        updatedBy: admin._id,
      });
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },

    knowledgeEnrich: async (
      _parent: unknown,
      { _id }: { _id: string },
      ctx: IContext,
    ) => {
      const admin = await requireAdmin(ctx);
      const result = await ctx.container.knowledge.enrichKnowledge({
        id: _id,
        updatedBy: admin._id,
      });
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },
  },
};
