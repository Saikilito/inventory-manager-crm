import { CalculateDeliveryFee } from '../../application/use-cases/calculate-delivery-fee.use-case.js';
import { CreateClient } from '../../../client/application/use-cases/create-client.js';
import { CreateOrder } from '../../../order/application/use-cases/create-order.js';
import { LogUnsatisfiedDemand } from '../../application/use-cases/log-unsatisfied-demand.use-case.js';
import { IProductRepository } from '../../../product/application/repositories/product.repository.js';
import { IClientRepository } from '../../../client/application/repositories/client.repository.js';

export interface ToolDispatcherDependencies {
  calculateDeliveryFee: CalculateDeliveryFee;
  createClient: CreateClient;
  createOrder: CreateOrder;
  logUnsatisfiedDemand: LogUnsatisfiedDemand;
  getDefaultSellerId: (whatsappId: string) => Promise<string>;
  productRepository: IProductRepository;
  clientRepository: IClientRepository;
}
