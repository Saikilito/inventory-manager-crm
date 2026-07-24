import { Result } from '../../shared/result.js';
import { Opaque } from '../../shared/opaque.js';
import { ValidationError, createValidationError } from '../../shared/validation-error.js';

export const HierarchyLevel = Object.freeze({
  ROOT: 'ROOT',
  DOMAIN: 'DOMAIN',
  TOPIC: 'TOPIC',
  DATA: 'DATA',
} as const);

export type HierarchyLevel = typeof HierarchyLevel[keyof typeof HierarchyLevel];

export type HierarchyLevelType = Opaque<HierarchyLevel, 'HierarchyLevelType'>;

export const HierarchyLevelVO = {
  create: (str: string): HierarchyLevelType => {
    const result = HierarchyLevelVO.createResult(str);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (str: string): Result<HierarchyLevelType, ValidationError> => {
    if (typeof str !== 'string') {
      return Result.fail(createValidationError('HierarchyLevel must be a string'));
    }

    const upperStr = str.toUpperCase().trim();

    const isValid = (Object.values(HierarchyLevel) as string[]).includes(upperStr);

    if (!isValid) {
      return Result.fail(
        createValidationError(
          `Invalid hierarchy level: ${str}. Allowed values: ${Object.values(HierarchyLevel).join(', ')}`,
        ),
      );
    }

    return Result.ok(upperStr as HierarchyLevelType);
  },

  getAll: (): readonly HierarchyLevel[] => Object.values(HierarchyLevel),
};

export const KNOWN_HIERARCHY_LEVELS: readonly HierarchyLevel[] = HierarchyLevelVO.getAll();
