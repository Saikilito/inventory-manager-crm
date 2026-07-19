import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError } from '../validation-error.js';

export const DEFAULT_TIMEZONE = 'America/Caracas';
export type DateOnly = Opaque<string, 'DateOnly'>;

export const DateOnlyVO = {
  create: (input?: string | Date, timezone?: string): DateOnly => {
    const result = DateOnlyVO.createResult(input, timezone);
    if (result.isFailure) {
      throw result.getError();
    }
    return result.getValue();
  },

  createResult: (input?: string | Date, timezone?: string): Result<DateOnly, ValidationError> => {
    const tz = timezone || DEFAULT_TIMEZONE;

    // Fast path: YYYY-MM-DD strings are already valid and need no formatting
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
      const [y, m, d] = input.split('-').map(Number);
      const testDate = new Date(Date.UTC(y, m - 1, d));
      if (testDate.getUTCFullYear() === y && testDate.getUTCMonth() === m - 1 && testDate.getUTCDate() === d) {
        return Result.ok(input as DateOnly);
      }
      return Result.fail(new ValidationError(`Invalid calendar date: ${input}`));
    }

    const date = input instanceof Date ? input : new Date(input ?? Date.now());

    if (isNaN(date.getTime())) {
      return Result.fail(new ValidationError('Invalid date input'));
    }

    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      const parts = formatter.formatToParts(date);
      const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
      return Result.ok(`${partMap.year}-${partMap.month}-${partMap.day}` as DateOnly);
    } catch (e: unknown) {
      return Result.fail(new ValidationError(`Failed to format date for timezone ${tz}`));
    }
  }
};
