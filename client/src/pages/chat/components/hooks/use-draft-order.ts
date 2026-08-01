import { useMemo, useState } from "react";
import { calculateItemsSubtotal } from "@shared-domain/order/order-totals";
import type { ActionPanelProduct, DraftOrderItem } from "../../action-panel/action-panel.types";

export interface DraftOrder {
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  orderItems: DraftOrderItem[];
  addProduct: (product: ActionPanelProduct) => void;
  updateQty: (productId: string, delta: number) => void;
  removeItem: (productId: string) => void;
  resetDraft: () => void;
  draftSubtotal: number;
}

export const useDraftOrder = (): DraftOrder => {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [orderItems, setOrderItems] = useState<DraftOrderItem[]>([]);

  const addProduct = (product: ActionPanelProduct) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        return prev.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((item) => {
          if (item.product._id !== productId) return item;
          const nextQty = item.quantity + delta;
          return nextQty <= 0 ? null : { ...item, quantity: Math.min(nextQty, item.product.stock) };
        })
        .filter((item): item is DraftOrderItem => item !== null)
    );
  };

  const removeItem = (productId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const resetDraft = () => setOrderItems([]);

  const draftSubtotal = useMemo(
    () =>
      calculateItemsSubtotal(
        orderItems.map((item) => ({ quantity: item.quantity, unitPrice: item.product.sellingPrice }))
      ),
    [orderItems]
  );

  return useMemo(
    () => ({
      selectedClientId,
      setSelectedClientId,
      orderItems,
      addProduct,
      updateQty,
      removeItem,
      resetDraft,
      draftSubtotal,
    }),
    [selectedClientId, orderItems, draftSubtotal]
  );
};
