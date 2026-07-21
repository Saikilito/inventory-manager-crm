import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { NonEmptyStringVO } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { EmailVO } from "../../../../../../shared-domain/src/shared/value-objects/email.vo.js";
import { UsernameVO } from "../../../../../../shared-domain/src/shared/value-objects/username.vo.js";
import { IUserRepository } from "../repositories/user.repository.js";

export interface AuthenticateUserInput {
  email: string;
  password?: string;
}

export interface AuthenticationResult {
  token: string;
}

export type AuthenticateUser = (
  input: AuthenticateUserInput,
) => Promise<Result<AuthenticationResult, Error>>;

const resolveJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length === 0 || secret === "JWT_SECRET_DEFAULT") {
    throw new Error(
      "JWT_SECRET environment variable is missing or set to the insecure default. Refusing to sign tokens.",
    );
  }
  return secret;
};

const __secret = resolveJwtSecret();

const createToken = (
  email: string,
  secret: string,
  expiresIn: SignOptions["expiresIn"],
) => {
  return jwt.sign({ email }, secret, { expiresIn });
};

export const makeAuthenticateUser = (
  userRepository: IUserRepository,
): AuthenticateUser => {
  return async (input: AuthenticateUserInput) => {
    if (!input.password) {
      return Result.fail<AuthenticationResult, Error>(
        new Error("Incorrect password"),
      );
    }

    let queryValue: string;
    if (input.email.includes('@')) {
      const emailResult = EmailVO.createResult(input.email);
      if (emailResult.isFailure) {
        return Result.fail<AuthenticationResult, Error>(
          emailResult.getError()
        );
      }
      queryValue = emailResult.getValue();
    } else {
      const usernameResult = UsernameVO.createResult(input.email);
      if (usernameResult.isFailure) {
        return Result.fail<AuthenticationResult, Error>(
          usernameResult.getError()
        );
      }
      queryValue = usernameResult.getValue();
    }

    const queryField = input.email.includes('@') ? 'email' : 'user';

    const existingResult = await userRepository.getOne([
      { field: NonEmptyStringVO.create(queryField), value: queryValue, operator: "=" },
    ]);
    if (existingResult.isFailure) {
      return Result.fail<AuthenticationResult, Error>(
        new Error(existingResult.getError().message),
      );
    }

    const user = existingResult.getValue();
    if (!user) {
      return Result.fail<AuthenticationResult, Error>(
        new Error("User not found"),
      );
    }

    if (user.disabled === true) {
      return Result.fail<AuthenticationResult, Error>(
        new Error("ACCOUNT_DISABLED"),
      );
    }

    const isRightPassword = await bcrypt.compare(
      input.password,
      user.password || "",
    );
    if (!isRightPassword) {
      return Result.fail<AuthenticationResult, Error>(
        new Error("Incorrect password"),
      );
    }

    const token = createToken(user.email, __secret, "1h");
    return Result.ok<AuthenticationResult, Error>({ token });
  };
};
