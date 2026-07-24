import { z } from 'zod';
import { Result } from '../../shared/result.js';
import { NonEmptyString, NonEmptyStringVO } from '../../shared/value-objects/non-empty-string.vo.js';
import { ValidationError, createValidationError } from '../../shared/validation-error.js';

const WIKI_LINK_REGEX = /\[\[([^\]]+)\]\]/g;

export interface IWikiLink {
  title: NonEmptyString;
  url?: string;
}

export const wikiLinkSchema = z.object({
  title: z.string().trim().nonempty(),
  url: z
    .string()
    .url()
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

export const WikiLinkVO = {
  create: (input: { title: string; url?: string }): IWikiLink => {
    const result = WikiLinkVO.createResult(input);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (input: { title: string; url?: string }): Result<IWikiLink, ValidationError> => {
    const parsed = wikiLinkSchema.safeParse(input);

    if (!parsed.success) {
      return Result.fail(
        createValidationError(`Invalid wiki link: ${parsed.error.issues.map((i) => i.message).join(', ')}`),
      );
    }

    const cleanedUrl = parsed.data.url?.trim();
    const result: IWikiLink = {
      title: NonEmptyStringVO.create(parsed.data.title),
      ...(cleanedUrl && cleanedUrl.length > 0 ? { url: cleanedUrl } : {}),
    };

    return Result.ok(result);
  },

  extractFromContent: (content: string): IWikiLink[] => {
    const matches = content.matchAll(WIKI_LINK_REGEX);
    const titles = new Set<string>();
    const links: IWikiLink[] = [];

    for (const match of matches) {
      const raw = match[1]?.trim();
      if (!raw || titles.has(raw)) continue;

      const pipeIndex = raw.indexOf('|');
      const title = pipeIndex >= 0 ? raw.substring(0, pipeIndex).trim() : raw;

      if (!title) continue;

      titles.add(raw);
      links.push({ title: title as NonEmptyString });
    }

    return links;
  },
};
