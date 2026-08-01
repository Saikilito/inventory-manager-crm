import React from "react";
import { X, ShoppingBag, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

import { NewClientTab } from "./ActionPanelDrawerTabs/NewClientTab";
import { CatalogTab } from "./ActionPanelDrawerTabs/CatalogTab";
import { DraftOrderTab } from "./ActionPanelDrawerTabs/DraftOrderTab";
import { LiveAiCoPilotTab } from "./ActionPanelDrawerTabs/LiveAiCoPilotTab";
import { useActionPanelLogic } from "./hooks/use-action-panel-logic";
import { calculateOrderTotal } from "@shared-domain/order/order-totals";

interface ActionPanelDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappId: string;
}

export const ActionPanelDrawer: React.FC<ActionPanelDrawerProps> = ({
  isOpen,
  onClose,
  whatsappId,
}) => {
  const logic = useActionPanelLogic(whatsappId);
  const { navigation, feedback, data, aiCopilot, draft, delivery } = logic;

  if (!isOpen) return null;

  const aiFinalTotal = calculateOrderTotal(aiCopilot.aiSubtotal, delivery.deliveryCost);
  const draftFinalTotal = calculateOrderTotal(draft.draftSubtotal, delivery.deliveryCost);

  return (
    <aside className={`w-full h-full border-l border-stone-200 dark:border-stone-800 flex flex-col z-20 shadow-lg animate-[slideInRight_0.3s_ease-out] relative transition-colors duration-300
      ${navigation.panelMode === "ai" ? "bg-zinc-950 text-stone-100" : "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"}
    `}>
      {/* Drawer Header */}
      <div className={`px-5 py-4 border-b flex items-center justify-between
        ${navigation.panelMode === "ai" ? "border-zinc-800" : "border-stone-100 dark:border-stone-800"}
      `}>
        <div className="flex items-center gap-2">
          <ShoppingBag className={`w-5 h-5 ${navigation.panelMode === "ai" ? "text-emerald-400" : "text-emerald-600 dark:text-emerald-400"}`} />
          <h3 className={`font-bold ${navigation.panelMode === "ai" ? "text-stone-50" : "text-stone-900 dark:text-stone-50"}`}>
            Action Panel
          </h3>
        </div>
        <button
          onClick={onClose}
          className={`p-1.5 rounded-xl transition-colors
            ${navigation.panelMode === "ai" ? "hover:bg-zinc-800 text-stone-400 hover:text-stone-200" : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600"}
          `}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Mode Toggle Ribbon */}
      <div className={`flex p-1 gap-1 border-b text-xs font-bold uppercase tracking-wider
        ${navigation.panelMode === "ai" ? "bg-zinc-900 border-zinc-800" : "bg-stone-50 dark:bg-stone-950/20 border-stone-100 dark:border-stone-800"}
      `}>
        <button
          onClick={() => navigation.setPanelMode("ai")}
          className={`flex-1 py-2 text-center rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5
            ${navigation.panelMode === "ai"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
              : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            }
          `}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Live AI Co-Pilot
        </button>
        <button
          onClick={() => navigation.setPanelMode("manual")}
          className={`flex-1 py-2 text-center rounded-lg transition-all duration-200
            ${navigation.panelMode === "manual"
              ? "bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700"
              : "text-stone-400 hover:text-zinc-400 dark:hover:text-stone-300"
            }
          `}
        >
          Manual Form
        </button>
      </div>

      {/* Manual Tabs (Only visible when Manual mode selected) */}
      {navigation.panelMode === "manual" && (
        <div className="flex border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/20 text-[10px] font-bold uppercase tracking-wider">
          <button
            onClick={() => navigation.setActiveTab("client")}
            className={`flex-1 py-2.5 text-center border-b-2 transition-all ${
              navigation.activeTab === "client"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            New Client
          </button>
          <button
            onClick={() => navigation.setActiveTab("catalog")}
            className={`flex-1 py-2.5 text-center border-b-2 transition-all ${
              navigation.activeTab === "catalog"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            Catalog
          </button>
          <button
            onClick={() => navigation.setActiveTab("order")}
            className={`flex-1 py-2.5 text-center border-b-2 transition-all ${
              navigation.activeTab === "order"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            Draft Order ({draft.orderItems.length})
          </button>
        </div>
      )}

      {/* Drawer Body content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Success/Error Alerts */}
        {feedback.successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-semibold text-emerald-400 flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback.successMsg}</span>
          </div>
        )}

        {feedback.errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-semibold text-red-400 flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{feedback.errorMsg}</span>
          </div>
        )}

        {navigation.panelMode === "ai" && (
          <LiveAiCoPilotTab
            editedClient={aiCopilot.editedClient}
            setEditedClient={aiCopilot.setEditedClient}
            editingField={aiCopilot.editingField}
            setEditingField={aiCopilot.setEditingField}
            selectedClientId={draft.selectedClientId}
            cartItems={aiCopilot.cartItems}
            handleUpdateLiveQty={aiCopilot.updateCartQty}
            handleRemoveLiveItem={aiCopilot.removeCartItem}
            deliveryType={delivery.deliveryType}
            setDeliveryType={delivery.setDeliveryType}
            selectedZoneIndex={delivery.selectedZoneIndex}
            setSelectedZoneIndex={delivery.setSelectedZoneIndex}
            deliveryCost={delivery.deliveryCost}
            aiSubtotal={aiCopilot.aiSubtotal}
            aiFinalTotal={aiFinalTotal}
            handleSyncAll={logic.handleSyncAll}
            syncing={aiCopilot.syncing}
          />
        )}

        {navigation.panelMode === "manual" && (
          <>
            {navigation.activeTab === "client" && (
              <NewClientTab
                whatsappId={whatsappId}
                onSuccess={feedback.showSuccess}
                onError={feedback.showError}
                refetchClients={data.refetchClients}
              />
            )}

            {navigation.activeTab === "catalog" && (
              <CatalogTab
                products={data.products}
                productsLoading={data.productsLoading}
                onAddProduct={draft.addProduct}
              />
            )}

            {navigation.activeTab === "order" && (
              <DraftOrderTab
                clients={data.clients}
                selectedClientId={draft.selectedClientId}
                setSelectedClientId={draft.setSelectedClientId}
                orderItems={draft.orderItems}
                onUpdateItemQty={draft.updateQty}
                onRemoveOrderItem={draft.removeItem}
                deliveryType={delivery.deliveryType}
                setDeliveryType={delivery.setDeliveryType}
                selectedZoneIndex={delivery.selectedZoneIndex}
                setSelectedZoneIndex={delivery.setSelectedZoneIndex}
                customLat={delivery.customLat}
                setCustomLat={delivery.setCustomLat}
                customLng={delivery.customLng}
                setCustomLng={delivery.setCustomLng}
                deliveryCost={delivery.deliveryCost}
                deliveryAddress={delivery.deliveryAddress}
                setDeliveryAddress={delivery.setDeliveryAddress}
                subtotal={draft.draftSubtotal}
                total={draftFinalTotal}
                submitting={draft.submitting}
                onSubmit={logic.handleSubmitDraft}
              />
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default ActionPanelDrawer;
