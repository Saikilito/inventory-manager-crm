import { BaseRepository } from "../../../../../../shared-domain/src/shared/repository.js";
import { Id, IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { NonEmptyString, NonEmptyStringVO } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { PositiveNumber, PositiveNumberVO } from "../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js";
import { DateTime, DateTimeVO } from "../../../../../../shared-domain/src/shared/value-objects/date-time.vo.js";

export interface IUnsatisfiedDemand {
  id?: Id;
  productId: Id;
  clientPhone: NonEmptyString;
  productName: NonEmptyString;
  quantity: PositiveNumber;
  requestedAt: DateTime;
}

export const makeUnsatisfiedDemand = (props: {
  id?: string;
  productId: string;
  clientPhone: string;
  productName: string;
  quantity: number;
  requestedAt: string | Date;
}): IUnsatisfiedDemand => {
  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    productId: IdVO.create(props.productId),
    clientPhone: NonEmptyStringVO.create(props.clientPhone),
    productName: NonEmptyStringVO.create(props.productName),
    quantity: PositiveNumberVO.create(props.quantity),
    requestedAt: DateTimeVO.create(props.requestedAt),
  };
};

export interface IUnsatisfiedDemandRepository
  extends BaseRepository<IUnsatisfiedDemand> {}

export default IUnsatisfiedDemandRepository;
