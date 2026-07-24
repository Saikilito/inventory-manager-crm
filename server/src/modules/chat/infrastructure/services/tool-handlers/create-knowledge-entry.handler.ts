import { KnowledgeModel } from '../../../../knowledge/infrastructure/knowledge.model.js';
import type { ToolDispatcherDependencies } from '../types.js';

export async function handleCreateKnowledgeEntry(
  args: Record<string, unknown>,
  from: string,
  dependencies: ToolDispatcherDependencies,
): Promise<Record<string, unknown>> {
  try {
    const sellerId = await dependencies.getDefaultSellerId(from);

    const newEntry = await KnowledgeModel.create({
      category: args.category || 'COMPANY',
      title: args.title,
      content: args.content,
      wikiLinks: [],
      metadata: {
        hierarchyLevel: args.hierarchyLevel || 'DATA',
        tags: Array.isArray(args.tags) ? args.tags : [],
        createdBy: sellerId,
      },
      status: 'ACTIVE',
      isActive: true,
      createdBy: sellerId,
    });

    return { success: true, id: newEntry._id.toString(), message: 'Knowledge entry created successfully.' };
  } catch (err: unknown) {
    return { error: `Failed to create knowledge entry: ${err instanceof Error ? err.message : String(err)}` };
  }
}
