import { BaseRepository } from '../../../../../../shared-domain/src/shared/repository.js';
import { IUser } from '../../../../../../shared-domain/src/user/user.entity.js';

export interface IUserRepository extends BaseRepository<IUser> {}
