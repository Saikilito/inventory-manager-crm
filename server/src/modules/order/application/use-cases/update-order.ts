import { DomainError, createNotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { NonNegativeNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/non-negative-number.vo.js';
import {
  IOrder,
  IOrderItem,
  makeOrder,
  OrderStatus,
  PaymentStatus,
  DeliveryStatus,
  ORDER_DEFAULT_PRICE_FALLBACK,
} from '../../../../../../shared-domain/src/order/order.entity.js';
import { IOrderRepository } from '../repositories/order.repository.js';
import { IProductRepository } from '../../../product/application/repositories/product.repository.js';
import { makeProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import { RecalculateClientRating } from '../../../client/application/use-cases/recalculate-client-rating.js';
import { StockOperation } from './update-order.constants.js';
import { IDeliveryRepository } from '../../../delivery/application/repositories/delivery.repository.js';
import { DeliveryStatus as SharedDeliveryStatus } from '../../../../../../shared-domain/src/delivery/delivery.entity.js';
import { RecordOrderPaymentUseCase } from '../../../financial/application/use-cases/record-order-payment.js';
import { ReverseOrderPaymentUseCase } from '../../../financial/application/use-cases/reverse-order-payment.js';

export interface UpdateOrderInput {
  id: string;
  items?: Array<{ productId: string; quantity: number }>;
  total?: number;
  clientId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  deliveryStatus?: DeliveryStatus;
  sellerId?: string;
  contextId?: string;
  deliveryCost?: number;
  payments?: Array<{ accountId: string; amount: number; exchangeRate: number }>;
  cancellationObservation?: string;
}

export type UpdateOrder = UseCase<UpdateOrderInput, void, DomainError>;

export const makeUpdateOrder = (
  orderRepository: IOrderRepository,
  productRepository: IProductRepository,
  recalculateClientRating: RecalculateClientRating,
  deliveryRepository?: IDeliveryRepository,
  recordOrderPayment?: RecordOrderPaymentUseCase,
  reverseOrderPayment?: ReverseOrderPaymentUseCase,
): UpdateOrder => {
  return async (input: UpdateOrderInput) => {
    const composerResult = await ResultComposer.start()
      .useResult('existing', () => orderRepository.getById(IdVO.create(input.id)))
      .useResult('validateExisting', ({ existing }) => {
        const ord = existing as IOrder | null;
        if (!ord) {
          return Result.fail(createNotFoundError('Order not found'));
        }
        return Result.ok(ord);
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const { validateExisting: existing } = composerResult.getValue() as {
      validateExisting: IOrder;
    };

    const itemsToProcess = input.items || existing.items;

    // Auto-heal missing prices for legacy/broken orders
    const healedItems = await Promise.all(
      itemsToProcess.map(async (item) => {
        const orderItem = item as Partial<IOrderItem>;
        let pPrice: number | undefined = orderItem.purchasePriceAtSale;
        let sPrice: number | undefined = orderItem.sellingPriceAtSale;

        if (input.items) {
          const existingItem = existing.items.find((ei) => ei.productId === item.productId);
          pPrice = existingItem?.purchasePriceAtSale;
          sPrice = existingItem?.sellingPriceAtSale;
        }

        if (pPrice === undefined || sPrice === undefined || isNaN(pPrice) || isNaN(sPrice)) {
          const prodResult = await productRepository.getById(IdVO.create(item.productId));
          if (!prodResult.isFailure && prodResult.getValue()) {
            const prod = prodResult.getValue()!;
            pPrice = prod.purchasePrice ?? ORDER_DEFAULT_PRICE_FALLBACK;
            sPrice = prod.sellingPrice ?? ORDER_DEFAULT_PRICE_FALLBACK;
          } else {
            pPrice = ORDER_DEFAULT_PRICE_FALLBACK;
            sPrice = ORDER_DEFAULT_PRICE_FALLBACK;
          }
        }

        return {
          productId: item.productId,
          quantity: item.quantity,
          purchasePriceAtSale: PositiveNumberVO.create(pPrice),
          sellingPriceAtSale: PositiveNumberVO.create(sPrice),
        };
      }),
    );

    const nextStatus = input.status !== undefined ? input.status : existing.status;
    const nextPaymentStatus = input.paymentStatus !== undefined ? input.paymentStatus : existing.paymentStatus;
    const nextDeliveryStatus = input.deliveryStatus !== undefined ? input.deliveryStatus : existing.deliveryStatus;

    let finalStatus = nextStatus;

    if (nextPaymentStatus === PaymentStatus.REFUNDED) {
      finalStatus = OrderStatus.CANCELLED;
    } else if (nextStatus === OrderStatus.COMPLETED) {
      if (nextPaymentStatus !== PaymentStatus.PAID || nextDeliveryStatus !== DeliveryStatus.COMPLETE) {
        finalStatus = OrderStatus.ACTIVE;
      }
    } else if (
      nextPaymentStatus === PaymentStatus.PAID &&
      nextDeliveryStatus === DeliveryStatus.COMPLETE &&
      nextStatus !== OrderStatus.CANCELLED
    ) {
      finalStatus = OrderStatus.COMPLETED;
    }

    const updated = makeOrder({
      id: input.id,
      items: healedItems,
      total: input.total !== undefined ? input.total : existing.total,
      clientId: input.clientId !== undefined ? input.clientId : existing.clientId,
      status: finalStatus,
      paymentStatus: nextPaymentStatus,
      deliveryStatus: nextDeliveryStatus,
      sellerId: input.sellerId !== undefined ? input.sellerId : existing.sellerId,
      contextId: input.contextId !== undefined ? input.contextId : (existing.contextId ? existing.contextId.toString() : undefined),
      deliveryCost:
        input.deliveryCost !== undefined ? input.deliveryCost : (existing.deliveryCost as unknown as number),
      deliveryId: existing.deliveryId?.toString(),
      payments:
        input.payments !== undefined
          ? input.payments
          : existing.payments?.map((p) => ({
              accountId: p.accountId,
              amount: p.amount,
              exchangeRate: p.exchangeRate,
            })),
      cancellationObservation:
        input.cancellationObservation !== undefined
          ? input.cancellationObservation
          : existing.cancellationObservation,
    });

    const isOldActive = existing.status !== OrderStatus.CANCELLED && existing.paymentStatus !== PaymentStatus.REFUNDED;

    const isNewActive = updated.status !== OrderStatus.CANCELLED && updated.paymentStatus !== PaymentStatus.REFUNDED;

    let operation: StockOperation = StockOperation.NONE;
    if (isOldActive && !isNewActive) {
      operation = StockOperation.RESTORE;
    } else if (!isOldActive && isNewActive) {
      operation = StockOperation.DEDUCT;
    }

    if (operation !== StockOperation.NONE) {
      for (const item of updated.items) {
        const prodResult = await productRepository.getById(IdVO.create(item.productId));
        if (prodResult.isFailure) {
          return Result.fail(prodResult.getError());
        }

        const product = prodResult.getValue();
        if (!product) {
          return Result.fail(createNotFoundError(`Product not found: ${item.productId}`));
        }

        const quantity = item.quantity;
        const newStock = operation === StockOperation.DEDUCT ? product.stock - quantity : product.stock + quantity;

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

    // Handle delivery sync
    if (existing.deliveryId && deliveryRepository) {
      const deliveryRes = await deliveryRepository.getById(existing.deliveryId);
      if (!deliveryRes.isFailure && deliveryRes.getValue()) {
        const delivery = deliveryRes.getValue()!;
        
        // If delivery cost is explicitly set to 0, we delete the delivery completely (user removed delivery)
        if (input.deliveryCost === 0) {
          await deliveryRepository.deleteByIds([existing.deliveryId], IdVO.generateNil());
          // Strip deliveryId from the updated order
          updated.deliveryId = undefined;
        } 
        // If order is cancelled, cancel the delivery if it is not already completed
        else if (finalStatus === OrderStatus.CANCELLED && delivery.status !== SharedDeliveryStatus.DELIVERED) {
          delivery.status = SharedDeliveryStatus.CANCELLED;
          await deliveryRepository.updateById(existing.deliveryId, delivery, IdVO.generateNil());
        }
        // If deliveryCost was updated but not to 0, sync the cost
        else if (input.deliveryCost !== undefined && input.deliveryCost !== delivery.deliveryCost?.valueOf()) {
          delivery.deliveryCost = NonNegativeNumberVO.create(input.deliveryCost);
          await deliveryRepository.updateById(existing.deliveryId, delivery, IdVO.generateNil());
        }
      }
    }

    const saveOrderResult = await orderRepository.updateById(IdVO.create(input.id), updated, IdVO.generateNil());
    if (saveOrderResult.isFailure) {
      return Result.fail(saveOrderResult.getError());
    }

    // Handle financial transactions after order is saved
    if (recordOrderPayment && updated.payments && updated.payments.length > 0) {
      const isPaymentTransition = existing.paymentStatus !== PaymentStatus.PAID && nextPaymentStatus === PaymentStatus.PAID;
      
      if (isPaymentTransition) {
        const txResult = await recordOrderPayment({
          orderId: input.id,
          payments: updated.payments,
        });

        if (txResult.isFailure) {
          // Log but don't fail - financial transactions are optional
          console.error('Failed to record order payment:', txResult.getError());
        }
      } 
    }
    
    if (reverseOrderPayment && existing.payments && existing.payments.length > 0) {
      const isRefundTransition = existing.paymentStatus !== PaymentStatus.REFUNDED && nextPaymentStatus === PaymentStatus.REFUNDED;

      if (isRefundTransition) {
        // Reverse payments for refunds
        for (const payment of existing.payments) {
          const txResult = await reverseOrderPayment({
            orderId: input.id,
            amount: payment.amount as number,
            accountId: payment.accountId.toString(),
          });

          if (txResult.isFailure) {
            console.error('Failed to reverse order payment:', txResult.getError());
          }
        }
      }
    }

    const oldClientId = existing.clientId;
    const newClientId = updated.clientId;

    const recalcOldResult = await recalculateClientRating(oldClientId);
    if (recalcOldResult.isFailure) {
      return Result.fail(recalcOldResult.getError());
    }

    if (oldClientId !== newClientId) {
      const recalcNewResult = await recalculateClientRating(newClientId);
      if (recalcNewResult.isFailure) {
        return Result.fail(recalcNewResult.getError());
      }
    }

    return Result.ok<void, DomainError>();
  };
};
