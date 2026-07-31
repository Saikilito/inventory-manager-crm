import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findOne, find } = vi.hoisted(() => ({
  findOne: vi.fn(),
  find: vi.fn(),
}));

vi.mock('../../../../../knowledge/infrastructure/knowledge.model.js', () => ({
  KnowledgeModel: { findOne, find },
}));

import { handleNavigateKnowledgeBrain, ALREADY_INJECTED_KNOWLEDGE_MARKER } from '../navigate-knowledge-brain.handler.js';
import type { ToolDispatcherDependencies } from '../../types.js';

const buildNode = () => ({
  title: 'Warranty Policy',
  category: 'SALES',
  content: 'Full warranty content here.',
  metadata: { hierarchyLevel: 'TOPIC' },
});

describe('handleNavigateKnowledgeBrain', () => {
  beforeEach(() => {
    findOne.mockReset();
    find.mockReset();
  });

  it('returns the full content when the node was not already injected this turn', async () => {
    findOne.mockReturnValue({ lean: () => ({ exec: async () => buildNode() }) });
    find.mockReturnValue({ lean: () => ({ exec: async () => [] }) });

    const dependencies = { alreadyInjectedKnowledgeTitles: new Set(['Other Doc']) } as unknown as ToolDispatcherDependencies;
    const result = await handleNavigateKnowledgeBrain({ nodeTitle: 'Warranty Policy' }, '+1', dependencies);

    expect((result.currentLocation as { content: string }).content).toBe('Full warranty content here.');
  });

  it('returns a marker instead of the full content when the node was already injected this turn', async () => {
    findOne.mockReturnValue({ lean: () => ({ exec: async () => buildNode() }) });
    find.mockReturnValue({ lean: () => ({ exec: async () => [] }) });

    const dependencies = {
      alreadyInjectedKnowledgeTitles: new Set(['Warranty Policy']),
    } as unknown as ToolDispatcherDependencies;
    const result = await handleNavigateKnowledgeBrain({ nodeTitle: 'Warranty Policy' }, '+1', dependencies);

    expect((result.currentLocation as { content: string }).content).toBe(ALREADY_INJECTED_KNOWLEDGE_MARKER);
  });
});
