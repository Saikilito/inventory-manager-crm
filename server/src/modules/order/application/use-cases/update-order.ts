import { match } from "ts-pattern";
import {
  DomainError,
  NotFoundError,
} from "../../../../../../shared-domain/src/shared/errors.js";
import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { ResultComposer } from "../../../../../../shared-domain/src/shared/result-composer.js";
import { IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import {
  IOrder,
  IOrderItem,
  makeOrder,
  OrderStatus,
} from "../../../../../../shared-domain/src/order/order.entity.js";
import { IOrderRepository } from "../repositories/order.repository.js";
import { IProductRepository } from "../../../product/application/repositories/product.repository.js";
import {
  IProduct,
  makeProduct,
} from "../../../../../../shared-domain/src/product/product.entity.js";
import { RecalculateClientRating } from "../../../client/application/use-cases/recalculate-client-rating.js";
import { StockOperation } from "./update-order.constants.js";

export interface UpdateOrderInput {
  id: string;
  items?: Array<{ productId: string; quantity: number }>;
  total?: number;
  clientId?: string;
  status?: OrderStatus;
  sellerId?: string;
}

export type UpdateOrder = UseCase<UpdateOrderInput, void, DomainError>;

export const makeUpdateOrder = (
  orderRepository: IOrderRepository,
  productRepository: IProductRepository,
  recalculateClientRating: RecalculateClientRating,
): UpdateOrder => {
  return async (input: UpdateOrderInput) => {
    const composerResult = await ResultComposer.start()
      .useResult("existing", () =>
        orderRepository.getById(IdVO.create(input.id)),
      )
      .useResult("validateExisting", ({ existing }) => {
        const ord = existing as IOrder | null;
        if (!ord) {
          return Result.fail(new NotFoundError("Order not found"));
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

    const updated = makeOrder({
      id: input.id,
      items: input.items
        ? input.items
        : existing.items.map((item: IOrderItem) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
      total: input.total !== undefined ? input.total : existing.total,
      clientId:
        input.clientId !== undefined ? input.clientId : existing.clientId,
      status: input.status !== undefined ? input.status : existing.status,
      sellerId:
        input.sellerId !== undefined ? input.sellerId : existing.sellerId,
    });

    const operation = match([existing.status, updated.status])
      .with([OrderStatus.PENDING, OrderStatus.COMPLETED], () => StockOperation.DEDUCT)
      .with([OrderStatus.COMPLETED, OrderStatus.CANCELLED], () => StockOperation.RESTORE)
      .otherwise(() => StockOperation.NONE);

    if (operation !== StockOperation.NONE) {
      for (const item of updated.items) {
        const prodResult = await productRepository.getById(
          IdVO.create(item.productId),
        );
        if (prodResult.isFailure) {
          return Result.fail(prodResult.getError());
        }

        const product = prodResult.getValue();
        if (!product) {
          return Result.fail(
            new NotFoundError(`Product not found: ${item.productId}`),
          );
        }

        const quantity = item.quantity;
        const newStock =
          operation === StockOperation.DEDUCT
            ? product.stock - quantity
            : product.stock + quantity;

        if (newStock < 0) {
          return Result.fail(
            new Error(`Insufficient stock for product: ${product.name}`),
          );
        }

        const updatedProduct = makeProduct({
          id: product.id,
          name: product.name,
          price: product.price,
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

    const saveOrderResult = await orderRepository.updateById(
      IdVO.create(input.id),
      updated,
      IdVO.generateNil(),
    );
    if (saveOrderResult.isFailure) {
      return Result.fail(saveOrderResult.getError());
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
