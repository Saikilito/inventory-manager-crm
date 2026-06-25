import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { Username, UsernameVO } from '../shared/value-objects/username.vo.js';
import { Email, EmailVO } from '../shared/value-objects/email.vo.js';
import { Role, RoleVO } from '../shared/value-objects/role.vo.js';
import { ValidationError } from '../shared/validation-error.js';
import { Result } from '../shared/result.js';

export interface IUser {
  id?: Id;
  user: Username;
  email: Email;
  name: NonEmptyString;
  password?: string;
  role: Role;
  disabled?: boolean;
}

export const makeUser = (props: {
  id?: string;
  user: string;
  email: string;
  name: string;
  password?: string;
  role: string;
  disabled?: boolean;
}): Result<IUser, ValidationError> => {
  const idResult = props.id ? IdVO.createResult(props.id) : undefined;
  if (idResult && idResult.isFailure) {
    return Result.fail(idResult.getError());
  }

  const userResult = UsernameVO.createResult(props.user);
  if (userResult.isFailure) {
    return Result.fail(userResult.getError());
  }

  const emailResult = EmailVO.createResult(props.email);
  if (emailResult.isFailure) {
    return Result.fail(emailResult.getError());
  }

  const nameResult = NonEmptyStringVO.createResult(props.name);
  if (nameResult.isFailure) {
    return Result.fail(nameResult.getError());
  }

  const roleResult = RoleVO.createResult(props.role);
  if (roleResult.isFailure) {
    return Result.fail(roleResult.getError());
  }

  return Result.ok({
    id: idResult ? idResult.getValue() : undefined,
    user: userResult.getValue(),
    email: emailResult.getValue(),
    name: nameResult.getValue(),
    password: props.password,
    role: roleResult.getValue(),
    disabled: props.disabled ?? false,
  });
};
