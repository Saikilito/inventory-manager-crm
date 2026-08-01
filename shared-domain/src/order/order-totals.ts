export const PURCHASE_PRICE_FALLBACK_RATIO = 0.7;

export interface ItemsSubtotalInput {
  quantity: number;
  unitPrice: number;
}

export const calculateItemsSubtotal = (items: ItemsSubtotalInput[]): number =>
  items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

export const calculateOrderTotal = (subtotal: number, deliveryFee: number): number => subtotal + deliveryFee;

export const resolvePurchasePrice = (purchasePrice: number | undefined, sellingPrice: number): number =>
  purchasePrice !== undefined && purchasePrice !== null && !isNaN(purchasePrice)
    ? purchasePrice
    : sellingPrice * PURCHASE_PRICE_FALLBACK_RATIO;
