import { PaymentMethod } from '@shared-domain/stock-lot/stock-lot.entity';

export interface StockLotItem {
  id?: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitCost: number;
  confirmedSellingPrice: number;
  isNewProduct: boolean;
  projectedProfit: number;
}

export interface StockLot {
  _id: string;
  id?: string;
  supplier: string;
  purchaseDate: string;
  items: StockLotItem[];
  paymentMethod: PaymentMethod;
  accountId?: string;
  transactionId?: string;
  accountsPayableId?: string;
  status: 'DRAFT' | 'RECEIVED' | 'PARTIAL' | 'PAID' | 'CANCELLED';
  contextId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockLotInput {
  supplier: string;
  purchaseDate: string;
  items: Array<{
    productId?: string;
    productName: string;
    quantity: number;
    unitCost: number;
    confirmedSellingPrice: number;
  }>;
  paymentMethod: PaymentMethod;
  accountId?: string;
  contextId?: string;
  status?: string;
}

export interface UpdateStockLotInput {
  id: string;
  supplier: string;
  purchaseDate: string;
  items: Array<{
    productId?: string;
    productName: string;
    quantity: number;
    unitCost: number;
    confirmedSellingPrice: number;
  }>;
  paymentMethod: PaymentMethod;
  accountId?: string;
  contextId?: string;
}

export interface CreateStockLotPayload {
  stockLot: StockLot;
  accountsPayableId?: string;
  createdProducts: Array<{
    id: string;
    name: string;
    costPrice: number;
    stock: number;
  }>;
  updatedProducts: Array<{
    id: string;
    name: string;
    costPrice: number;
    stock: number;
  }>;
}
