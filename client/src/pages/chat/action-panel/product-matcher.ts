import type { ActionPanelProduct, ExtractedCartItem } from "./action-panel.types";

export const matchExtractedProduct = (
  products: ActionPanelProduct[],
  extracted: ExtractedCartItem
): ActionPanelProduct | null => {
  if (extracted.productId) {
    const byId = products.find((p) => p._id === extracted.productId);
    if (byId) return byId;
  }

  if (extracted.productName) {
    const byName = products.find((p) => p.name.toLowerCase() === extracted.productName.toLowerCase());
    if (byName) return byName;
  }

  return null;
};
