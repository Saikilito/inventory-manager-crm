import { IContext } from '../../../config/apollo.js';

export default {
  Query: {
    topClients: async (_parent: unknown, _args: unknown, { container }: IContext) => {
      const result = await container.dashboard.getTopClients();
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue();
    },

    topSellers: async (_parent: unknown, _args: unknown, { container }: IContext) => {
      const result = await container.dashboard.getTopSellers();
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue();
    },
  },
};
