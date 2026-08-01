import React from "react";
import { Loader2 } from "lucide-react";
import { DeliveryMethod } from "@shared-domain/delivery/delivery.entity";
import type {
  LiveCartItem,
  LiveEditableField,
  LiveEditedClient,
} from "./LiveAiCoPilotTab.types";
import {
  CalculationsPanel,
  DeliverySection,
  ExtractedClientCard,
  LiveCartTable,
  LiveCoPilotHeader,
} from "./LiveAiCoPilotTab.parts";

export type { LiveCartItem, LiveEditedClient, LiveEditableField };

export interface LiveAiCoPilotTabProps {
  editedClient: LiveEditedClient;
  setEditedClient: React.Dispatch<React.SetStateAction<LiveEditedClient>>;
  editingField: LiveEditableField | null;
  setEditingField: React.Dispatch<React.SetStateAction<LiveEditableField | null>>;
  selectedClientId: string;
  cartItems: LiveCartItem[];
  handleUpdateLiveQty: (productId: string, delta: number) => void;
  handleRemoveLiveItem: (productId: string) => void;
  deliveryType: DeliveryMethod;
  setDeliveryType: (type: DeliveryMethod) => void;
  selectedZoneIndex: number;
  setSelectedZoneIndex: (index: number) => void;
  deliveryCost: number;
  aiSubtotal: number;
  aiFinalTotal: number;
  handleSyncAll: () => void;
  syncing: boolean;
}

export const LiveAiCoPilotTab: React.FC<LiveAiCoPilotTabProps> = ({
  editedClient,
  setEditedClient,
  editingField,
  setEditingField,
  selectedClientId,
  cartItems,
  handleUpdateLiveQty,
  handleRemoveLiveItem,
  deliveryType,
  setDeliveryType,
  selectedZoneIndex,
  setSelectedZoneIndex,
  deliveryCost,
  aiSubtotal,
  aiFinalTotal,
  handleSyncAll,
  syncing,
}) => {
  const showShipping = deliveryType === DeliveryMethod.DELIVERY;

  return (
    <div className="space-y-6">
      <LiveCoPilotHeader />

      <ExtractedClientCard
        editedClient={editedClient}
        setEditedClient={setEditedClient}
        editingField={editingField}
        setEditingField={setEditingField}
        hasCrmMatch={Boolean(selectedClientId)}
      />

      <div className="space-y-3">
        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
          <span>Live Shopping Cart</span>
          <span className="text-[10px] font-mono text-zinc-500">{cartItems.length} items</span>
        </h4>
        <LiveCartTable
          cartItems={cartItems}
          handleUpdateLiveQty={handleUpdateLiveQty}
          handleRemoveLiveItem={handleRemoveLiveItem}
        />
      </div>

      <DeliverySection
        deliveryType={deliveryType}
        setDeliveryType={setDeliveryType}
        selectedZoneIndex={selectedZoneIndex}
        setSelectedZoneIndex={setSelectedZoneIndex}
      />

      <CalculationsPanel
        aiSubtotal={aiSubtotal}
        deliveryCost={deliveryCost}
        aiFinalTotal={aiFinalTotal}
        showShipping={showShipping}
      />

      <button
        onClick={handleSyncAll}
        disabled={syncing || cartItems.length === 0}
        className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-zinc-950 font-black rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-40"
      >
        {syncing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Syncing & Creating CRM Records...
          </>
        ) : (
          <>⚡️ Sync & Register in CRM</>
        )}
      </button>
    </div>
  );
};
