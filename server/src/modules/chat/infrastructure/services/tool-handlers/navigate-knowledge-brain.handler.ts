import { KnowledgeModel } from '../../../../knowledge/infrastructure/knowledge.model.js';
import type { ToolDispatcherDependencies } from '../types.js';

export async function handleNavigateKnowledgeBrain(
  args: Record<string, unknown>,
  _from: string,
  _dependencies: ToolDispatcherDependencies,
): Promise<Record<string, unknown>> {
  const nodeTitle = args.nodeTitle as string | undefined;

  try {
    if (!nodeTitle || nodeTitle.trim() === '') {
      return await fetchRootNodes();
    }
    return await fetchNodeByTitle(nodeTitle);
  } catch (err: unknown) {
    return { error: `Knowledge navigation failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}

async function fetchRootNodes(): Promise<Record<string, unknown>> {
  const roots = await KnowledgeModel.find(
    {
      $or: [{ wikiLinks: { $exists: false } }, { wikiLinks: { $size: 0 } }],
      isActive: true,
    },
    'title category metadata.hierarchyLevel',
  )
    .lean()
    .exec();

  return {
    message: 'Estás en el Directorio Raíz del Cerebro de Conocimiento. Estos son los ficheros e índices principales:',
    availableIndices: roots.map((r: { title: string; category: string; metadata?: { hierarchyLevel?: string } }) => ({
      title: r.title,
      type: r.metadata?.hierarchyLevel,
      category: r.category,
    })),
  };
}

async function fetchNodeByTitle(nodeTitle: string): Promise<Record<string, unknown>> {
  const node = await KnowledgeModel.findOne({ title: nodeTitle, isActive: true }).lean().exec();

  if (!node) {
    return {
      error: `No se encontró ningún índice o fichero llamado '${nodeTitle}'. Usa 'queryMongoDB' si necesitas hacer una búsqueda borrosa.`,
    };
  }

  const children = await KnowledgeModel.find(
    { 'wikiLinks.title': nodeTitle, isActive: true },
    'title category metadata.hierarchyLevel',
  )
    .lean()
    .exec();

  return {
    currentLocation: {
      title: node.title,
      type: node.metadata?.hierarchyLevel,
      category: node.category,
      content: node.content,
    },
    subDirectoriesAndFiles: children.map((c: { title: string; category: string; metadata?: { hierarchyLevel?: string } }) => ({
      title: c.title,
      type: c.metadata?.hierarchyLevel,
      category: c.category,
    })),
  };
}
