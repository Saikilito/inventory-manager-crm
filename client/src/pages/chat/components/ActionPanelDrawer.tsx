import React from "react";
import { X, ShoppingBag, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

import { NewClientTab } from "./ActionPanelDrawerTabs/NewClientTab";
import { CatalogTab } from "./ActionPanelDrawerTabs/CatalogTab";
import { DraftOrderTab } from "./ActionPanelDrawerTabs/DraftOrderTab";
import { LiveAiCoPilotTab } from "./ActionPanelDrawerTabs/LiveAiCoPilotTab";
import { useActionPanelLogic } from "./hooks/useActionPanelLogic";

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

  if (!isOpen) return null;

  return (
    <aside className={`w-full h-full border-l border-stone-200 dark:border-stone-800 flex flex-col z-20 shadow-lg animate-[slideInRight_0.3s_ease-out] relative transition-colors duration-300
      ${logic.panelMode === "ai" ? "bg-zinc-950 text-stone-100" : "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"}
    `}>
      {/* Drawer Header */}
      <div className={`px-5 py-4 border-b flex items-center justify-between
        ${logic.panelMode === "ai" ? "border-zinc-800" : "border-stone-100 dark:border-stone-800"}
      `}>
        <div className="flex items-center gap-2">
          <ShoppingBag className={`w-5 h-5 ${logic.panelMode === "ai" ? "text-emerald-400" : "text-emerald-600 dark:text-emerald-400"}`} />
          <h3 className={`font-bold ${logic.panelMode === "ai" ? "text-stone-50" : "text-stone-900 dark:text-stone-50"}`}>
            Action Panel
          </h3>
        </div>
        <button
          onClick={onClose}
          className={`p-1.5 rounded-xl transition-colors
            ${logic.panelMode === "ai" ? "hover:bg-zinc-800 text-stone-400 hover:text-stone-200" : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600"}
          `}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Mode Toggle Ribbon */}
      <div className={`flex p-1 gap-1 border-b text-xs font-bold uppercase tracking-wider
        ${logic.panelMode === "ai" ? "bg-zinc-900 border-zinc-800" : "bg-stone-50 dark:bg-stone-950/20 border-stone-100 dark:border-stone-800"}
      `}>
        <button
          onClick={() => logic.setPanelMode("ai")}
          className={`flex-1 py-2 text-center rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5
            ${logic.panelMode === "ai"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
              : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
            }
          `}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Live AI Co-Pilot
        </button>
        <button
          onClick={() => logic.setPanelMode("manual")}
          className={`flex-1 py-2 text-center rounded-lg transition-all duration-200
            ${logic.panelMode === "manual"
              ? "bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700"
              : "text-stone-400 hover:text-zinc-400 dark:hover:text-stone-300"
            }
          `}
        >
          Manual Form
        </button>
      </div>

      {/* Manual Tabs (Only visible when Manual mode selected) */}
      {logic.panelMode === "manual" && (
        <div className="flex border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/20 text-[10px] font-bold uppercase tracking-wider">
          <button
            onClick={() => logic.setActiveTab("client")}
            className={`flex-1 py-2.5 text-center border-b-2 transition-all ${
              logic.activeTab === "client"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            New Client
          </button>
          <button
            onClick={() => logic.setActiveTab("catalog")}
            className={`flex-1 py-2.5 text-center border-b-2 transition-all ${
              logic.activeTab === "catalog"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            Catalog
          </button>
          <button
            onClick={() => logic.setActiveTab("order")}
            className={`flex-1 py-2.5 text-center border-b-2 transition-all ${
              logic.activeTab === "order"
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            Draft Order ({logic.orderItems.length})
          </button>
        </div>
      )}

      {/* Drawer Body content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Success/Error Alerts */}
        {logic.successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-semibold text-emerald-400 flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{logic.successMsg}</span>
          </div>
        )}

        {logic.errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-semibold text-red-400 flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{logic.errorMsg}</span>
          </div>
        )}

        {logic.panelMode === "ai" && (
          <LiveAiCoPilotTab
            editedClient={logic.editedClient}
            setEditedClient={logic.setEditedClient}
            editingField={logic.editingField}
            setEditingField={logic.setEditingField}
            selectedClientId={logic.selectedClientId}
            cartItems={logic.cartItems}
            handleUpdateLiveQty={logic.handleUpdateLiveQty}
            handleRemoveLiveItem={logic.handleRemoveLiveItem}
            deliveryType={logic.deliveryType}
            setDeliveryType={logic.setDeliveryType}
            selectedZoneIndex={logic.selectedZoneIndex}
            setSelectedZoneIndex={logic.setSelectedZoneIndex}
            deliveryCost={logic.deliveryCost}
            aiSubtotal={logic.aiSubtotal}
            aiFinalTotal={logic.aiFinalTotal}
            handleSyncAll={logic.handleSyncAll}
            syncing={logic.syncing}
          />
        )}

        {logic.panelMode === "manual" && (
          <>
            {logic.activeTab === "client" && (
              <NewClientTab
                whatsappId={whatsappId}
                onSuccess={logic.showSuccess}
                onError={logic.showError}
                refetchClients={logic.refetchClients}
              />
            )}

            {logic.activeTab === "catalog" && (
              <CatalogTab
                products={logic.productsData?.getAllProducts || []}
                productsLoading={logic.productsLoading}
                onAddProduct={(p) => logic.handleAddProductToOrder(p as import("./ActionPanelDrawerTabs/DraftOrderTab").OrderItem["product"])}
              />
            )}

            {logic.activeTab === "order" && (
              <DraftOrderTab
                clients={logic.clientsData?.getAllClients || []}
                selectedClientId={logic.selectedClientId}
                setSelectedClientId={logic.setSelectedClientId}
                orderItems={logic.orderItems}
                setOrderItems={logic.setOrderItems}
                deliveryType={logic.deliveryType}
                setDeliveryType={logic.setDeliveryType}
                selectedZoneIndex={logic.selectedZoneIndex}
                setSelectedZoneIndex={logic.setSelectedZoneIndex}
                customLat={logic.customLat}
                setCustomLat={logic.setCustomLat}
                customLng={logic.customLng}
                setCustomLng={logic.setCustomLng}
                deliveryCost={logic.deliveryCost}
                deliveryAddress={logic.deliveryAddress}
                setDeliveryAddress={logic.setDeliveryAddress}
                onSuccess={logic.showSuccess}
                onError={logic.showError}
              />
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default ActionPanelDrawer;
