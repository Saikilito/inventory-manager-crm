import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { Email, EmailVO } from '../shared/value-objects/email.vo.js';

export interface IUser {
  id?: Id;
  email: Email;
  name: NonEmptyString;
  password?: string;
  role: NonEmptyString;
}

export const makeUser = (props: {
  id?: string;
  email: string;
  name: string;
  password?: string;
  role: string;
}): IUser => {
  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    email: EmailVO.create(props.email),
    name: NonEmptyStringVO.create(props.name),
    password: props.password,
    role: NonEmptyStringVO.create(props.role),
  };
};
