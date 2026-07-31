import type { ToolDispatcherDependencies } from '../types.js';
import { fetchTextResponse } from './safe-web-response.js';

const MAX_SEARCH_RESULTS = 8;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const SEARCH_STOPWORDS = new Set([
  'de', 'la', 'el', 'en', 'con', 'para', 'que', 'los', 'las', 'del', 'una', 'uno',
  'por', 'sobre', 'es', 'son', 'y', 'o', 'a', 'al', 'su', 'sus', 'se', 'un',
]);

export async function handleWebFetch(
  args: Record<string, unknown>,
  _from: string,
  _dependencies: ToolDispatcherDependencies,
): Promise<Record<string, unknown>> {
  const urlArg = typeof args.url === 'string' ? args.url.trim() : '';
  const queryArg = typeof args.query === 'string' ? args.query.trim() : '';

  const isValidUrl = isHttpUrl(urlArg);

  if (queryArg || (urlArg && !isValidUrl)) {
    const searchQuery = queryArg || urlArg;
    try {
      const searchOutput = await searchWeb(searchQuery);
      return { content: searchOutput };
    } catch (err: unknown) {
      return { error: `Web search failed: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  if (!urlArg || !isValidUrl) {
    return {
      error:
        'A search query ("query") or a valid URL ("url") starting with http:// or https:// is required for webFetch',
    };
  }

  try {
    const response = await fetchTextResponse(urlArg, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    }, true);

    if (!response.ok) {
      return { error: `Failed to fetch URL: HTTP ${response.status}` };
    }

    let text = response.text;

    if (text.includes('<html')) {
      text = cleanHtml(text);
    }

    return { content: text.slice(0, 15_000) };
  } catch (err: unknown) {
    return { error: `Fetch failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}

function isHttpUrl(str: string): boolean {
  if (!str) return false;
  try {
    const parsed = new URL(str);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (err) {
    console.info('[isHttpUrl] Invalid URL string provided:', str, err);
    return false;
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

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export async function searchWeb(rawQuery: string): Promise<string> {
  const query = cleanQuery(rawQuery);
  const queryKeywords = extractKeywords(query);
  const results: SearchResult[] = [];
  const seenUrls = new Set<string>();

  const isUsefulUrl = (href: string): boolean => {
    if (!href || !href.startsWith('http')) return false;
    const lower = href.toLowerCase();
    return (
      !lower.includes('bing.com') &&
      !lower.includes('microsoft.com') &&
      !lower.includes('yelp.com') &&
      !lower.includes('duckduckgo.com')
    );
  };

  const isRelevant = (haystack: string): boolean =>
    queryKeywords.length === 0 || queryKeywords.some((kw) => haystack.includes(kw));

  const addResult = (title: string, url: string, snippet: string) => {
    const cleanT = stripTags(title);
    const cleanU = stripTags(url);
    const cleanS = stripTags(snippet);
    if (!cleanT || !cleanU || seenUrls.has(cleanU) || !isUsefulUrl(cleanU)) return;
    if (!isRelevant(normalizeForMatch(`${cleanT} ${cleanS}`))) {
      console.warn(`[web-fetch] Discarded irrelevant result "${cleanT}" for query "${query}"`);
      return;
    }
    seenUrls.add(cleanU);
    results.push({ title: cleanT, url: cleanU, snippet: cleanS });
  };

  const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_API_KEY;
  const googleCx = process.env.GOOGLE_CSE_ID || process.env.GOOGLE_SEARCH_CX;
  if (googleApiKey && googleCx) {
    try {
      const googleUrl = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(googleApiKey)}&cx=${encodeURIComponent(googleCx)}&q=${encodeURIComponent(query)}&hl=es`;
      const response = await fetch(googleUrl, {
        headers: { 'User-Agent': USER_AGENT },
      });
      if (response.ok) {
        const json = (await response.json()) as {
          items?: Array<{ title?: string; link?: string; snippet?: string }>;
        };
        if (Array.isArray(json.items)) {
          for (const item of json.items) {
            if (item.title && item.link) {
              addResult(item.title, item.link, item.snippet || '');
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[web-fetch] Google Custom Search failed for query "${query}":`, err instanceof Error ? err.message : err);
    }
  }

  try {
    const rssUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&format=rss`;
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'es-VE,es-ES;q=0.9,es;q=0.8,en;q=0.7',
      },
    });

    if (response.ok && response.status === 200) {
      const xml = await response.text();
      const items = xml.split('<item>');
      for (const item of items.slice(1)) {
        const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/i);
        const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/i);
        const descMatch = item.match(/<description>([\s\S]*?)<\/description>/i);
        if (titleMatch && linkMatch) {
          addResult(titleMatch[1], linkMatch[1], descMatch ? descMatch[1] : '');
        }
      }
    } else {
      console.warn(`[web-fetch] Bing RSS returned HTTP ${response.status} for query "${query}"`);
    }
  } catch (err) {
    console.warn(`[web-fetch] Bing RSS failed for query "${query}":`, err instanceof Error ? err.message : err);
  }

  if (results.length < 3) {
    try {
      const apiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
      const response = await fetch(apiUrl, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (response.ok && response.status === 200) {
        const json = (await response.json()) as {
          Heading?: string;
          AbstractText?: string;
          AbstractURL?: string;
          RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
        };
        if (json.AbstractText && json.AbstractURL) {
          addResult(json.Heading || query, json.AbstractURL, json.AbstractText);
        }
        if (Array.isArray(json.RelatedTopics)) {
          for (const topic of json.RelatedTopics) {
            if (topic.Text && topic.FirstURL) {
              addResult(topic.Text.slice(0, 80), topic.FirstURL, topic.Text);
            }
          }
        }
      } else {
        console.warn(`[web-fetch] DuckDuckGo Instant Answer returned HTTP ${response.status} for query "${query}"`);
      }
    } catch (err) {
      console.warn(`[web-fetch] DuckDuckGo Instant Answer failed for query "${query}":`, err instanceof Error ? err.message : err);
    }
  }

  if (results.length < 3) {
    try {
      const ddgResults = await searchDuckDuckGoHtml(query);
      for (const r of ddgResults) {
        addResult(r.title, r.url, r.snippet);
      }
    } catch (err) {
      console.warn(`[web-fetch] DuckDuckGo HTML failed for query "${query}":`, err instanceof Error ? err.message : err);
    }
  }

  if (results.length < 3) {
    try {
      const liteResults = await searchDuckDuckGoLite(query);
      for (const r of liteResults) {
        addResult(r.title, r.url, r.snippet);
      }
    } catch (err) {
      console.warn(`[web-fetch] DuckDuckGo Lite failed for query "${query}":`, err instanceof Error ? err.message : err);
    }
  }

  if (results.length === 0) {
    console.warn(`[web-fetch] All search providers failed or returned no results for query "${query}"`);
    return `No se encontraron resultados de búsqueda para "${query}".`;
  }

  return formatSearchResults(query, results);
}

function cleanQuery(rawQuery: string): string {
  const cleaned = rawQuery
    .replace(/^(?:buscar|busca|que dice|dame|mira|encuentra|información|informacion|sobre)\b\s*/gi, '')
    .replace(/\b(?:en la web|en internet|por favor|sobre esa batería|sobre esta bateria)\b/gi, '')
    .trim();
  return cleaned.length > 0 ? cleaned : rawQuery;
}

function normalizeForMatch(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function extractKeywords(query: string): string[] {
  return normalizeForMatch(query)
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !SEARCH_STOPWORDS.has(word));
}

function stripTags(str: string): string {
  return str
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function searchDuckDuckGoHtml(query: string): Promise<SearchResult[]> {
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetchTextResponse(
    searchUrl,
    {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
    },
    false,
  );

  if (!response.ok || response.status !== 200 || response.text.includes('bots use DuckDuckGo')) {
    const reason = response.text.includes('bots use DuckDuckGo')
      ? 'blocked by bot challenge'
      : `returned HTTP ${response.status}`;
    console.warn(`[web-fetch] DuckDuckGo HTML ${reason} for query "${query}"`);
    return [];
  }

  const html = response.text;
  const results: SearchResult[] = [];
  const blocks = html.split(/<div [^>]*class=\"[^\"]*results_links[^\"]*\"/);

  for (const block of blocks.slice(1)) {
    if (block.includes('result--ad')) continue;

    const titleMatch = block.match(/<a [^>]*class=\"[^\"]*result__a[^\"]*\"[^>]*>([\s\S]*?)<\/a>/i);
    const hrefMatch =
      block.match(/href=\"([^\"]*uddg=[^\"]*)\"/i) ||
      block.match(/<a [^>]*class=\"[^\"]*result__a[^\"]*\"[^>]*href=\"([^\"]*)\"/i);
    const snippetMatch =
      block.match(/<a [^>]*class=\"[^\"]*result__snippet[^\"]*\"[^>]*>([\s\S]*?)<\/a>/i) ||
      block.match(/class=\"[^\"]*result__snippet[^\"]*\"[^>]*>([\s\S]*?)<\/(?:a|div|span)>/i);

    if (titleMatch && hrefMatch) {
      let href = hrefMatch[1];
      if (href.includes('uddg=')) {
        try {
          const matchUddg = href.match(/uddg=([^&]+)/);
          if (matchUddg) href = decodeURIComponent(matchUddg[1]);
        } catch (err) {
          console.warn('[searchDuckDuckGoHtml] Failed to decode UDDG link:', err);
        }
      }
      if (titleMatch[1] && href) {
        results.push({
          title: stripTags(titleMatch[1]),
          url: href,
          snippet: snippetMatch ? stripTags(snippetMatch[1]) : '',
        });
      }
    }
  }

  return results;
}

async function searchDuckDuckGoLite(query: string): Promise<SearchResult[]> {
  const url = 'https://lite.duckduckgo.com/lite/';
  const response = await fetchTextResponse(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
    },
    body: 'q=' + encodeURIComponent(query),
  }, false);

  if (!response.ok) {
    console.warn(`[web-fetch] DuckDuckGo Lite returned HTTP ${response.status} for query "${query}"`);
    return [];
  }

  const html = response.text;
  const results: SearchResult[] = [];
  const trs = html.split('<tr>');

  for (let i = 0; i < trs.length; i++) {
    const tr = trs[i];
    if (tr.includes('result-sponsored')) continue;

    const linkMatch = tr.match(/<a [^>]*href=\"([^\"]*)\"[^>]*class=['"]result-link['"][^>]*>([\s\S]*?)<\/a>/i);
    if (linkMatch) {
      const rawHref = linkMatch[1];
      const title = linkMatch[2].replace(/<[^>]+>/g, '').trim();
      let href = rawHref;
      if (rawHref.includes('uddg=')) {
        try {
          const matchUddg = rawHref.match(/uddg=([^&]+)/);
          if (matchUddg) href = decodeURIComponent(matchUddg[1]);
        } catch (err) {
          console.warn('[searchDuckDuckGoLite] Failed to decode UDDG link:', err);
          href = rawHref;
        }
      }

      let snippet = '';
      if (i + 1 < trs.length && trs[i + 1].includes('result-snippet')) {
        const snippetMatch = trs[i + 1].match(/class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/i);
        if (snippetMatch) {
          snippet = snippetMatch[1].replace(/<[^>]+>/g, '').trim();
        }
      }

      if (title && href) {
        results.push({ title, snippet, url: href });
      }
    }
  }

  return results;
}

function formatSearchResults(query: string, results: SearchResult[]): string {
  const topResults = results.slice(0, MAX_SEARCH_RESULTS);
  const formatted = topResults
    .map(
      (r, idx) =>
        `${idx + 1}. Título: ${r.title}\n   URL: ${r.url}${r.snippet ? `\n   Resumen: ${r.snippet}` : ''}`,
    )
    .join('\n\n');

  return `Resultados de búsqueda en la web para "${query}":\n\n${formatted}`;
}
