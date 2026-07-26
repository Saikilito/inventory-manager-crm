import { Result } from '../../shared/result.js';
import { Opaque } from '../../shared/opaque.js';
import { ValidationError, createValidationError } from '../../shared/validation-error.js';

export const StockLotStatus = Object.freeze({
  DRAFT: 'DRAFT',
  RECEIVED: 'RECEIVED',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
} as const);

export type StockLotStatus = (typeof StockLotStatus)[keyof typeof StockLotStatus];

export type StockLotStatusType = Opaque<StockLotStatus, 'StockLotStatusType'>;

export const StockLotStatusVO = {
  create: (value: string): StockLotStatusType => {
    const result = StockLotStatusVO.createResult(value);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (value: string): Result<StockLotStatusType, ValidationError> => {
    if (typeof value !== 'string') {
      return Result.fail(createValidationError('StockLotStatus must be a string'));
    }

    const normalized = value.toUpperCase().trim();
    const isValid = (Object.values(StockLotStatus) as string[]).includes(normalized);

    if (!isValid) {
      return Result.fail(
        createValidationError(
          `Invalid stock lot status: ${value}. Allowed values: ${Object.values(StockLotStatus).join(', ')}`,
        ),
      );
    }

    return Result.ok(normalized as StockLotStatusType);
  },

  isDraft: (vo: StockLotStatusType | string): boolean => vo === StockLotStatus.DRAFT,

  isReceived: (vo: StockLotStatusType | string): boolean => vo === StockLotStatus.RECEIVED,

  isPartial: (vo: StockLotStatusType | string): boolean => vo === StockLotStatus.PARTIAL,

  isPaid: (vo: StockLotStatusType | string): boolean => vo === StockLotStatus.PAID,

  equals: (voA: StockLotStatusType | string, voB: StockLotStatusType | string): boolean => voA === voB,

  getAll: (): readonly StockLotStatus[] => Object.values(StockLotStatus),
};
