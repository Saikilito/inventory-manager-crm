export interface StockLotItem {
  id: string;
  productName: string;
  quantity: number;
  unitCost: number;
  suggestedSellingPrice?: number;
  confirmedSellingPrice: number;
  isNewProduct: boolean;
  productId?: string;
  projectedProfit: number;
}

export interface StockLot {
  id: string;
  supplier: string;
  purchaseDate: string;
  items: StockLotItem[];
  paymentMethod: 'CASH' | 'CREDIT';
  transactionId?: string;
  accountsPayableId?: string;
  status: 'RECEIVED' | 'CANCELLED';
  contextId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockLotInput {
  supplier: string;
  purchaseDate: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitCost: number;
    suggestedSellingPrice?: number;
    confirmedSellingPrice: number;
    isNewProduct: boolean;
  }>;
  paymentMethod: 'CASH' | 'CREDIT';
  accountId?: string;
  contextId?: string;
}

export interface CreateStockLotPayload {
  stockLot?: StockLot;
  transaction?: {
    id: string;
    amount: number;
    type: string;
    description: string;
    accountId: string;
    createdAt: string;
  };
  accountsPayable?: {
    id: string;
    stockLotId: string;
    supplier: string;
    totalAmount: number;
    remainingBalance: number;
    status: string;
  };
  productsUpdated?: Array<{
    id: string;
    name: string;
    costPrice: number;
    stock: number;
  }>;
  success: boolean;
  message: string;
}
