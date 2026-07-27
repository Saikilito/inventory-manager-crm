import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { PositiveNumber, PositiveNumberVO } from '../shared/value-objects/positive-number.vo.js';
import { NonNegativeNumber, NonNegativeNumberVO } from '../shared/value-objects/non-negative-number.vo.js';
import { createValidationError } from '../shared/validation-error.js';
import { PaymentMethod, PaymentMethodVO, type PaymentMethodType } from './value-objects/payment-method.vo.js';
import { StockLotStatus, StockLotStatusVO, type StockLotStatusType } from './value-objects/stock-lot-status.vo.js';
import { DateOnlyVO } from '../shared/value-objects/date-only.vo.js';

export { PaymentMethod, PaymentMethodVO, StockLotStatus, StockLotStatusVO };
export type { PaymentMethodType, StockLotStatusType };

export const PRICE_DECIMAL_PRECISION = 2;
export const STOCK_DECIMAL_PRECISION = 4;

export interface IStockLotItem {
  productId?: Id;
  productName: NonEmptyString;
  quantity: NonNegativeNumber;
  unitCost: PositiveNumber;
  confirmedSellingPrice: PositiveNumber;
  isNewProduct: boolean;
  projectedProfit?: PositiveNumber;
}

export interface IStockLot {
  id?: Id;
  supplier: NonEmptyString;
  purchaseDate: string;
  items: IStockLotItem[];
  totalCost: PositiveNumber;
  projectedProfit?: PositiveNumber;
  paymentMethod: PaymentMethod;
  transactionId?: Id;
  accountsPayableId?: Id;
  status: StockLotStatus;
  notes?: NonEmptyString;
  contextId?: Id;
  createdAt: Date;
  updatedAt: Date;
}

export const makeStockLotItem = (props: {
  productId?: string;
  productName: string;
  quantity: number;
  unitCost: number;
  confirmedSellingPrice: number;
  isNewProduct: boolean;
}): IStockLotItem => {
  const roundedQuantity = Number(Number(props.quantity).toFixed(STOCK_DECIMAL_PRECISION));
  const roundedUnitCost = Number(Number(props.unitCost).toFixed(PRICE_DECIMAL_PRECISION));
  const roundedSellingPrice = Number(Number(props.confirmedSellingPrice).toFixed(PRICE_DECIMAL_PRECISION));

  const projectedProfit = (roundedSellingPrice - roundedUnitCost) * roundedQuantity;
  const roundedProjectedProfit =
    projectedProfit > 0 ? Number(projectedProfit.toFixed(PRICE_DECIMAL_PRECISION)) : undefined;

  return {
    productId: props.productId ? IdVO.create(props.productId) : undefined,
    productName: NonEmptyStringVO.create(props.productName ? props.productName.trim() : ''),
    quantity: NonNegativeNumberVO.create(roundedQuantity),
    unitCost: PositiveNumberVO.create(roundedUnitCost),
    confirmedSellingPrice: PositiveNumberVO.create(roundedSellingPrice),
    isNewProduct: props.isNewProduct,
    projectedProfit: roundedProjectedProfit ? PositiveNumberVO.create(roundedProjectedProfit) : undefined,
  };
};

export const makeStockLot = (props: {
  id?: string;
  supplier: string;
  purchaseDate: string;
  items: IStockLotItem[];
  paymentMethod: string;
  transactionId?: string;
  accountsPayableId?: string;
  status?: string;
  notes?: string;
  contextId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}): IStockLot => {
  if (!props.purchaseDate) {
    throw createValidationError('Purchase date is required');
  }
  if (!props.items || props.items.length === 0) {
    throw createValidationError('At least one item is required');
  }

  const paymentMethodVO = PaymentMethodVO.create(props.paymentMethod);
  const statusVO = StockLotStatusVO.create(props.status || StockLotStatus.RECEIVED);

  if (PaymentMethodVO.isCash(paymentMethodVO) && !props.transactionId && !StockLotStatusVO.isDraft(statusVO)) {
    throw createValidationError('Transaction ID is required for CASH payment unless status is DRAFT');
  }

  const totalCost = props.items.reduce((sum, item) => {
    return sum + Number(item.unitCost) * Number(item.quantity);
  }, 0);
  const roundedTotalCost = Number(totalCost.toFixed(PRICE_DECIMAL_PRECISION));

  const projectedProfit = props.items.reduce((sum, item) => {
    return sum + (Number(item.projectedProfit) || 0);
  }, 0);
  const roundedProjectedProfit =
    projectedProfit > 0 ? Number(projectedProfit.toFixed(PRICE_DECIMAL_PRECISION)) : undefined;

  const now = new Date();

  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    supplier: NonEmptyStringVO.create(props.supplier ? props.supplier.trim() : ''),
    purchaseDate: props.purchaseDate,
    items: props.items,
    totalCost: PositiveNumberVO.create(roundedTotalCost),
    projectedProfit: roundedProjectedProfit ? PositiveNumberVO.create(roundedProjectedProfit) : undefined,
    paymentMethod: paymentMethodVO,
    transactionId: props.transactionId ? IdVO.create(props.transactionId) : undefined,
    accountsPayableId: props.accountsPayableId ? IdVO.create(props.accountsPayableId) : undefined,
    status: statusVO,
    notes: props.notes ? NonEmptyStringVO.create(props.notes.trim()) : undefined,
    contextId: props.contextId ? IdVO.create(props.contextId) : undefined,
    createdAt: props.createdAt || now,
    updatedAt: props.updatedAt || now,
  };
};

export const isFuturePurchaseDate = (purchaseDate: string): boolean => {
  if (!purchaseDate) return false;
  return purchaseDate > DateOnlyVO.create().toString();
};

export const canBeReceivedByDate = (purchaseDate: string): boolean => {
  return !isFuturePurchaseDate(purchaseDate);
};

export const canBeReceived = (stockLot: IStockLot): boolean => {
  return StockLotStatusVO.isDraft(stockLot.status);
};

export const canBeCompleted = canBeReceived;

export const completeStockLot = (
  stockLot: IStockLot,
  props: {
    items?: IStockLotItem[];
    transactionId?: Id;
    accountsPayableId?: Id;
  },
): IStockLot => {
  if (!canBeReceived(stockLot)) {
    throw createValidationError('Only DRAFT stock lots can be completed');
  }

  const now = new Date();
  return {
    ...stockLot,
    status: StockLotStatusVO.create(StockLotStatus.RECEIVED),
    items: props.items || stockLot.items,
    transactionId: props.transactionId ?? stockLot.transactionId,
    accountsPayableId: props.accountsPayableId ?? stockLot.accountsPayableId,
    updatedAt: now,
  };
};

export { calculateWeightedAveragePrice } from '../product/product.entity.js';
