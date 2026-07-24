import type { ToolDispatcherDependencies } from '../types.js';

export async function handleWebFetch(
  args: Record<string, unknown>,
  _from: string,
  _dependencies: ToolDispatcherDependencies,
): Promise<Record<string, unknown>> {
  const url = args.url as string;

  if (!url) {
    return { error: 'URL is required for webFetch' };
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return { error: `Failed to fetch: HTTP ${response.status}` };
    }

    let text = await response.text();

    if (text.includes('<html')) {
      text = cleanHtml(text);
    }

    return { content: text.slice(0, 15000) };
  } catch (err: unknown) {
    return { error: `Fetch failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}

function cleanHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
