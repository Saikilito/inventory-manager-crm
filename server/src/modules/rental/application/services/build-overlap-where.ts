import { Id } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { DateTime } from '../../../../../../shared-domain/src/shared/value-objects/date-time.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { RentalStatus } from '../../../../../../shared-domain/src/rental/rental.entity.js';
import { WhereField } from '../../../../../../shared-domain/src/shared/repository.js';

export const buildOverlapWhere = (
  prodId: Id,
  startDT: DateTime,
  endDT: DateTime,
): WhereField[] => [
  { field: NonEmptyStringVO.create('productId'), value: prodId.toString(), operator: '=' },
  { field: NonEmptyStringVO.create('status'), value: [RentalStatus.CANCELLED, RentalStatus.RETURNED], operator: 'NOT IN' },
  { field: NonEmptyStringVO.create('startDateTime'), value: new Date(endDT), operator: '<' },
  { field: NonEmptyStringVO.create('endDateTime'), value: new Date(startDT), operator: '>' },
];
