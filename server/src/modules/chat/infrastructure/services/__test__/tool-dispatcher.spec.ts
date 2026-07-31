import { describe, expect, it, vi } from 'vitest';
import { AgentRole } from '../../../../../../../shared-domain/src/chat/agent.entity.js';
import { dispatchToolCall } from '../gemini.tool-dispatcher.js';
import { ToolName } from '../tool-names.js';
import type { ToolDispatcherDependencies } from '../types.js';

describe('dispatchToolCall', () => {
  it('rejects undeclared tools at dispatch', async () => {
    const result = await dispatchToolCall(
      ToolName.QUERY_MONGODB,
      {},
      'crm',
      {} as ToolDispatcherDependencies,
      { profile: AgentRole.LIBRARIAN, isFromCrm: true, enabledTools: [] },
    );
    expect(result.code).toBe('TOOL_NOT_ALLOWED');
  });

  it('returns a structured error when a handler throws', async () => {
    const dependencies = {
      calculateDeliveryFee: vi.fn().mockRejectedValue(new Error('dependency failed')),
    } as unknown as ToolDispatcherDependencies;
    const result = await dispatchToolCall(
      ToolName.CALCULATE_DELIVERY_FEE,
      { lat: 1, lng: 2 },
      'crm',
      dependencies,
      { profile: AgentRole.SALES },
    );
    expect(result).toMatchObject({ code: 'TOOL_EXECUTION_FAILED', tool: ToolName.CALCULATE_DELIVERY_FEE });
  });
});
