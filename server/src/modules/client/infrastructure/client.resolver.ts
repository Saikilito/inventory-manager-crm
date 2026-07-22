import { IContext } from '../../../config/apollo.js';
import { IClient } from '../../../../../shared-domain/src/client/client.entity.js';
import OrderModel from '../../order/infrastructure/order.model.js';
import mongoose from 'mongoose';

interface SetClientInput {
  firstName: string;
  lastName: string;
  address: string;
  whatsapp: string;
  nationalId?: string;
  sellerId: string;
}

interface UpdateClientInput {
  _id: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  whatsapp?: string;
  nationalId?: string;
  sellerId?: string;
}

const mapToGql = async (client: IClient) => {
  const orders = await OrderModel.find({ 
    clientId: new mongoose.Types.ObjectId(client.id) 
  }).select('_id').lean();
  
  return {
    id: client.id,
    _id: client.id,
    firstName: client.firstName,
    lastName: client.lastName,
    address: client.address,
    whatsapp: client.whatsapp,
    nationalId: client.nationalId,
    type: client.type,
    sellerId: client.sellerId,
    orders: orders.map(o => o._id.toString()),
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
      const clients = result.getValue();
      return Promise.all(clients.map(mapToGql));
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
        address: input.address,
        whatsapp: input.whatsapp,
        nationalId: input.nationalId || "",
        sellerId: input.sellerId,
      });
      return !result.isFailure;
    },

    updateClient: async (_parent: unknown, { input }: { input: UpdateClientInput }, { container }: IContext) => {
      const result = await container.client.updateClient({
        id: input._id,
        firstName: input.firstName,
        lastName: input.lastName,
        address: input.address,
        whatsapp: input.whatsapp,
        nationalId: input.nationalId,
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
