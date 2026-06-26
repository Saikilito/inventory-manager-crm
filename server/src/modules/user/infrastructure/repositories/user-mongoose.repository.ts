import { IUserRepository } from '../../application/repositories/user.repository.js';
import { IUser, makeUser } from '../../../../../../shared-domain/src/user/user.entity.js';
import UserModel, { IUserDocument } from '../user.model.js';
import { makeMongooseBaseRepository } from '../../../shared/infrastructure/repositories/mongoose-base.repository.js';

const mapToDomain = (doc: IUserDocument): IUser => {
  const result = makeUser({
    id: doc._id.toString(),
    user: doc.user,
    email: doc.email,
    name: doc.name,
    password: doc.password,
    role: doc.role,
    disabled: doc.disabled ?? false,
  });

  if (result.isFailure) {
    throw result.getError();
  }

  return result.getValue();
};

export const makeUserMongooseRepository = (): IUserRepository => {
  return makeMongooseBaseRepository<IUser, IUserDocument>({
    model: UserModel,
    mapToDomain,
    mapToDocumentData: (user) => {
      const data: Partial<IUserDocument> = {};
      if (user.user !== undefined) data.user = user.user;
      if (user.email !== undefined) data.email = user.email;
      if (user.name !== undefined) data.name = user.name;
      if (user.password !== undefined) data.password = user.password;
      if (user.role !== undefined) {
        data.role = user.role;
      }
      if (user.disabled !== undefined) {
        data.disabled = user.disabled;
      }
      return data;
    },
  });
};
