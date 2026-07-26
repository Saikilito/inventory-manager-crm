import { makeClientMongooseRepository } from '../../modules/client/infrastructure/repositories/client-mongoose.repository.js';
import { GetClient, makeGetClient } from '../../modules/client/application/use-cases/get-client.js';
import { GetAllClients, makeGetAllClients } from '../../modules/client/application/use-cases/get-all-clients.js';
import { TotalClients, makeTotalClients } from '../../modules/client/application/use-cases/total-clients.js';
import { CreateClient, makeCreateClient } from '../../modules/client/application/use-cases/create-client.js';
import { UpdateClient, makeUpdateClient } from '../../modules/client/application/use-cases/update-client.js';
import { DeleteClient, makeDeleteClient } from '../../modules/client/application/use-cases/delete-client.js';
import { RecalculateClientRating, makeRecalculateClientRating } from '../../modules/client/application/use-cases/recalculate-client-rating.js';
import { IClientRepository } from '../../modules/client/application/repositories/client.repository.js';
import { IOrderRepository } from '../../modules/order/application/repositories/order.repository.js';

export interface ClientSubContainer {
  getClient: GetClient;
  getAllClients: GetAllClients;
  totalClients: TotalClients;
  createClient: CreateClient;
  updateClient: UpdateClient;
  deleteClient: DeleteClient;
  recalculateClientRating: RecalculateClientRating;
}

export const buildClientModule = (deps: {
  clientRepository?: IClientRepository;
  orderRepository: IOrderRepository;
  recalculateClientRating?: RecalculateClientRating;
}): ClientSubContainer => {
  const clientRepository = deps.clientRepository ?? makeClientMongooseRepository();
  const recalculateClientRating =
    deps.recalculateClientRating ?? makeRecalculateClientRating(clientRepository, deps.orderRepository);
  return {
    getClient: makeGetClient(clientRepository),
    getAllClients: makeGetAllClients(clientRepository),
    totalClients: makeTotalClients(clientRepository),
    createClient: makeCreateClient(clientRepository),
    updateClient: makeUpdateClient(clientRepository),
    deleteClient: makeDeleteClient(clientRepository),
    recalculateClientRating,
  };
};
