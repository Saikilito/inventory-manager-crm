import { makeUserMongooseRepository } from '../../modules/user/infrastructure/repositories/user-mongoose.repository.js';
import { GetUserByEmail, makeGetUserByEmail } from '../../modules/user/application/use-cases/get-user.js';
import { RegisterUser, makeRegisterUser } from '../../modules/user/application/use-cases/register-user.js';
import { AuthenticateUser, makeAuthenticateUser } from '../../modules/user/application/use-cases/authenticate-user.js';
import { GetAllUsers, makeGetAllUsers } from '../../modules/user/application/use-cases/get-all-users.js';
import { UpdateUser, makeUpdateUser } from '../../modules/user/application/use-cases/update-user.js';
import { IUserRepository } from '../../modules/user/application/repositories/user.repository.js';

export interface UserSubContainer {
  getUserByEmail: GetUserByEmail;
  registerUser: RegisterUser;
  authenticateUser: AuthenticateUser;
  getAllUsers: GetAllUsers;
  updateUser: UpdateUser;
}

export const buildUserModule = (deps: { userRepository?: IUserRepository }): UserSubContainer => {
  const userRepository = deps.userRepository ?? makeUserMongooseRepository();
  return {
    getUserByEmail: makeGetUserByEmail(userRepository),
    registerUser: makeRegisterUser(userRepository),
    authenticateUser: makeAuthenticateUser(userRepository),
    getAllUsers: makeGetAllUsers(userRepository),
    updateUser: makeUpdateUser(userRepository),
  };
};
