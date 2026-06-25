import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError } from '../validation-error.js';

export const ClientRatingTier = {
  BASIC: 'BASIC',
  CONCURRENT: 'CONCURRENT',
  PREMIUM: 'PREMIUM',
} as const;

export type ClientRatingTier = typeof ClientRatingTier[keyof typeof ClientRatingTier];

export type RatingTier = Opaque<ClientRatingTier, 'RatingTier'>;

export const ClientRatingTierVO = {
  create: (str: string) => {
    const result = ClientRatingTierVO.createResult(str);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (str: string): Result<RatingTier, ValidationError> => {
    const upperStr = String(str).toUpperCase().trim();

    if (
      upperStr !== ClientRatingTier.BASIC &&
      upperStr !== ClientRatingTier.CONCURRENT &&
      upperStr !== ClientRatingTier.PREMIUM
    ) {
      return Result.fail(
        new ValidationError(
          `Invalid client rating tier: ${str}. Allowed tiers are BASIC, CONCURRENT, PREMIUM.`,
        ),
      );
    }

    return Result.ok(upperStr as RatingTier);
  },
};
