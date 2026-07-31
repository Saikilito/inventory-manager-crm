import { buildToolDeclarations } from './tool-declarations.js';
import { getHandler } from './tool-handlers/index.js';
import type { ToolDispatcherDependencies } from './types.js';
import { resolveAllowedToolNames, type ToolPermissionContext } from './tool-permissions.js';

export type { ToolDispatcherDependencies } from './types.js';
export { buildToolDeclarations };

export async function dispatchToolCall(
  name: string,
  args: Record<string, unknown>,
  from: string,
  dependencies: ToolDispatcherDependencies,
  options: ToolPermissionContext,
): Promise<Record<string, unknown>> {
  const allowedTools = resolveAllowedToolNames(options);
  if (!allowedTools.has(name)) {
    return { error: 'Tool call rejected', code: 'TOOL_NOT_ALLOWED', tool: name };
  }

  const handler = getHandler(name);

  if (!handler) {
    return { error: `Unknown tool: ${name}` };
  }

  try {
    return await handler(args, from, dependencies, options);
  } catch (error: unknown) {
    return {
      error: 'Tool execution failed',
      code: 'TOOL_EXECUTION_FAILED',
      tool: name,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}
