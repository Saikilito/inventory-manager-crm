import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError } from '../validation-error.js';
import { getErrorMessage } from '../error-utils.js';
import { DEFAULT_TIMEZONE } from './date-only.vo.js';

export type DateTime = Opaque<string, 'DateTime'>;

export const DateTimeVO = {
  create: (input?: string | Date | number, timezone?: string): DateTime => {
    const result = DateTimeVO.createResult(input, timezone);

    if (result.isFailure) {
      throw result.getError();
    }

    return result.getValue();
  },

  createResult: (input?: string | Date | number, timezone?: string): Result<DateTime, ValidationError> => {
    const tz = timezone || DEFAULT_TIMEZONE;

    const date = typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)
      ? new Date(`${input}T12:00:00`)
      : new Date(input ?? Date.now());

    if (isNaN(date.getTime())) {
      return Result.fail(new ValidationError('Invalid date input'));
    }

    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
      });

      const parts = formatter.formatToParts(date);
      const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));

      const formattedDate = `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}:${partMap.second}.${String(date.getUTCMilliseconds()).padStart(3, '0')}`;

      const tzString = date.toLocaleString('en-US', { timeZone: tz });
      const localDate = new Date(tzString);
      const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
      const offsetMs = localDate.getTime() - utcDate.getTime();

      const totalMinutes = Math.round(offsetMs / (60 * 1000));
      const sign = totalMinutes >= 0 ? '+' : '-';
      const absMinutes = Math.abs(totalMinutes);
      const hours = Math.floor(absMinutes / 60);
      const minutes = absMinutes % 60;
      const offsetStr = `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

      const fullString = `${formattedDate}${offsetStr}`;
      return Result.ok(fullString as DateTime);
    } catch (e: unknown) {
      return Result.fail(new ValidationError(`Failed to format date for timezone ${tz}: ${getErrorMessage(e)}`));
    }
  },

  format: (input: string, formatStr: string): string => {
    const regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})([+-]\d{2}:\d{2})$/;
    const match = input.match(regex);
    if (!match) {
      return input;
    }
    const [_, year, month, day, hour, minute, second, ms, offset] = match;
    
    return formatStr
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hour)
      .replace('mm', minute)
      .replace('ss', second)
      .replace('SSS', ms)
      .replace('ZZ', offset);
  }
};
