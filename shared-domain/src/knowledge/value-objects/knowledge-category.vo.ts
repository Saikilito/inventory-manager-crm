import { Result } from '../../shared/result.js';
import { Opaque } from '../../shared/opaque.js';
import { ValidationError } from '../../shared/validation-error.js';

export const KnowledgeCategory = Object.freeze({
  SALES: 'SALES',
  PRODUCTS: 'PRODUCTS',
  COMPANY: 'COMPANY',
  CUSTOMER_SERVICE: 'CUSTOMER_SERVICE',
} as const);

export type KnowledgeCategory = typeof KnowledgeCategory[keyof typeof KnowledgeCategory];

export type KnowledgeCategoryType = Opaque<KnowledgeCategory, 'KnowledgeCategoryType'>;

export const KnowledgeCategoryVO = {
  create: (str: string): KnowledgeCategoryType => {
    const result = KnowledgeCategoryVO.createResult(str);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (str: string): Result<KnowledgeCategoryType, ValidationError> => {
    if (typeof str !== 'string') {
      return Result.fail(new ValidationError('KnowledgeCategory must be a string'));
    }

    const upperStr = str.toUpperCase().trim();

    const isValid = (Object.values(KnowledgeCategory) as string[]).includes(upperStr);

    if (!isValid) {
      return Result.fail(
        new ValidationError(
          `Invalid knowledge category: ${str}. Allowed values: ${Object.values(KnowledgeCategory).join(', ')}`,
        ),
      );
    }

    return Result.ok(upperStr as KnowledgeCategoryType);
  },

  getAll: (): readonly KnowledgeCategory[] => Object.values(KnowledgeCategory),
};

export const KNOWN_KNOWLEDGE_CATEGORIES: readonly KnowledgeCategory[] = KnowledgeCategoryVO.getAll();
