import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, createNotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IOrder, makeOrder, OrderStatus } from '../../../../../../shared-domain/src/order/order.entity.js';
import { IProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import { IOrderRepository } from '../repositories/order.repository.js';
import { RecalculateClientRating } from '../../../client/application/use-cases/recalculate-client-rating.js';
import { IProductRepository } from '../../../product/application/repositories/product.repository.js';
import { IClientRepository } from '../../../client/application/repositories/client.repository.js';
import { IDeliveryRepository } from '../../../delivery/application/repositories/delivery.repository.js';
import { makeDelivery, DeliveryStatus } from '../../../../../../shared-domain/src/delivery/delivery.entity.js';
import { DateTimeVO } from '../../../../../../shared-domain/src/shared/value-objects/date-time.vo.js';
import { makeProduct } from '../../../../../../shared-domain/src/product/product.entity.js';

export interface CreateOrderInput {
  items: Array<{ productId: string; quantity: number }>;
  total: number;
  clientId: string;
  sellerId: string;
  contextId?: string;
  deliveryCost?: number;
  customDeliveryAddress?: string;
}

export type CreateOrder = UseCase<CreateOrderInput, IOrder, DomainError>;

export const makeCreateOrder = (
  orderRepository: IOrderRepository,
  productRepository: IProductRepository,
  recalculateClientRating: RecalculateClientRating,
  clientRepository: IClientRepository,
  deliveryRepository: IDeliveryRepository,
): CreateOrder => {
  return async (input: CreateOrderInput) => {
    const composerResult = await ResultComposer.start()
      .useResult('products', async () => {
        const productMap = new Map<string, IProduct>();
        for (const item of input.items) {
          const productResult = await productRepository.getById(IdVO.create(item.productId));
          if (productResult.isFailure) return Result.fail(productResult.getError());
          const product = productResult.getValue();
          if (!product) return Result.fail(createNotFoundError(`Product not found: ${item.productId}`));
          productMap.set(item.productId, product);
        }
        return Result.ok(productMap);
      })
      .useResult('client', async () => {
        const clientResult = await clientRepository.getById(IdVO.create(input.clientId));
        if (clientResult.isFailure) return Result.fail(clientResult.getError());
        const client = clientResult.getValue();
        if (!client) return Result.fail(createNotFoundError(`Client not found: ${input.clientId}`));
        return Result.ok(client);
      })
      .useResult('order', ({ products: prods }) => {
        const products = prods as Map<string, IProduct>;
        const enrichedItems = input.items.map((item) => {
          const prod = products.get(item.productId);
          return {
            ...item,
            purchasePriceAtSale: prod?.purchasePrice || 0,
            sellingPriceAtSale: prod?.sellingPrice || 0,
          };
        });

        return Result.ok(
          makeOrder({
            items: enrichedItems,
            total: input.total,
            clientId: input.clientId,
            status: OrderStatus.ACTIVE,
            sellerId: input.sellerId,
            contextId: input.contextId,
            deliveryCost: input.deliveryCost,
            customDeliveryAddress: input.customDeliveryAddress,
          }),
        );
      })
      .useResult('savedOrder', ({ order }) => orderRepository.create(order, IdVO.generateNil()))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const { savedOrder, client, products } = composerResult.getValue() as {
      savedOrder: IOrder;
      client: { address?: string };
      products: Map<string, IProduct>;
    };

    for (const item of savedOrder.items) {
      const product = products.get(item.productId.toString());
      if (product) {
        const quantity = item.quantity.valueOf();
        const newStock = product.stock - quantity;

        if (newStock < 0) {
          return Result.fail(new Error(`Insufficient stock for product: ${product.name}`));
        }

        const updatedProduct = makeProduct({
          id: product.id,
          name: product.name,
          purchasePrice: product.purchasePrice,
          sellingPrice: product.sellingPrice,
          stock: newStock,
        });

        const saveProdResult = await productRepository.updateById(
          IdVO.create(product.id!),
          updatedProduct,
          IdVO.generateNil(),
        );

        if (saveProdResult.isFailure) {
          return Result.fail(saveProdResult.getError());
        }
      }
    }

    if (input.deliveryCost && input.deliveryCost > 0 && savedOrder.id) {
      const deliveryAddress = input.customDeliveryAddress || client.address || 'No address provided';

      const deliveryResult = makeDelivery({
        orderId: savedOrder.id.toString(),
        scheduledDate: DateTimeVO.create(new Date()).toString(),
        deliveryTime: '',
        address: deliveryAddress,
        status: DeliveryStatus.PENDING,
        notes: 'Auto-created from order',
        deliveryCost: input.deliveryCost,
      });

      if (!deliveryResult.isFailure) {
        const delivery = deliveryResult.getValue();
        const savedDeliveryResult = await deliveryRepository.create(delivery, IdVO.generateNil());

        if (!savedDeliveryResult.isFailure && savedDeliveryResult.getValue().id) {
          const updatedOrder = makeOrder({
            id: savedOrder.id?.toString(),
            items: savedOrder.items.map((item) => ({
              productId: item.productId.toString(),
              quantity: item.quantity.valueOf(),
              purchasePriceAtSale: item.purchasePriceAtSale?.valueOf(),
              sellingPriceAtSale: item.sellingPriceAtSale?.valueOf(),
            })),
            total: savedOrder.total.valueOf(),
            clientId: savedOrder.clientId.toString(),
            status: savedOrder.status,
            paymentStatus: savedOrder.paymentStatus,
            sellerId: savedOrder.sellerId.toString(),
            contextId: savedOrder.contextId?.toString(),
            deliveryId: savedDeliveryResult.getValue().id?.toString(),
            deliveryCost: input.deliveryCost,
            customDeliveryAddress: input.customDeliveryAddress,
          });

          await orderRepository.updateById(IdVO.create(savedOrder.id!.toString()), updatedOrder, IdVO.generateNil());
        }
      }
    }

    const recalcResult = await recalculateClientRating(input.clientId);
    if (recalcResult.isFailure) {
      return Result.fail(recalcResult.getError());
    }

    return Result.ok(savedOrder);
  };
};
