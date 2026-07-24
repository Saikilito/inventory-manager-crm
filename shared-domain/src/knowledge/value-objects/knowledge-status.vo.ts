import { Result } from '../../shared/result.js';
import { Opaque } from '../../shared/opaque.js';
import { ValidationError, createValidationError } from '../../shared/validation-error.js';

export const KnowledgeStatus = Object.freeze({
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
} as const);

export type KnowledgeStatus = typeof KnowledgeStatus[keyof typeof KnowledgeStatus];

export type KnowledgeStatusType = Opaque<KnowledgeStatus, 'KnowledgeStatusType'>;

export const KnowledgeStatusVO = {
  create: (str: string): KnowledgeStatusType => {
    const result = KnowledgeStatusVO.createResult(str);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (str: string): Result<KnowledgeStatusType, ValidationError> => {
    if (typeof str !== 'string') {
      return Result.fail(createValidationError('KnowledgeStatus must be a string'));
    }

    const upperStr = str.toUpperCase().trim();

    const isValid = (Object.values(KnowledgeStatus) as string[]).includes(upperStr);

    if (!isValid) {
      return Result.fail(
        createValidationError(
          `Invalid knowledge status: ${str}. Allowed values: ${Object.values(KnowledgeStatus).join(', ')}`,
        ),
      );
    }

    return Result.ok(upperStr as KnowledgeStatusType);
  },

  getAll: (): readonly KnowledgeStatus[] => Object.values(KnowledgeStatus),
};

export const KNOWN_KNOWLEDGE_STATUSES: readonly KnowledgeStatus[] = KnowledgeStatusVO.getAll();
