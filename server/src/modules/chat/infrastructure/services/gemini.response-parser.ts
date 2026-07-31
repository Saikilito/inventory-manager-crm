import { IExtractedData } from '../../application/use-cases/process-incoming-message.use-case.js';
import { z } from 'zod';

export interface IGeminiPart {
  text?: string;
  functionCall?: { name: string; args: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
  thought?: boolean;
  thoughtSignature?: string;
}

export interface IGeminiCandidate {
  content?: {
    role?: string;
    parts?: IGeminiPart[];
  };
  finishReason?: string;
  finishMessage?: string;
  index?: number;
}

export interface IGeminiResponseJson {
  candidates?: IGeminiCandidate[];
  promptFeedback?: {
    blockReason?: string;
    safetyRatings?: Array<{ category: string; probability: string }>;
  };
}

export interface ParsedLlmOutput {
  reply: string;
  isDrift: boolean;
  extractedData?: IExtractedData | null;
}

const nullableString = z.string().nullable().optional();
const extractedDataSchema = z.object({
  client: z.object({
    firstName: nullableString,
    lastName: nullableString,
    nationalId: nullableString,
    address: nullableString,
  }).nullable().optional(),
  cart: z.array(z.object({
    productId: nullableString,
    productName: nullableString,
    quantity: z.number().finite().nonnegative().nullable().optional(),
    price: z.number().finite().nonnegative().nullable().optional(),
  })).nullable().optional(),
});

const outputSchema = z.object({
  reply: z.string().min(1),
  isDrift: z.boolean().default(false),
  extractedData: extractedDataSchema.nullable().optional(),
});

export function extractTextAndFunctionCall(candidate?: IGeminiCandidate): {
  functionCallPart?: IGeminiPart;
  textPart?: IGeminiPart;
  extractedText: string;
} {
  const parts = candidate?.content?.parts || [];
  const functionCallPart = parts.find((p) => p.functionCall);

  const textParts = parts.filter((p) => p.text && !p.functionCall && !p.thought);
  const textPart = textParts[0];

  const extractedText = textParts.map((p) => p.text ?? '').join('\n').trim();

  return {
    functionCallPart,
    textPart,
    extractedText,
  };
}

export function parseJsonResponse(rawText: string): ParsedLlmOutput {
  const trimmed = rawText.trim();
  const sanitized = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/, '')
    .trim();

  try {
    const parsed: unknown = JSON.parse(sanitized);
    const validated = outputSchema.safeParse(parsed);
    if (!validated.success) {
      const reply = typeof parsed === 'object' && parsed !== null && 'reply' in parsed
        ? (parsed as { reply?: unknown }).reply
        : undefined;
      return {
        reply: typeof reply === 'string' && reply.trim() ? reply : rawText,
        isDrift: false,
        extractedData: null,
      };
    }
    return {
      reply: validated.data.reply,
      isDrift: validated.data.isDrift,
      extractedData: validated.data.extractedData || null,
    };
  } catch (_err) {
    console.warn('[parseJsonResponse] Direct JSON parse failed, checking for embedded JSON object:', _err);
    const jsonMatch = sanitized.match(/(\{[\s\S]*"reply"[\s\S]*\})/);
    if (jsonMatch) {
      try {
        const parsedEmbedded: unknown = JSON.parse(jsonMatch[1]);
        const validatedEmbedded = outputSchema.safeParse(parsedEmbedded);
        if (validatedEmbedded.success) {
          return {
            reply: validatedEmbedded.data.reply,
            isDrift: validatedEmbedded.data.isDrift,
            extractedData: validatedEmbedded.data.extractedData || null,
          };
        }
      } catch (embeddedErr) {
        console.warn('[parseJsonResponse] Embedded JSON parse also failed:', embeddedErr);
      }
    }

    const cleanedText = sanitized.replace(/\{[\s\S]*"reply"[\s\S]*\}\s*$/, '').trim();

    return {
      reply: cleanedText || rawText,
      isDrift: false,
      extractedData: null,
    };
  }
}

export function formatCandidateDiagnostics(resultJson: IGeminiResponseJson): string {
  const candidate = resultJson.candidates?.[0];
  const finishReason = candidate?.finishReason || 'UNKNOWN';
  const finishMessage = candidate?.finishMessage || 'None';
  const blockReason = resultJson.promptFeedback?.blockReason || 'None';

  return `Candidate finishReason: ${finishReason}, finishMessage: ${finishMessage}, promptFeedback blockReason: ${blockReason}`;
}
