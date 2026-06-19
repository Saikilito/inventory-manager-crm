import { IContext } from '../../../config/apollo.js';
import { IClient } from '../../../../../shared-domain/src/client/client.entity.js';

interface EmailInput {
  email: string;
}

interface SetClientInput {
  firstName: string;
  lastName: string;
  company: string;
  emails: EmailInput[];
  age: number;
  type: string;
  sellerId: string;
}

interface UpdateClientInput {
  _id: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  emails?: EmailInput[];
  age?: number;
  type?: string;
  sellerId?: string;
}

const mapToGql = (client: IClient) => {
  return {
    _id: client.id,
    firstName: client.firstName,
    lastName: client.lastName,
    company: client.company,
    emails: (client.emails || []).map((emailStr) => ({ email: emailStr })),
    age: client.age,
    type: client.type,
    sellerId: client.sellerId,
  };
};

export default {
  Query: {
    getAllClients: async (
      _parent: unknown,
      { limit, offset, sellerId }: { limit?: number; offset?: number; sellerId?: string },
      { container }: IContext,
    ) => {
      const result = await container.client.getAllClients({ limit, offset, sellerId });
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue().map(mapToGql);
    },

    getClient: async (_parent: unknown, { _id }: { _id: string }, { container }: IContext) => {
      const result = await container.client.getClient(_id);
      if (result.isFailure) {
        throw result.getError();
      }
      return mapToGql(result.getValue());
    },

    totalClients: async (_parent: unknown, { sellerId }: { sellerId?: string }, { container }: IContext) => {
      const result = await container.client.totalClients({ sellerId });
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue();
    },
  },

  Mutation: {
    setClient: async (_parent: unknown, { input }: { input: SetClientInput }, { container }: IContext) => {
      const result = await container.client.createClient({
        firstName: input.firstName,
        lastName: input.lastName,
        company: input.company,
        emails: (input.emails || []).map((e) => e.email),
        age: input.age,
        type: input.type,
        sellerId: input.sellerId,
      });
      return !result.isFailure;
    },

    updateClient: async (_parent: unknown, { input }: { input: UpdateClientInput }, { container }: IContext) => {
      const result = await container.client.updateClient({
        id: input._id,
        firstName: input.firstName,
        lastName: input.lastName,
        company: input.company,
        emails: input.emails ? input.emails.map((e) => e.email) : undefined,
        age: input.age,
        type: input.type,
        sellerId: input.sellerId,
      });
      return !result.isFailure;
    },

    deleteClient: async (_parent: unknown, { _id }: { _id: string }, { container }: IContext) => {
      const result = await container.client.deleteClient(_id);
      return !result.isFailure;
    },
  },
};
