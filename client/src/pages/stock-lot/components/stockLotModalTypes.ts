import type { CreateStockLotInput } from "../../../modules/product/infrastructure/graphql/stock-lot-types";
import { PaymentMethod } from "@shared-domain/stock-lot/stock-lot.entity";

export interface ProductShape {
  id: string;
  name: string;
  costPrice: number;
  stock: number;
}

export interface AccountShape {
  id: string;
  name: string;
  currency: string;
  balance: number;
}

export interface ContextShape {
  _id: string;
  name: string;
}

export interface StockLotInitialItem {
  productId?: string;
  productName?: string;
  quantity?: number | string;
  unitCost?: number | string;
  confirmedSellingPrice?: number | string;
  isNewProduct?: boolean;
}

export interface StockLotInitialData {
  id?: string;
  supplier?: string;
  contextId?: string;
  purchaseDate?: string;
  paymentMethod?: PaymentMethod;
  items?: StockLotInitialItem[];
}

export interface CreateStockLotSubmitResult {
  stockLot?: unknown;
  message?: string;
}

export interface CreateStockLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    input: CreateStockLotInput,
    payments?: { accountId: string; amount: number }[]
  ) => Promise<CreateStockLotSubmitResult | void>;
  loading: boolean;
  products: ProductShape[];
  accounts: AccountShape[];
  contexts: ContextShape[];
  initialData?: StockLotInitialData | null;
  selectedDate?: string;
}

export interface StockLotItemInput {
  productName: string;
  quantity: string;
  unitCost: string;
  confirmedSellingPrice: string;
  isNewProduct: boolean;
  selectedProductId: string;
}

export interface PaymentSplit {
  accountId: string;
  amount: string;
}
