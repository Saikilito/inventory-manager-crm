import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { PositiveNumber, PositiveNumberVO } from '../shared/value-objects/positive-number.vo.js';
import { DateTime, DateTimeVO } from '../shared/value-objects/date-time.vo.js';
import { DateOnly, DateOnlyVO } from '../shared/value-objects/date-only.vo.js';

export interface IExchangeRate {
  id?: Id;
  date: DateOnly;
  rate: PositiveNumber;
  createdAt: DateTime;
}

export const makeExchangeRate = (props: {
  id?: string;
  date: string | Date;
  rate: number;
  createdAt?: string;
}): IExchangeRate => {
  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    date: DateOnlyVO.create(props.date),
    rate: PositiveNumberVO.create(props.rate),
    createdAt: DateTimeVO.create(props.createdAt),
  };
};
