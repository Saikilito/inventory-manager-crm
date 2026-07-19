import { OrderStatus, PaymentStatus, DeliveryStatus } from "@shared-domain/order/order.entity";

export interface TransactionLine {
  id: string;
  orderId: string;
  clientId: string;
  createdAt: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  revenue: number;
  itemCOGS: number;
  totalCOGS: number;
  netMargin: number;
  isFallback: boolean;
}

export interface ProfitDetailSummary {
  totalSales: number;
  totalCOGS: number;
  grossProfit: number;
  totalExpenses: number;
  calculatedNetProfit: number;
  serverNetProfit: number;
  discrepancy: number;
  isReconciled: boolean;
  fallbackCount: number;
}

export const calculateTransactionLines = (
  orders: { _id?: string; id?: string; clientId?: string; createdAt?: string; status: string; paymentStatus?: string; deliveryStatus?: string; items: { productId: string; total: number; quantity: number; sellingPriceAtSale: number; purchasePriceAtSale?: number; contextId?: string; cost?: number }[]; contextId?: string }[],
  productsMap: Map<string, { cost: number; name?: string; purchasePrice?: number; [key: string]: unknown }>,
  contextProductIds: Set<string> | null
): TransactionLine[] => {
  // Only completed orders should be calculated
  const completedOrders = orders.filter(
    (o) =>
      o.status === OrderStatus.ACTIVE &&
      o.paymentStatus === PaymentStatus.PAID &&
      o.deliveryStatus === DeliveryStatus.COMPLETE
  );

  return completedOrders.flatMap((order) => {
    const orderItemsInContext = order.items.filter((item: { productId: string; total: number; contextId?: string; cost?: number }) =>
      contextProductIds === null || contextProductIds.has(item.productId.toString())
    );

    if (orderItemsInContext.length === 0) {
      return [];
    }

    return orderItemsInContext.map((item: { productId: string; total: number; contextId?: string; cost?: number }) => {
      const qty = item.quantity;
      const sPrice = item.sellingPriceAtSale;
      let pPrice = item.purchasePriceAtSale;
      let isFallback = false;

      if (!pPrice || pPrice <= 0.01) {
        const catalogProd = productsMap.get(item.productId.toString());
        pPrice = catalogProd?.purchasePrice || 0;
        isFallback = true;
      }

      const revenue = qty * sPrice;
      const totalCOGS = qty * pPrice;
      const netMargin = revenue - totalCOGS;

      return {
        id: `${order._id || order.id}-${item.productId}`,
        orderId: order._id || order.id,
        clientId: order.clientId,
        createdAt: order.createdAt,
        productName: productsMap.get(item.productId.toString())?.name || "Unknown Product",
        quantity: qty,
        unitPrice: sPrice,
        revenue,
        itemCOGS: pPrice,
        totalCOGS,
        netMargin,
        isFallback,
      };
    });
  });
};
