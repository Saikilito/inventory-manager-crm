import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { NonEmptyStringVO } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
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

const __secret = process.env.JWT_SECRET || "JWT_SECRET_DEFAULT";

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

    const existingResult = await userRepository.getOne([
      { field: NonEmptyStringVO.create("email"), value: input.email, operator: "=" },
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
