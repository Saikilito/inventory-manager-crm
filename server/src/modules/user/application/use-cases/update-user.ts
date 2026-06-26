import {
  makeUser,
  IUser,
} from "../../../../../../shared-domain/src/user/user.entity.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { ResultComposer } from "../../../../../../shared-domain/src/shared/result-composer.js";
import { IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { NonEmptyStringVO } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { UserRole } from "../../../../../../shared-domain/src/shared/value-objects/role.vo.js";
import { IUserRepository } from "../repositories/user.repository.js";

export interface UpdateUserInput {
  name?: string;
  user?: string;
  email?: string;
  role?: string;
  disabled?: boolean;
}

export type UpdateUser = (
  actorId: string,
  targetId: string,
  input: UpdateUserInput,
) => Promise<Result<void, Error>>;

export const makeUpdateUser = (userRepository: IUserRepository): UpdateUser => {
  return async (actorId: string, targetId: string, input: UpdateUserInput) => {
    // 1. Validate ID formats
    const actorIdResult = IdVO.createResult(actorId);
    if (actorIdResult.isFailure) {
      return Result.fail(actorIdResult.getError());
    }

    const targetIdResult = IdVO.createResult(targetId);
    if (targetIdResult.isFailure) {
      return Result.fail(targetIdResult.getError());
    }

    const targetUserRes = await userRepository.getById(
      targetIdResult.getValue(),
    );
    if (targetUserRes.isFailure) {
      return Result.fail(new Error(targetUserRes.getError().message));
    }

    const targetUser = targetUserRes.getValue();
    if (!targetUser) {
      return Result.fail(new Error("User not found"));
    }

    if (actorId === targetId) {
      if (input.disabled === true) {
        return Result.fail(new Error("SELF_LOCKOUT_PREVENTED"));
      }
      if (input.role) {
        const targetUserRoleStr = String(targetUser.role);
        const inputRoleStr = String(input.role).toUpperCase().trim();
        if (
          targetUserRoleStr === UserRole.ADMIN &&
          inputRoleStr !== UserRole.ADMIN
        ) {
          return Result.fail(new Error("SELF_DEMOTION_PREVENTED"));
        }
      }
    }

    const composerResult = await ResultComposer.start()
      .useResult("existingEmail", async () => {
        if (
          input.email === undefined ||
          input.email === String(targetUser.email)
        ) {
          return Result.ok<IUser | null, any>(null);
        }
        return userRepository.getOne([
          {
            field: NonEmptyStringVO.create("email"),
            value: input.email,
            operator: "=",
          },
        ]);
      })
      .useResult("existingUser", async () => {
        if (
          input.user === undefined ||
          input.user === String(targetUser.user)
        ) {
          return Result.ok<IUser | null, any>(null);
        }
        return userRepository.getOne([
          {
            field: NonEmptyStringVO.create("user"),
            value: input.user,
            operator: "=",
          },
        ]);
      })
      .useResult("validateUnique", ({ existingEmail, existingUser }) => {
        if (existingEmail !== null && String(existingEmail.id) !== targetId) {
          return Result.fail(new Error("Email is already registered"));
        }
        if (existingUser !== null && String(existingUser.id) !== targetId) {
          return Result.fail(new Error("Username is already registered"));
        }
        return Result.ok();
      })
      .useResult("mergedUser", () => {
        return makeUser({
          id: targetId,
          user: input.user !== undefined ? input.user : String(targetUser.user),
          email:
            input.email !== undefined ? input.email : String(targetUser.email),
          name: input.name !== undefined ? input.name : String(targetUser.name),
          role: input.role !== undefined ? input.role : String(targetUser.role),
          disabled:
            input.disabled !== undefined ? input.disabled : targetUser.disabled,
          password: targetUser.password,
        });
      })
      .useResult("update", ({ mergedUser }) => {
        const updateData: Partial<IUser> = {};
        if (input.user !== undefined) updateData.user = mergedUser.user;
        if (input.email !== undefined) updateData.email = mergedUser.email;
        if (input.name !== undefined) updateData.name = mergedUser.name;
        if (input.role !== undefined) updateData.role = mergedUser.role;
        if (input.disabled !== undefined)
          updateData.disabled = mergedUser.disabled;

        return userRepository.updateById(
          targetIdResult.getValue(),
          updateData,
          actorIdResult.getValue(),
        );
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok<void, Error>();
  };
};
