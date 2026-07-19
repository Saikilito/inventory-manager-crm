import { z } from 'zod';
import { IdVO } from './value-objects/id.vo.js';
import { NonEmptyStringVO } from './value-objects/non-empty-string.vo.js';
import { PositiveNumberVO } from './value-objects/positive-number.vo.js';

export const zodIdString = z.string().refine(
  (value) => !IdVO.createResult(value).isFailure,
  { message: 'Invalid ID format' },
);

export const zodOptionalNullableIdString = zodIdString.optional().nullable();

export const zodNonEmptyString = z.string().refine(
  (value) => !NonEmptyStringVO.createResult(value).isFailure,
  { message: 'Empty String is not allowed' },
).transform((value) => NonEmptyStringVO.create(value).toString());

export const zodPositiveNumber = z.number().refine(
  (value) => !PositiveNumberVO.createResult(value).isFailure,
  { message: 'Value must be a positive number' },
);
