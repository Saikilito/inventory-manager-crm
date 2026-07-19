export interface GroupedItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitPurchasePrice: number;
  revenue: number;
  totalCOGS: number;
  netMargin: number;
  isFallback: boolean;
}

export interface GroupedOrder {
  orderId: string;
  shortId: string;
  createdAt: string;
  clientName: string;
  revenue: number;
  totalCOGS: number;
  netProfit: number;
  marginPct: number;
  hasFallback: boolean;
  items: GroupedItem[];
}
