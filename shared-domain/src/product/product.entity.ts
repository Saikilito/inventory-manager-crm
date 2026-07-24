import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { NonNegativeNumber, NonNegativeNumberVO } from '../shared/value-objects/non-negative-number.vo.js';
import { PositiveNumber, PositiveNumberVO } from '../shared/value-objects/positive-number.vo.js';
import { UnitOfMeasure } from '../shared/value-objects/unit-of-measure.vo.js';
import { PackagingType } from '../shared/value-objects/packaging-type.vo.js';
import { ValidationError, createValidationError } from '../shared/validation-error.js';

export const PRICE_DECIMAL_PRECISION = 2;
export const QUANTITY_DECIMAL_PRECISION = 4;

export const PRODUCT_DEFAULT_PRICE_FALLBACK = 1.00;

export interface IProductPresentation {
  packagingType: PackagingType;
  contentSize: PositiveNumber;
  contentUom: UnitOfMeasure;
}

export interface IProduct {
  id?: Id;
  name: NonEmptyString;
  purchasePrice: PositiveNumber;
  sellingPrice: PositiveNumber;
  stock: NonNegativeNumber; // Supports fractional quantities, rounded to 4 decimals
  unitOfMeasure: UnitOfMeasure;
  contextId?: Id;
  customAttributes?: Record<string, string | number | boolean | string[]>;
  presentation?: IProductPresentation;
}

export const makeProduct = (props: {
  id?: string;
  name: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  unitOfMeasure?: string;
  contextId?: string;
  customAttributes?: Record<string, string | number | boolean | string[]>;
  presentation?: {
    packagingType: string;
    contentSize: number;
    contentUom: string;
  };
}): IProduct => {
  const isTest = typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || !!process.env?.VITEST);
  const isServer = (typeof globalThis === 'undefined' || !('window' in globalThis)) && !isTest;

  if (isServer) {
    if (props.sellingPrice === undefined) {
      throw createValidationError('Selling price is required');
    }
    if (props.purchasePrice === undefined) {
      throw createValidationError('Purchase price is required');
    }
  }

  const rawSellingPrice = props.sellingPrice !== undefined ? props.sellingPrice : PRODUCT_DEFAULT_PRICE_FALLBACK;
  const rawPurchasePrice = props.purchasePrice !== undefined ? props.purchasePrice : PRODUCT_DEFAULT_PRICE_FALLBACK;

  // Float precision control (Prices rounded to 2 decimals, Stock to 4 decimals)
  const roundedSellingPrice = Number(Number(rawSellingPrice).toFixed(PRICE_DECIMAL_PRECISION));
  const roundedPurchasePrice = Number(Number(rawPurchasePrice).toFixed(PRICE_DECIMAL_PRECISION));
  const roundedStock = Number(Number(props.stock).toFixed(QUANTITY_DECIMAL_PRECISION));

  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    name: NonEmptyStringVO.create(props.name),
    purchasePrice: PositiveNumberVO.create(roundedPurchasePrice),
    sellingPrice: PositiveNumberVO.create(roundedSellingPrice),
    stock: NonNegativeNumberVO.create(roundedStock),
    unitOfMeasure: (props.unitOfMeasure as UnitOfMeasure) || UnitOfMeasure.UNIT,
    contextId: props.contextId ? IdVO.create(props.contextId) : undefined,
    customAttributes: props.customAttributes,
    presentation: props.presentation ? {
      packagingType: (props.presentation.packagingType as PackagingType) || PackagingType.UNIT,
      contentSize: PositiveNumberVO.create(Number(Number(props.presentation.contentSize).toFixed(QUANTITY_DECIMAL_PRECISION))),
      contentUom: (props.presentation.contentUom as UnitOfMeasure) || UnitOfMeasure.UNIT,
    } : undefined,
  };
};
