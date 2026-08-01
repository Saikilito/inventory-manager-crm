import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { calculateItemsSubtotal } from "@shared-domain/order/order-totals";
import type {
  LiveCartItem,
  LiveEditableField,
  LiveEditedClient,
} from "../ActionPanelDrawerTabs/LiveAiCoPilotTab.types";
import type { ActionPanelChatSession, ActionPanelProduct } from "../../action-panel/action-panel.types";
import { matchExtractedProduct } from "../../action-panel/product-matcher";

const EMPTY_EDITED_CLIENT: LiveEditedClient = { firstName: "", lastName: "", nationalId: "", address: "" };
const DEFAULT_ITEM_PRICE = 0;
const UNKNOWN_PRODUCT_NAME = "Unknown Product";

export interface AiExtraction {
  editedClient: LiveEditedClient;
  setEditedClient: Dispatch<SetStateAction<LiveEditedClient>>;
  editingField: LiveEditableField | null;
  setEditingField: Dispatch<SetStateAction<LiveEditableField | null>>;
  cartItems: LiveCartItem[];
  updateCartQty: (productId: string, delta: number) => void;
  removeCartItem: (productId: string) => void;
  resetCart: () => void;
  aiSubtotal: number;
}

export const useAiExtraction = (
  currentSession: ActionPanelChatSession | undefined,
  products: ActionPanelProduct[]
): AiExtraction => {
  const [editedClient, setEditedClient] = useState<LiveEditedClient>(EMPTY_EDITED_CLIENT);
  const [editingField, setEditingField] = useState<LiveEditableField | null>(null);
  const [cartItems, setCartItems] = useState<LiveCartItem[]>([]);

  const editingFieldRef = useRef(editingField);
  editingFieldRef.current = editingField;

  const extractedSignature = useMemo(
    () => JSON.stringify(currentSession?.extractedData ?? null),
    [currentSession]
  );

  useEffect(() => {
    if (editingFieldRef.current !== null) return;

    const ext = currentSession?.extractedData;
    if (!ext) return;

    setEditedClient({
      firstName: ext.client?.firstName || "",
      lastName: ext.client?.lastName || "",
      nationalId: ext.client?.nationalId || "",
      address: ext.client?.address || "",
    });

    if (!ext.cart || products.length === 0) return;

    setCartItems(
      ext.cart.map((item) => {
        const matched = matchExtractedProduct(products, item);
        return {
          productId: matched?._id || item.productId || "",
          productName: matched?.name || item.productName || UNKNOWN_PRODUCT_NAME,
          quantity: item.quantity,
          price: matched?.sellingPrice ?? item.price ?? DEFAULT_ITEM_PRICE,
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extractedSignature, products]);

  const updateCartQty = useCallback((productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const nextQty = item.quantity + delta;
          return nextQty <= 0 ? null : { ...item, quantity: nextQty };
        })
        .filter((item): item is LiveCartItem => item !== null)
    );
  }, []);

  const removeCartItem = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const resetCart = useCallback(() => setCartItems([]), []);

  const aiSubtotal = useMemo(
    () => calculateItemsSubtotal(cartItems.map((item) => ({ quantity: item.quantity, unitPrice: item.price }))),
    [cartItems]
  );

  return useMemo(
    () => ({
      editedClient,
      setEditedClient,
      editingField,
      setEditingField,
      cartItems,
      updateCartQty,
      removeCartItem,
      resetCart,
      aiSubtotal,
    }),
    [editedClient, editingField, cartItems, updateCartQty, removeCartItem, resetCart, aiSubtotal]
  );
};
