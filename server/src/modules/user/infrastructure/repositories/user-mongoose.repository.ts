import { IUserRepository } from '../../application/repositories/user.repository.js';
import { IUser, makeUser } from '../../../../../../shared-domain/src/user/user.entity.js';
import UserModel, { IUserDocument } from '../user.model.js';
import { makeMongooseBaseRepository } from '../../../shared/infrastructure/repositories/mongoose-base.repository.js';

const mapToDomain = (doc: IUserDocument): IUser => {
  return makeUser({
    id: doc._id.toString(),
    email: doc.email,
    name: doc.name,
    password: doc.password,
    role: doc.role,
  });
};

export const makeUserMongooseRepository = (): IUserRepository => {
  return makeMongooseBaseRepository<IUser, IUserDocument>({
    model: UserModel,
    mapToDomain,
    mapToDocumentData: (user) => {
      const data: any = {};
      if (user.email !== undefined) data.email = user.email;
      if (user.name !== undefined) data.name = user.name;
      if (user.password !== undefined) data.password = user.password;
      if (user.role !== undefined) data.role = user.role;
      return data;
    },
  });
};
