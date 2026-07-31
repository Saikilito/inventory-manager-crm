const TRUTHY_FLAG_VALUES = ['1', 'true', 'yes', 'on'];
const DEFAULT_FLAG_VALUE = 'true';

/**
 * Shared kill-switch for the React Flow knowledge graph, consumed by both
 * the admin Knowledge Base page and the chat workspace's Knowledge Brain
 * page so the two entry points stay consistent when ops needs to disable it.
 */
export const isGraphUiEnabled = (): boolean => {
  try {
    const flag = (import.meta.env.VITE_GRAPH_UI_ENABLED as string | undefined) ?? DEFAULT_FLAG_VALUE;
    return TRUTHY_FLAG_VALUES.includes(String(flag).toLowerCase());
  } catch {
    return true;
  }
};
