import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { DateTime, DateTimeVO } from '../shared/value-objects/date-time.vo.js';
import { NonNegativeNumber, NonNegativeNumberVO } from '../shared/value-objects/non-negative-number.vo.js';
import { Result } from '../shared/result.js';
import { ValidationError, createValidationError } from '../shared/validation-error.js';
import { getErrorMessage } from '../shared/error-utils.js';

export const RentalStatus = {
  RESERVED: 'RESERVED',
  ACTIVE: 'ACTIVE',
  RETURNED: 'RETURNED',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;

export type RentalStatus = typeof RentalStatus[keyof typeof RentalStatus];

export interface IRentalReservation {
  id?: Id;
  productId: Id;
  orderId: Id;
  startDateTime: DateTime;
  endDateTime: DateTime;
  quantity: NonNegativeNumber;
  status: RentalStatus;
}

export const makeRentalReservation = (props: {
  id?: string;
  productId: string;
  orderId: string;
  startDateTime: string | Date | number;
  endDateTime: string | Date | number;
  quantity: number;
  status: string;
}): Result<IRentalReservation, ValidationError> => {
  const statusStr = props.status.toUpperCase();
  if (!(Object.values(RentalStatus) as readonly string[]).includes(statusStr)) {
    return Result.fail(createValidationError(`Invalid rental status: ${props.status}`));
  }

  try {
    const reservation: IRentalReservation = {
      id: props.id ? IdVO.create(props.id) : undefined,
      productId: IdVO.create(props.productId),
      orderId: IdVO.create(props.orderId),
      startDateTime: DateTimeVO.create(props.startDateTime),
      endDateTime: DateTimeVO.create(props.endDateTime),
      quantity: NonNegativeNumberVO.create(props.quantity),
      status: statusStr as RentalStatus,
    };
    return Result.ok(reservation);
  } catch (err: unknown) {
    return Result.fail(createValidationError(getErrorMessage(err)));
  }
};
