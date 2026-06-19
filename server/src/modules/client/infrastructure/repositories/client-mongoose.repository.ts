import { IClientRepository } from '../../application/repositories/client.repository.js';
import { IClient, makeClient } from '../../../../../../shared-domain/src/client/client.entity.js';
import ClientModel, { IClientDocument } from '../client.model.js';
import { makeMongooseBaseRepository } from '../../../shared/infrastructure/repositories/mongoose-base.repository.js';

const mapToDomain = (doc: IClientDocument): IClient => {
  return makeClient({
    id: doc._id.toString(),
    firstName: doc.firstName,
    lastName: doc.lastName,
    company: doc.company,
    emails: doc.emails,
    age: doc.age,
    type: doc.type,
    orders: doc.orders,
    sellerId: doc.sellerId.toString(),
  });
};

export const makeClientMongooseRepository = (): IClientRepository => {
  return makeMongooseBaseRepository<IClient, IClientDocument>({
    model: ClientModel,
    mapToDomain,
    mapToDocumentData: (client) => {
      const data: any = {};
      if (client.firstName !== undefined) data.firstName = client.firstName;
      if (client.lastName !== undefined) data.lastName = client.lastName;
      if (client.company !== undefined) data.company = client.company;
      if (client.emails !== undefined) data.emails = client.emails;
      if (client.age !== undefined) data.age = client.age;
      if (client.type !== undefined) data.type = client.type;
      if (client.orders !== undefined) data.orders = client.orders;
      if (client.sellerId !== undefined) data.sellerId = client.sellerId;
      return data;
    },
  });
};
