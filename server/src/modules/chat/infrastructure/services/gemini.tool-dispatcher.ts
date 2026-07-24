import { buildToolDeclarations } from './tool-declarations.js';
import { getHandler } from './tool-handlers/index.js';
import type { ToolDispatcherDependencies } from './types.js';

export { ToolDispatcherDependencies } from './types.js';
export { buildToolDeclarations };

export async function dispatchToolCall(
  name: string,
  args: Record<string, unknown>,
  from: string,
  dependencies: ToolDispatcherDependencies,
  options: { isFromCrm?: boolean },
): Promise<Record<string, unknown>> {
  const handler = getHandler(name);

  if (!handler) {
    return { error: `Unknown tool: ${name}` };
  }

  return handler(args, from, dependencies, options);
}
