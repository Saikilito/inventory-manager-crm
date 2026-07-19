import { z } from 'zod';
import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError } from '../validation-error.js';
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
        DeliveryStatus.DELIVERED,
        DeliveryStatus.CANCELLED,
      ]).safeParse(normalized).error
    ) {
      return Result.fail(new ValidationError(`Unsupported delivery status: ${value}`));
    }

    return Result.ok(normalized as DeliveryStatusType);
  },
};
