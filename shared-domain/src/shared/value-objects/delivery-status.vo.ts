import { z } from 'zod';
import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError, createValidationError } from '../validation-error.js';
import { DeliveryStatus } from '../../delivery/delivery.entity.js';

export type DeliveryStatusType = Opaque<DeliveryStatus, 'DeliveryStatusType'>;

export const DeliveryStatusVO = {
  create: (value: string) => {
    const result = DeliveryStatusVO.createResult(value);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (value: string): Result<DeliveryStatusType, ValidationError> => {
    const normalized = value.toUpperCase();
    if (
      z.enum([
        DeliveryStatus.PENDING,
        DeliveryStatus.DISPATCHED,
        DeliveryStatus.SENT,
        DeliveryStatus.DELIVERED,
        DeliveryStatus.COMPLETE,
        DeliveryStatus.CANCELLED,
      ]).safeParse(normalized).error
    ) {
      return Result.fail(createValidationError(`Unsupported delivery status: ${value}`));
    }

    const canonical =
      normalized === 'SENT'
        ? DeliveryStatus.DISPATCHED
        : normalized === 'COMPLETE'
          ? DeliveryStatus.DELIVERED
          : normalized;

    return Result.ok(canonical as DeliveryStatusType);
  },
};
