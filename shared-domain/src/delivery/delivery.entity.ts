import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { NonNegativeNumber, NonNegativeNumberVO } from '../shared/value-objects/non-negative-number.vo.js';
import { DateTime, DateTimeVO } from '../shared/value-objects/date-time.vo.js';
import { Result } from '../shared/result.js';
import { ValidationError, createValidationError } from '../shared/validation-error.js';
import { getErrorMessage } from '../shared/error-utils.js';
import { DeliveryStatusVO } from '../shared/value-objects/delivery-status.vo.js';
import { DeliveryStatus } from './delivery-status.js';

export { DeliveryStatus } from './delivery-status.js';
export { DeliveryMethod, DELIVERY_METHODS } from './delivery-method.js';
export { DeliveryMethodVO, type DeliveryMethodType } from '../shared/value-objects/delivery-method.vo.js';

export interface IDelivery {
  id?: Id;
  orderId: Id;
  scheduledDate: DateTime;
  deliveryTime: string;
  address: NonEmptyString;
  status: DeliveryStatus;
  notes: string;
  deliveryCost?: NonNegativeNumber;
}

export const makeDelivery = (props: {
  id?: string;
  orderId: string;
  scheduledDate: string | Date | number;
  deliveryTime?: string;
  address: string;
  status: string;
  notes?: string;
  deliveryCost?: number;
}): Result<IDelivery, ValidationError> => {
  const statusResult = DeliveryStatusVO.createResult(props.status);
  if (statusResult.isFailure) {
    return Result.fail(statusResult.getError());
  }

  try {
    const delivery: IDelivery = {
      id: props.id ? IdVO.create(props.id) : undefined,
      orderId: IdVO.create(props.orderId),
      scheduledDate: DateTimeVO.create(props.scheduledDate),
      deliveryTime: props.deliveryTime || '',
      address: NonEmptyStringVO.create(props.address),
      status: statusResult.getValue() as DeliveryStatus,
      notes: props.notes || '',
      deliveryCost: props.deliveryCost !== undefined && props.deliveryCost > 0 
        ? NonNegativeNumberVO.create(props.deliveryCost) 
        : undefined,
    };
    return Result.ok(delivery);
  } catch (err: unknown) {
    return Result.fail(createValidationError(getErrorMessage(err)));
  }
};
