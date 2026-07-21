import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { makeKnowledge } from '../../../../../../shared-domain/src/knowledge/knowledge.entity.js';
import { IKnowledgeRepository } from '../repositories/knowledge.repository.js';
import { ProductExtractor, ProductExtractorInput } from './product-extractor.js';

export interface LibrarianService {
  extractFromProduct(input: ProductExtractorInput): Promise<void>;
  enabled: () => boolean;
}

const defaultLog = (level: 'info' | 'warn' | 'error', message: string, payload?: unknown): void => {
  const logger = console[level];
  if (typeof logger === 'function') {
    logger(message, payload ?? '');
  }
};

export const makeLibrarianService = (deps: {
  knowledgeRepository: IKnowledgeRepository;
  productExtractor: ProductExtractor;
  enabled?: boolean;
  log?: (level: 'info' | 'warn' | 'error', message: string, payload?: unknown) => void;
}): LibrarianService => {
  const enabled = deps.enabled ?? true;
  const log = deps.log ?? defaultLog;

  return {
    enabled: () => enabled,

    extractFromProduct: async (input: ProductExtractorInput): Promise<void> => {
      if (!enabled) {
        log('info', '[Librarian] Disabled — skipping extraction', { productId: input.productId.toString() });
        return;
      }

      try {
        const extracted = deps.productExtractor.extract(input);
        const knowledge = makeKnowledge({
          category: extracted.category,
          title: extracted.title,
          content: extracted.content,
          hierarchyLevel: extracted.hierarchyLevel,
          tags: extracted.tags,
          wikiLinks: extracted.wikiLinks,
          status: extracted.status,
          productId: extracted.productId.toString(),
          createdBy: input.productId.toString(),
        });

        // Fire-and-forget: do not await, do not block caller
        void deps.knowledgeRepository
          .create(knowledge, IdVO.generateNil())
          .then((result) => {
            if (result.isFailure) {
              log('warn', '[Librarian] Failed to persist extracted knowledge', {
                productId: input.productId.toString(),
                error: result.getError().message,
              });
            } else {
              log('info', '[Librarian] Extracted DRAFT knowledge', {
                productId: input.productId.toString(),
              });
            }
          })
          .catch((err: unknown) => {
            log('error', '[Librarian] Unhandled error during extraction', {
              productId: input.productId.toString(),
              error: err instanceof Error ? err.message : String(err),
            });
          });
      } catch (err) {
        log('error', '[Librarian] Failed to extract knowledge from product', {
          productId: input.productId.toString(),
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
  };
};

export type LibrarianDeps = Parameters<typeof makeLibrarianService>[0];

export const isLibrarianEnabled = (value: string | undefined): boolean => {
  if (!value) return true;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};
