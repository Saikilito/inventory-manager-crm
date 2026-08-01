import { useCallback, useEffect, useMemo, useState } from "react";
import { DeliveryMethod } from "@shared-domain/delivery/delivery.entity";
import { DEFAULT_SELLER_ID } from "@shared-domain/chat/agent.entity";
import { calculateItemsSubtotal, calculateOrderTotal, resolvePurchasePrice } from "@shared-domain/order/order-totals";

import { usePanelNavigation } from "./use-panel-navigation";
import { usePanelFeedback } from "./use-panel-feedback";
import { useActionPanelData } from "./use-action-panel-data";
import { useAiExtraction } from "./use-ai-extraction";
import { useDeliveryQuote } from "./use-delivery-quote";
import { useDraftOrder } from "./use-draft-order";
import { useOrderSubmission } from "./use-order-submission";
import type { ActionPanelProduct } from "../../action-panel/action-panel.types";

const CLIENT_REGISTRATION_ERROR = "First and last name are required to register the client.";
const SYNC_SUCCESS_MESSAGE = "⚡️ Sync completed! Client & Order successfully created in 1-Click.";
const DRAFT_SUCCESS_MESSAGE = "Draft Order created successfully!";
const EMPTY_CART_ERROR = "Extracted cart cannot be empty.";
const NO_CLIENT_ERROR = "Please select or register a client first.";
const EMPTY_DRAFT_ERROR = "Order items cannot be empty.";
const DEFAULT_UNKNOWN_ERROR = "An unexpected error occurred.";

export const useActionPanelLogic = (whatsappId: string) => {
  const navigation = usePanelNavigation();
  const feedback = usePanelFeedback();
  const data = useActionPanelData(whatsappId);
  const aiExtraction = useAiExtraction(data.currentSession, data.products);
  const delivery = useDeliveryQuote(aiExtraction.editedClient.address);
  const draft = useDraftOrder();
  const submission = useOrderSubmission();

  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { selectedClientId, setSelectedClientId } = draft;
  useEffect(() => {
    if (selectedClientId || !data.crmClientMatch?.id) return;
    setSelectedClientId(String(data.crmClientMatch.id));
  }, [data.crmClientMatch, selectedClientId, setSelectedClientId]);

  const addProduct = useCallback(
    (product: ActionPanelProduct) => {
      draft.addProduct(product);
      navigation.setActiveTab("order");
    },
    [draft, navigation]
  );

  const handleSyncAll = useCallback(async () => {
    feedback.clearFeedback();

    if (!data.crmClientMatch && (!aiExtraction.editedClient.firstName || !aiExtraction.editedClient.lastName)) {
      feedback.showError(CLIENT_REGISTRATION_ERROR);
      return;
    }

    if (aiExtraction.cartItems.length === 0) {
      feedback.showError(EMPTY_CART_ERROR);
      return;
    }

    setSyncing(true);

    const clientResult = await submission.findOrCreateClient(whatsappId, {
      firstName: aiExtraction.editedClient.firstName,
      lastName: aiExtraction.editedClient.lastName,
      address: aiExtraction.editedClient.address || "WhatsApp AI Extraction",
      whatsapp: whatsappId,
      nationalId: aiExtraction.editedClient.nationalId || "0",
      sellerId: DEFAULT_SELLER_ID,
    });

    if (clientResult.isFailure) {
      feedback.showError(clientResult.getError().message || DEFAULT_UNKNOWN_ERROR);
      setSyncing(false);
      return;
    }

    const items = aiExtraction.cartItems.map((item) => {
      const product = data.products.find((p) => p._id === item.productId);
      return {
        productId: item.productId,
        quantity: item.quantity,
        sellingPriceAtSale: item.price,
        purchasePriceAtSale: resolvePurchasePrice(product?.purchasePrice, item.price),
      };
    });

    const subtotal = calculateItemsSubtotal(
      items.map((item) => ({ quantity: item.quantity, unitPrice: item.sellingPriceAtSale }))
    );
    const isDelivery = delivery.deliveryType === DeliveryMethod.DELIVERY;

    const orderResult = await submission.submitOrder({
      clientId: clientResult.getValue(),
      items,
      total: calculateOrderTotal(subtotal, isDelivery ? delivery.deliveryCost : 0),
      sellerId: DEFAULT_SELLER_ID,
      deliveryCost: isDelivery ? delivery.deliveryCost : undefined,
      customDeliveryAddress: delivery.resolvedDeliveryAddress,
    });

    setSyncing(false);

    if (orderResult.isFailure) {
      feedback.showError(orderResult.getError().message || DEFAULT_UNKNOWN_ERROR);
      return;
    }

    feedback.showSuccess(SYNC_SUCCESS_MESSAGE);
    aiExtraction.resetCart();
  }, [whatsappId, data.crmClientMatch, data.products, aiExtraction, delivery, submission, feedback]);

  const handleSubmitDraft = useCallback(async () => {
    feedback.clearFeedback();

    if (!draft.selectedClientId) {
      feedback.showError(NO_CLIENT_ERROR);
      return;
    }

    if (draft.orderItems.length === 0) {
      feedback.showError(EMPTY_DRAFT_ERROR);
      return;
    }

    setSubmitting(true);

    const items = draft.orderItems.map((item) => ({
      productId: item.product._id,
      quantity: item.quantity,
      sellingPriceAtSale: item.product.sellingPrice,
      purchasePriceAtSale: resolvePurchasePrice(item.product.purchasePrice, item.product.sellingPrice),
    }));

    const orderResult = await submission.submitOrder({
      clientId: draft.selectedClientId,
      items,
      total: calculateOrderTotal(draft.draftSubtotal, delivery.deliveryCost),
      sellerId: DEFAULT_SELLER_ID,
      deliveryCost: delivery.deliveryCost,
      customDeliveryAddress: delivery.resolvedDeliveryAddress,
    });

    setSubmitting(false);

    if (orderResult.isFailure) {
      feedback.showError(orderResult.getError().message || DEFAULT_UNKNOWN_ERROR);
      return;
    }

    feedback.showSuccess(DRAFT_SUCCESS_MESSAGE);
    draft.resetDraft();
  }, [draft, delivery, submission, feedback]);

  return useMemo(
    () => ({
      navigation,
      feedback,
      data,
      aiCopilot: { ...aiExtraction, syncing },
      draft: { ...draft, addProduct, submitting },
      delivery,
      handleSyncAll,
      handleSubmitDraft,
    }),
    [navigation, feedback, data, aiExtraction, syncing, draft, addProduct, submitting, delivery, handleSyncAll, handleSubmitDraft]
  );
};
