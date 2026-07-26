import { makeOrderMongooseRepository } from '../../modules/order/infrastructure/repositories/order-mongoose.repository.js';
import { GetOrder, makeGetOrder } from '../../modules/order/application/use-cases/get-order.js';
import { GetOrderClient, makeGetOrderClient } from '../../modules/order/application/use-cases/get-order-client.js';
import { GetAllOrders, makeGetAllOrders } from '../../modules/order/application/use-cases/get-all-orders.js';
import { TotalOrders, makeTotalOrders } from '../../modules/order/application/use-cases/total-orders.js';
import { CreateOrder, makeCreateOrder } from '../../modules/order/application/use-cases/create-order.js';
import { UpdateOrder, makeUpdateOrder } from '../../modules/order/application/use-cases/update-order.js';
import { DeleteOrder, makeDeleteOrder } from '../../modules/order/application/use-cases/delete-order.js';
import { IOrderRepository } from '../../modules/order/application/repositories/order.repository.js';
import { IProductRepository } from '../../modules/product/application/repositories/product.repository.js';
import { RecalculateClientRating } from '../../modules/client/application/use-cases/recalculate-client-rating.js';
import { IClientRepository } from '../../modules/client/application/repositories/client.repository.js';
import { IDeliveryRepository } from '../../modules/delivery/application/repositories/delivery.repository.js';
import { RecordOrderPaymentUseCase } from '../../modules/financial/application/use-cases/record-order-payment.js';
import { ReverseOrderPaymentUseCase } from '../../modules/financial/application/use-cases/reverse-order-payment.js';

export interface OrderSubContainer {
  getOrder: GetOrder;
  getOrderClient: GetOrderClient;
  getAllOrders: GetAllOrders;
  totalOrders: TotalOrders;
  createOrder: CreateOrder;
  updateOrder: UpdateOrder;
  deleteOrder: DeleteOrder;
}

export const buildOrderModule = (deps: {
  orderRepository?: IOrderRepository;
  productRepository: IProductRepository;
  recalculateClientRating: RecalculateClientRating;
  clientRepository: IClientRepository;
  deliveryRepository: IDeliveryRepository;
  recordOrderPayment?: RecordOrderPaymentUseCase;
  reverseOrderPayment?: ReverseOrderPaymentUseCase;
}): OrderSubContainer => {
  const orderRepository = deps.orderRepository ?? makeOrderMongooseRepository();
  return {
    getOrder: makeGetOrder(orderRepository),
    getOrderClient: makeGetOrderClient(orderRepository),
    getAllOrders: makeGetAllOrders(orderRepository),
    totalOrders: makeTotalOrders(orderRepository),
    createOrder: makeCreateOrder(orderRepository, deps.productRepository, deps.recalculateClientRating, deps.clientRepository, deps.deliveryRepository),
    updateOrder: makeUpdateOrder(orderRepository, deps.productRepository, deps.recalculateClientRating, deps.deliveryRepository, deps.recordOrderPayment, deps.reverseOrderPayment),
    deleteOrder: makeDeleteOrder(orderRepository, deps.recalculateClientRating, deps.deliveryRepository),
  };
};
