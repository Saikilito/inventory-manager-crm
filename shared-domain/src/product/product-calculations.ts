export const calculateProfit = (sellingPrice: number, purchasePrice: number): number => {
  return sellingPrice - purchasePrice;
};

export const calculateProfitMargin = (sellingPrice: number, purchasePrice: number): number => {
  const profit = calculateProfit(sellingPrice, purchasePrice);
  return sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
};

export const calculateStockValue = (purchasePrice: number, stock: number): number => {
  return purchasePrice * stock;
};

export const calculatePotentialProfit = (sellingPrice: number, purchasePrice: number, stock: number): number => {
  return calculateProfit(sellingPrice, purchasePrice) * stock;
};
