import { z } from 'zod';
import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError } from '../validation-error.js';
import { match } from 'ts-pattern';

export type HumanDuration = Opaque<number, 'HumanDuration'>;

const DURATION_REGEX = /^(\d+)([smhd])$/;

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

type DurationUnit = 's' | 'm' | 'h' | 'd';

export const HumanDurationVO = {
  create: (durationStr: string): HumanDuration => {
    const result = HumanDurationVO.createResult(durationStr);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (durationStr: string): Result<HumanDuration, ValidationError> => {
    if (typeof durationStr !== 'string') {
      return Result.fail(new ValidationError('Duration must be a string'));
    }

    const trimmed = durationStr.trim().toLowerCase();

    if (!z.string().regex(DURATION_REGEX).safeParse(trimmed).success) {
      return Result.fail(
        new ValidationError(
          `Invalid duration format: "${durationStr}". Expected format is like "15m", "2h", "30s", "1d"`
        )
      );
    }

    const matchResult = trimmed.match(DURATION_REGEX);
    if (!matchResult) {
      return Result.fail(new ValidationError('Failed to parse duration'));
    }

    const [, valueStr, unitStr] = matchResult;
    const value = parseInt(valueStr, 10);
    const unit = unitStr as DurationUnit;

    const milliseconds = match(unit)
      .with('s', () => value * SECOND_MS)
      .with('m', () => value * MINUTE_MS)
      .with('h', () => value * HOUR_MS)
      .with('d', () => value * DAY_MS)
      .exhaustive();

    return Result.ok(milliseconds as HumanDuration);
  },
};
