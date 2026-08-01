import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError, createValidationError } from '../validation-error.js';
import { DeliveryMethod, DELIVERY_METHODS } from '../../delivery/delivery-method.js';

export type DeliveryMethodType = Opaque<DeliveryMethod, 'DeliveryMethodType'>;

export const DeliveryMethodVO = {
  create: (value: string): DeliveryMethodType => {
    const result = DeliveryMethodVO.createResult(value);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (value: string): Result<DeliveryMethodType, ValidationError> => {
    if (typeof value !== 'string') {
      return Result.fail(createValidationError('DeliveryMethod must be a string'));
    }

    const normalized = value.toUpperCase().trim();
    const isValid = (DELIVERY_METHODS as string[]).includes(normalized);

    if (!isValid) {
      return Result.fail(
        createValidationError(
          `Invalid delivery method: ${value}. Allowed values: ${DELIVERY_METHODS.join(', ')}`,
        ),
      );
    }

    return Result.ok(normalized as DeliveryMethodType);
  },

  isPickup: (vo: DeliveryMethodType | string): boolean => {
    if (typeof vo !== 'string') return false;
    return vo.toUpperCase().trim() === DeliveryMethod.PICKUP;
  },

  isDelivery: (vo: DeliveryMethodType | string): boolean => {
    if (typeof vo !== 'string') return false;
    return vo.toUpperCase().trim() === DeliveryMethod.DELIVERY;
  },

  equals: (voA: DeliveryMethodType | string, voB: DeliveryMethodType | string): boolean => {
    if (typeof voA !== 'string' || typeof voB !== 'string') return false;
    return voA.toUpperCase().trim() === voB.toUpperCase().trim();
  },
};
