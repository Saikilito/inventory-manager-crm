import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { PositiveNumber, PositiveNumberVO } from '../shared/value-objects/positive-number.vo.js';
import { NonNegativeNumber, NonNegativeNumberVO } from '../shared/value-objects/non-negative-number.vo.js';
import { ValidationError } from '../shared/validation-error.js';

export const PRICE_DECIMAL_PRECISION = 2;
export const STOCK_DECIMAL_PRECISION = 4;

export type PaymentMethod = 'CASH' | 'CREDIT';
export type StockLotStatus = 'RECEIVED' | 'PARTIAL' | 'PAID';

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
  if (!props.productName || props.productName.trim().length === 0) {
    throw new ValidationError('Product name is required');
  }
  if (props.quantity < 0) {
    throw new ValidationError('Quantity must be non-negative');
  }
  if (props.unitCost <= 0) {
    throw new ValidationError('Unit cost must be positive');
  }
  if (props.confirmedSellingPrice <= 0) {
    throw new ValidationError('Confirmed selling price must be positive');
  }

  const roundedQuantity = Number(Number(props.quantity).toFixed(STOCK_DECIMAL_PRECISION));
  const roundedUnitCost = Number(Number(props.unitCost).toFixed(PRICE_DECIMAL_PRECISION));
  const roundedSellingPrice = Number(Number(props.confirmedSellingPrice).toFixed(PRICE_DECIMAL_PRECISION));
  
  const projectedProfit = (roundedSellingPrice - roundedUnitCost) * roundedQuantity;
  const roundedProjectedProfit = projectedProfit > 0 ? Number(projectedProfit.toFixed(PRICE_DECIMAL_PRECISION)) : undefined;

  return {
    productId: props.productId ? IdVO.create(props.productId) : undefined,
    productName: NonEmptyStringVO.create(props.productName.trim()),
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
  paymentMethod: PaymentMethod;
  transactionId?: string;
  accountsPayableId?: string;
  status?: StockLotStatus;
  notes?: string;
  contextId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}): IStockLot => {
  if (!props.supplier || props.supplier.trim().length === 0) {
    throw new ValidationError('Supplier name is required');
  }
  if (!props.purchaseDate) {
    throw new ValidationError('Purchase date is required');
  }
  if (!props.items || props.items.length === 0) {
    throw new ValidationError('At least one item is required');
  }
  if (props.paymentMethod === 'CASH' && !props.transactionId) {
    throw new ValidationError('Transaction ID is required for CASH payment');
  }
  // accountsPayableId is optional for CREDIT during creation, will be set later via update

  const totalCost = props.items.reduce((sum, item) => {
    return sum + (Number(item.unitCost) * Number(item.quantity));
  }, 0);
  const roundedTotalCost = Number(totalCost.toFixed(PRICE_DECIMAL_PRECISION));

  const projectedProfit = props.items.reduce((sum, item) => {
    return sum + (Number(item.projectedProfit) || 0);
  }, 0);
  const roundedProjectedProfit = projectedProfit > 0 ? Number(projectedProfit.toFixed(PRICE_DECIMAL_PRECISION)) : undefined;

  const now = new Date();

  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    supplier: NonEmptyStringVO.create(props.supplier.trim()),
    purchaseDate: props.purchaseDate,
    items: props.items,
    totalCost: PositiveNumberVO.create(roundedTotalCost),
    projectedProfit: roundedProjectedProfit ? PositiveNumberVO.create(roundedProjectedProfit) : undefined,
    paymentMethod: props.paymentMethod,
    transactionId: props.transactionId ? IdVO.create(props.transactionId) : undefined,
    accountsPayableId: props.accountsPayableId ? IdVO.create(props.accountsPayableId) : undefined,
    status: props.status || 'RECEIVED',
    notes: props.notes ? NonEmptyStringVO.create(props.notes.trim()) : undefined,
    contextId: props.contextId ? IdVO.create(props.contextId) : undefined,
    createdAt: props.createdAt || now,
    updatedAt: props.updatedAt || now,
  };
};

/**
 * Calculates weighted average price when adding stock from a lot.
 * Formula: newPrice = ((currentPrice × currentStock) + (lotUnitCost × lotQuantity)) / (currentStock + lotQuantity)
 */
export const calculateWeightedAveragePrice = (
  currentPrice: number,
  currentStock: number,
  lotUnitCost: number,
  lotQuantity: number,
): number => {
  if (currentStock === 0) {
    return Number(lotUnitCost.toFixed(PRICE_DECIMAL_PRECISION));
  }

  const newPrice = ((currentPrice * currentStock) + (lotUnitCost * lotQuantity)) / (currentStock + lotQuantity);
  return Number(newPrice.toFixed(PRICE_DECIMAL_PRECISION));
};
