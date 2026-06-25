import { makePloc, Ploc } from "@modules/shared/presentation/ploc/ploc";
import { authInitialState, AuthState, AuthStateKind } from "./auth-state";
import { LoginUseCase } from "@modules/auth/application/use-cases/login";
import { RegisterUseCase } from "@modules/auth/application/use-cases/register";
import { GetCurrentUserUseCase } from "@modules/auth/application/use-cases/get-current-user";
import { LogoutUseCase } from "@modules/auth/application/use-cases/logout";
import { GetUsersUseCase } from "@modules/auth/application/use-cases/get-users";
import { UpdateUserUseCase } from "@modules/auth/application/use-cases/update-user";
import { IUser, makeUser } from "@shared-domain/user/user.entity";

export interface AuthPloc extends Ploc<AuthState> {
  checkSession(): Promise<void>;
  login(email: string, password: string): Promise<void>;
  register(
    name: string,
    username: string,
    email: string,
    password: string,
    role: string,
  ): Promise<void>;
  logout(): Promise<void>;
  getUsers(): Promise<void>;
  updateUser(targetId: string, data: Partial<IUser>): Promise<void>;
}

export function makeAuthPloc(
  loginUseCase: LoginUseCase,
  registerUseCase: RegisterUseCase,
  getCurrentUserUseCase: GetCurrentUserUseCase,
  logoutUseCase: LogoutUseCase,
  getUsersUseCase: GetUsersUseCase,
  updateUserUseCase: UpdateUserUseCase,
): AuthPloc {
  const ploc = makePloc<AuthState>(authInitialState);

  const checkSession = async () => {
    ploc.changeState({ kind: AuthStateKind.AUTHENTICATING });
    const result = await getCurrentUserUseCase.execute();

    if (result.isFailure) {
      ploc.changeState({ kind: AuthStateKind.UNAUTHENTICATED });
      return void 0;
    }

    const user = result.getValue();
    if (user) {
      ploc.changeState({ kind: AuthStateKind.AUTHENTICATED, user });
    } else {
      ploc.changeState({ kind: AuthStateKind.UNAUTHENTICATED });
    }
  };

  const login = async (email: string, password: string) => {
    ploc.changeState({ kind: AuthStateKind.AUTHENTICATING });
    const result = await loginUseCase.execute(email, password);

    if (result.isFailure) {
      const error = result.getError();
      ploc.changeState({
        kind: AuthStateKind.ERROR,
        errorMessage: error.message || "Authentication error",
      });
    } else {
      await checkSession();
    }
  };

  const register = async (
    name: string,
    username: string,
    email: string,
    password: string,
    role: string,
  ) => {
    ploc.changeState({ kind: AuthStateKind.REGISTERING });

    try {
      const userDomainModelResult = makeUser({
        name,
        user: username,
        email,
        password,
        role,
      });

      if (userDomainModelResult.isFailure) {
        ploc.changeState({
          kind: AuthStateKind.ERROR,
          errorMessage:
            userDomainModelResult.getError().message ||
            "Domain Validation Error",
        });
        return void 0;
      }

      const userDomainModel = userDomainModelResult.getValue();
      const result = await registerUseCase.execute(userDomainModel);

      if (result.isFailure) {
        ploc.changeState({
          kind: AuthStateKind.ERROR,
          errorMessage: result.getError().message || "Registration error",
        });
      } else {
        // Registration success redirects or clears state
        ploc.changeState({ kind: AuthStateKind.UNAUTHENTICATED });
      }
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : "Unknown validation error";
      ploc.changeState({
        kind: AuthStateKind.ERROR,
        errorMessage,
      });
    }
  };

  const logout = async () => {
    ploc.changeState({ kind: AuthStateKind.AUTHENTICATING });
    await logoutUseCase.execute();
    ploc.changeState({ kind: AuthStateKind.UNAUTHENTICATED });
  };

  const getUsers = async () => {
    const currentState = ploc.state();
    if (currentState.kind !== AuthStateKind.AUTHENTICATED) {
      return;
    }

    ploc.changeState({
      ...currentState,
      usersLoading: true,
    });

    const result = await getUsersUseCase.execute();

    if (result.isFailure) {
      ploc.changeState({
        ...currentState,
        usersLoading: false,
        errorMessage: result.getError().message || "Failed to fetch users",
      });
    } else {
      ploc.changeState({
        ...currentState,
        users: result.getValue(),
        usersLoading: false,
      });
    }
  };

  const updateUser = async (targetId: string, data: Partial<IUser>) => {
    const currentState = ploc.state();
    if (currentState.kind !== AuthStateKind.AUTHENTICATED) {
      return;
    }

    const originalUsers = currentState.users || [];

    // Optimistically update the user list in the state
    const optimisticallyUpdatedUsers = originalUsers.map((user) => {
      if (String(user.id) === targetId) {
        return {
          ...user,
          ...data,
        };
      }
      return user;
    });

    ploc.changeState({
      ...currentState,
      users: optimisticallyUpdatedUsers,
    });

    const result = await updateUserUseCase.execute(targetId, data);

    if (result.isFailure) {
      ploc.changeState({
        ...currentState,
        users: originalUsers,
        errorMessage: result.getError().message || "Failed to update user",
      });
    } else {
      await getUsers();
    }
  };

  return {
    ...ploc,
    checkSession,
    login,
    register,
    logout,
    getUsers,
    updateUser,
  };
}
