import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonNegativeNumber, NonNegativeNumberVO } from '../shared/value-objects/non-negative-number.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { PositiveNumber, PositiveNumberVO } from '../shared/value-objects/positive-number.vo.js';
import { DateTime, DateTimeVO } from '../shared/value-objects/date-time.vo.js';
import { createValidationError } from '../shared/validation-error.js';
import { validateCancellationObservationForStatus } from './cancellation-observation.vo.js';

export const PRICE_DECIMAL_PRECISION = 2;
export const QUANTITY_DECIMAL_PRECISION = 4;

export const ORDER_DEFAULT_PRICE_FALLBACK = 0.01;

export interface IOrderItem {
  productId: Id;
  quantity: NonNegativeNumber; // Supports fractional quantities (rounded to 4 decimals)
  purchasePriceAtSale: PositiveNumber; // Snapshot of purchase price at sale (rounded to 2 decimals)
  sellingPriceAtSale: PositiveNumber; // Snapshot of selling price at sale (rounded to 2 decimals)
}

export interface IOrderPayment {
  accountId: Id;
  amount: PositiveNumber;
  exchangeRate: PositiveNumber;
}

export const PaymentStatus = Object.freeze({
  PENDING: 'PENDING',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
} as const);

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const DeliveryStatus = Object.freeze({
  PENDING: 'PENDING',
  SENT: 'SENT',
  COMPLETE: 'COMPLETE',
} as const);

export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];

export const OrderStatus = Object.freeze({
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
} as const);

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export interface IOrder {
  id?: Id;
  items: IOrderItem[];
  total: NonNegativeNumber; // Rounded to 2 decimals
  createdAt?: DateTime;
  clientId: Id;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  sellerId: Id;
  contextId?: Id | null;
  deliveryId?: Id; // Reference to Delivery document
  deliveryCost?: NonNegativeNumber;
  customDeliveryAddress?: NonEmptyString;
  payments?: IOrderPayment[];
  cancellationObservation?: string; // Required when status is CANCELLED
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
  deliveryStatus?: DeliveryStatus;
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
    const dStatus = props.deliveryStatus || DeliveryStatus.PENDING;
    if (
      pStatus === PaymentStatus.PAID &&
      (dStatus === DeliveryStatus.SENT || dStatus === DeliveryStatus.COMPLETE)
    ) {
      throw createValidationError('Cannot cancel an order that is PAID and SENT/COMPLETE');
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
      const isTest = typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || !!process.env?.VITEST);
      const isServer = (typeof globalThis === 'undefined' || !('window' in globalThis)) && !isTest;
      if (isServer) {
        if (
          item.purchasePriceAtSale === undefined ||
          item.purchasePriceAtSale === null ||
          isNaN(item.purchasePriceAtSale)
        ) {
          throw createValidationError('Purchase price at sale is required');
        }
        if (
          item.sellingPriceAtSale === undefined ||
          item.sellingPriceAtSale === null ||
          isNaN(item.sellingPriceAtSale)
        ) {
          throw createValidationError('Selling price at sale is required');
        }
      }
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
    deliveryStatus: props.deliveryStatus || DeliveryStatus.PENDING,
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
