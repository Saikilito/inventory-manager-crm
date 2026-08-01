import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonNegativeNumber, NonNegativeNumberVO } from '../shared/value-objects/non-negative-number.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { PositiveNumber, PositiveNumberVO } from '../shared/value-objects/positive-number.vo.js';
import { DateTime, DateTimeVO } from '../shared/value-objects/date-time.vo.js';
import { validateCancellationObservationForStatus } from './cancellation-observation.vo.js';
import { OrderStatus, PaymentStatus } from './order-status.js';
import { assertOrderCancellable } from './order-status.rules.js';

export { OrderStatus, PaymentStatus } from './order-status.js';

export const PRICE_DECIMAL_PRECISION = 2;
export const QUANTITY_DECIMAL_PRECISION = 4;

export const ORDER_DEFAULT_PRICE_FALLBACK = 0.01;

export interface IOrderItem {
  productId: Id;
  quantity: NonNegativeNumber;
  purchasePriceAtSale: PositiveNumber;
  sellingPriceAtSale: PositiveNumber;
}

export interface IOrderPayment {
  accountId: Id;
  amount: PositiveNumber;
  exchangeRate: PositiveNumber;
}

export interface IOrder {
  id?: Id;
  items: IOrderItem[];
  total: NonNegativeNumber;
  createdAt?: DateTime;
  clientId: Id;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  sellerId: Id;
  contextId?: Id | null;
  deliveryId?: Id;
  deliveryCost?: NonNegativeNumber;
  customDeliveryAddress?: NonEmptyString;
  payments?: IOrderPayment[];
  cancellationObservation?: string;
}

export const makeOrder = (props: {
  id?: string;
  items: Array<{
    productId: string;
    quantity: number;
    purchasePriceAtSale?: number;
    sellingPriceAtSale?: number;
  }>;
  total: number;
  createdAt?: string;
  clientId: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  sellerId: string;
  contextId?: string;
  deliveryId?: string;
  deliveryCost?: number;
  customDeliveryAddress?: string;
  payments?: Array<{
    accountId: string;
    amount: number;
    exchangeRate: number;
  }>;
  cancellationObservation?: string;
}): IOrder => {
  const roundedTotal = Number(Number(props.total).toFixed(PRICE_DECIMAL_PRECISION));
  const roundedDeliveryCost =
    props.deliveryCost !== undefined && props.deliveryCost !== null
      ? Number(Number(props.deliveryCost).toFixed(PRICE_DECIMAL_PRECISION))
      : undefined;

  if (props.status === OrderStatus.CANCELLED) {
    const pStatus = props.paymentStatus || PaymentStatus.PENDING;
    const cancellableResult = assertOrderCancellable({ paymentStatus: pStatus, deliveryStatus: null });
    if (cancellableResult.isFailure) {
      throw cancellableResult.getError();
    }

    const obsValidation = validateCancellationObservationForStatus(props.cancellationObservation, props.status);
    if (obsValidation.isFailure) {
      throw obsValidation.getError();
    }
  }

  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    items: (props.items || []).map((item) => {
      const roundedQty = Number(Number(item.quantity).toFixed(QUANTITY_DECIMAL_PRECISION));
      const rawPPrice =
        item.purchasePriceAtSale !== undefined && item.purchasePriceAtSale !== null && !isNaN(item.purchasePriceAtSale)
          ? item.purchasePriceAtSale
          : ORDER_DEFAULT_PRICE_FALLBACK;
      const rawSPrice =
        item.sellingPriceAtSale !== undefined && item.sellingPriceAtSale !== null && !isNaN(item.sellingPriceAtSale)
          ? item.sellingPriceAtSale
          : ORDER_DEFAULT_PRICE_FALLBACK;

      const pPrice = Number(Number(rawPPrice).toFixed(PRICE_DECIMAL_PRECISION));
      const sPrice = Number(Number(rawSPrice).toFixed(PRICE_DECIMAL_PRECISION));

      return {
        productId: IdVO.create(item.productId),
        quantity: NonNegativeNumberVO.create(roundedQty),
        purchasePriceAtSale: PositiveNumberVO.create(pPrice),
        sellingPriceAtSale: PositiveNumberVO.create(sPrice),
      };
    }),
    total: NonNegativeNumberVO.create(roundedTotal),
    createdAt: DateTimeVO.create(props.createdAt),
    clientId: IdVO.create(props.clientId),
    status: props.status || OrderStatus.ACTIVE,
    paymentStatus: props.paymentStatus || PaymentStatus.PENDING,
    sellerId: IdVO.create(props.sellerId),
    contextId:
      props.contextId !== undefined && props.contextId !== null
        ? IdVO.create(props.contextId)
        : props.contextId === null
          ? null
          : undefined,
    deliveryId: props.deliveryId ? IdVO.create(props.deliveryId) : undefined,
    deliveryCost: roundedDeliveryCost !== undefined ? NonNegativeNumberVO.create(roundedDeliveryCost || 0) : undefined,
    customDeliveryAddress: props.customDeliveryAddress
      ? NonEmptyStringVO.create(props.customDeliveryAddress)
      : undefined,
    payments:
      props.payments !== undefined && props.payments !== null
        ? props.payments.map((p) => ({
            accountId: IdVO.create(p.accountId),
            amount: PositiveNumberVO.create(Number(Number(p.amount).toFixed(PRICE_DECIMAL_PRECISION))),
            exchangeRate: PositiveNumberVO.create(Number(p.exchangeRate)),
          }))
        : undefined,
    cancellationObservation: props.cancellationObservation?.trim() || undefined,
  };
};
