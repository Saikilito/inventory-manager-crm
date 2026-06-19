import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { NonNegativeNumber, NonNegativeNumberVO } from '../shared/value-objects/non-negative-number.vo.js';
import { PositiveNumber, PositiveNumberVO } from '../shared/value-objects/positive-number.vo.js';

export interface IProduct {
  id?: Id;
  name: NonEmptyString;
  price: PositiveNumber;
  stock: NonNegativeNumber;
}

export const makeProduct = (props: {
  id?: string;
  name: string;
  price: number;
  stock: number;
}): IProduct => {
  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    name: NonEmptyStringVO.create(props.name),
    price: PositiveNumberVO.create(props.price),
    stock: NonNegativeNumberVO.create(props.stock),
  };
};
