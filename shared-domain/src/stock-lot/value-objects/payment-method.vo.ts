import { Result } from '../../shared/result.js';
import { Opaque } from '../../shared/opaque.js';
import { ValidationError, createValidationError } from '../../shared/validation-error.js';

export const PaymentMethod = Object.freeze({
  CASH: 'CASH',
  CREDIT: 'CREDIT',
} as const);

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export type PaymentMethodType = Opaque<PaymentMethod, 'PaymentMethodType'>;

export const PaymentMethodVO = {
  create: (value: string): PaymentMethodType => {
    const result = PaymentMethodVO.createResult(value);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (value: string): Result<PaymentMethodType, ValidationError> => {
    if (typeof value !== 'string') {
      return Result.fail(createValidationError('PaymentMethod must be a string'));
    }

    const normalized = value.toUpperCase().trim();
    const isValid = (Object.values(PaymentMethod) as string[]).includes(normalized);

    if (!isValid) {
      return Result.fail(
        createValidationError(
          `Invalid payment method: ${value}. Allowed values: ${Object.values(PaymentMethod).join(', ')}`,
        ),
      );
    }

    return Result.ok(normalized as PaymentMethodType);
  },

  isCash: (vo: PaymentMethodType | string): boolean => vo === PaymentMethod.CASH,

  isCredit: (vo: PaymentMethodType | string): boolean => vo === PaymentMethod.CREDIT,

  equals: (voA: PaymentMethodType | string, voB: PaymentMethodType | string): boolean => voA === voB,

  getAll: (): readonly PaymentMethod[] => Object.values(PaymentMethod),
};
