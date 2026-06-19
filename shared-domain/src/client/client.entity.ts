import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { Email, EmailVO } from '../shared/value-objects/email.vo.js';
import { PositiveNumber, PositiveNumberVO } from '../shared/value-objects/positive-number.vo.js';

export interface IClient {
  id?: Id;
  firstName: NonEmptyString;
  lastName: NonEmptyString;
  company: NonEmptyString;
  emails: Email[];
  age?: PositiveNumber;
  type: NonEmptyString;
  orders: Id[];
  sellerId: Id;
}

export const makeClient = (props: {
  id?: string;
  firstName: string;
  lastName: string;
  company: string;
  emails: string[];
  age?: number;
  type: string;
  orders: string[];
  sellerId: string;
}): IClient => {
  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    firstName: NonEmptyStringVO.create(props.firstName),
    lastName: NonEmptyStringVO.create(props.lastName),
    company: NonEmptyStringVO.create(props.company),
    emails: (props.emails || []).map(EmailVO.create),
    age: props.age ? PositiveNumberVO.create(props.age) : undefined,
    type: NonEmptyStringVO.create(props.type),
    orders: (props.orders || []).map(IdVO.create),
    sellerId: IdVO.create(props.sellerId),
  };
};
