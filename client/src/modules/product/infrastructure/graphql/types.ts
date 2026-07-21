export interface GQLProduct {
  _id: string;
  name: string;
  price: number;
  purchasePrice: number;
  sellingPrice: number;
  profit: number;
  profitMargin: number;
  stock: number;
  stockValue: number;
  potentialProfit: number;
  contextId?: string | null;
}

export interface GQLGetAllProductsResponse {
  getAllProducts: GQLProduct[];
  totalProducts: number;
}

export interface GQLGetProductResponse {
  getProduct: GQLProduct | null;
}

export interface GQLProductStats {
  totalProducts: number;
  totalStock: number;
  totalStockValue: number;
  totalPotentialProfit: number;
  averageMargin: number;
}

export interface GQLProductStatsResponse {
  productStats: GQLProductStats;
}

export interface GQLProductInput {
  _id?: string;
  name: string;
  price?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  stock: number;
  contextId?: string | null;
}
