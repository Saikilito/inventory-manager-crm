import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const FETCH_TIMEOUT_MS = 8_000;
const MAX_RESPONSE_BYTES = 500_000;
const MAX_REDIRECTS = 3;
const ALLOWED_CONTENT_TYPES = ['text/html', 'text/plain', 'application/xhtml+xml', 'application/json'];

export interface TextResponse {
  ok: boolean;
  status: number;
  text: string;
}

export async function fetchTextResponse(
  initialUrl: string,
  init: RequestInit,
  validateInitialTarget: boolean,
): Promise<TextResponse> {
  let currentUrl = new URL(initialUrl);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    if (validateInitialTarget || redirectCount > 0) await assertPublicTarget(currentUrl);
    const response = await fetch(currentUrl, {
      ...init,
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || redirectCount === MAX_REDIRECTS) throw new Error('Unsafe or excessive redirect');
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (!ALLOWED_CONTENT_TYPES.some((allowed) => contentType.startsWith(allowed))) {
      throw new Error(`Unsupported content type: ${contentType || 'missing'}`);
    }
    return { ok: response.ok, status: response.status, text: await readLimitedText(response) };
  }

  throw new Error('Redirect limit exceeded');
}

async function readLimitedText(response: Response): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (totalBytes + value.byteLength > MAX_RESPONSE_BYTES) {
      const allowed = MAX_RESPONSE_BYTES - totalBytes;
      if (allowed > 0) {
        chunks.push(value.subarray(0, allowed));
        totalBytes += allowed;
      }
      await reader.cancel();
      break;
    }
    totalBytes += value.byteLength;
    chunks.push(value);
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(combined);
}

async function assertPublicTarget(url: URL): Promise<void> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Only HTTP(S) URLs are allowed');
  const hostname = url.hostname.toLowerCase();
  const isLocalName = hostname === 'localhost' || hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') || hostname === 'metadata.google.internal';
  if (isLocalName) throw new Error('Private network targets are not allowed');
  const addresses = isIP(hostname) ? [{ address: hostname }] : await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('Private network targets are not allowed');
  }
}

function isPrivateAddress(address: string): boolean {
  if (address.includes(':')) {
    const normalized = address.toLowerCase();
    if (normalized.startsWith('::ffff:')) return isPrivateAddress(normalized.slice(7));
    return normalized === '::' || normalized === '::1' || normalized.startsWith('fc') ||
      normalized.startsWith('fd') || /^fe[89ab]/.test(normalized) || normalized.startsWith('ff');
  }
  const [a, b] = address.split('.').map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}
