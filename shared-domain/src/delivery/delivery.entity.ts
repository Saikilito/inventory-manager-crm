import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { DateTime, DateTimeVO } from '../shared/value-objects/date-time.vo.js';
import { Result } from '../shared/result.js';
import { ValidationError } from '../shared/validation-error.js';
import { getErrorMessage } from '../shared/error-utils.js';

export const DeliveryStatus = {
  PENDING: 'PENDING',
  DISPATCHED: 'DISPATCHED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export type DeliveryStatus = typeof DeliveryStatus[keyof typeof DeliveryStatus];

export interface IDelivery {
  id?: Id;
  orderId: Id;
  scheduledDate: DateTime;
  deliveryTime: string;
  address: NonEmptyString;
  status: DeliveryStatus;
  notes: string;
}

export const makeDelivery = (props: {
  id?: string;
  orderId: string;
  scheduledDate: string | Date | number;
  deliveryTime: string;
  address: string;
  status: string;
  notes?: string;
}): Result<IDelivery, ValidationError> => {
  // Validate status
  const statusStr = props.status.toUpperCase();
  if (!(Object.values(DeliveryStatus) as readonly string[]).includes(statusStr)) {
    return Result.fail(new ValidationError(`Invalid delivery status: ${props.status}`));
  }

  try {
    const delivery: IDelivery = {
      id: props.id ? IdVO.create(props.id) : undefined,
      orderId: IdVO.create(props.orderId),
      scheduledDate: DateTimeVO.create(props.scheduledDate),
      deliveryTime: props.deliveryTime,
      address: NonEmptyStringVO.create(props.address),
      status: statusStr as DeliveryStatus,
      notes: props.notes || '',
    };
    return Result.ok(delivery);
  } catch (err: unknown) {
    return Result.fail(new ValidationError(getErrorMessage(err)));
  }
};
