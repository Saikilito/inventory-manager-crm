import React from "react";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@utils/formatters";
import { calculateDistance, DEFAULT_ORIGIN_LAT, DEFAULT_ORIGIN_LNG } from "@shared-domain/delivery/delivery-calculator";
import { CARACAS_ZONES } from "./DraftOrderTab";

interface LiveAiCoPilotTabProps {
  editedClient: {
    firstName: string;
    lastName: string;
    nationalId: string;
    address: string;
  };
  setEditedClient: React.Dispatch<React.SetStateAction<{
    firstName: string;
    lastName: string;
    nationalId: string;
    address: string;
  }>>;
  editingField: "firstName" | "lastName" | "nationalId" | "address" | null;
  setEditingField: React.Dispatch<React.SetStateAction<"firstName" | "lastName" | "nationalId" | "address" | null>>;
  selectedClientId: string;
  cartItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  handleUpdateLiveQty: (productId: string, delta: number) => void;
  handleRemoveLiveItem: (productId: string) => void;
  deliveryType: "pickup" | "delivery";
  setDeliveryType: (type: "pickup" | "delivery") => void;
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
  return (
    <div className="space-y-6">
      {/* Visual Pulse Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)] animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          LIVE AI CO-PILOT
        </span>
        <span className="text-[10px] font-mono text-zinc-500">Gemini Extraction v1.5</span>
      </div>

      {/* Real-time CRM Client Card (Checklist) */}
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3 shadow-inner">
        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
          <span>Extracted Client Info</span>
          {selectedClientId && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md border border-emerald-500/30">
              CRM MATCH
            </span>
          )}
        </h4>

        {/* Field 1: First Name */}
        <div className="border-b border-zinc-800 pb-2">
          {editingField === "firstName" ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={editedClient.firstName}
                onChange={(e) => setEditedClient({ ...editedClient, firstName: e.target.value })}
                className="bg-zinc-800 text-stone-100 text-xs border-b border-emerald-500 focus:outline-none py-1 px-2 flex-1 rounded-md"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="text-[10px] text-emerald-400 font-bold hover:text-emerald-300"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {editedClient.firstName ? (
                  <span className="text-emerald-500 text-xs">✅</span>
                ) : (
                  <span className="text-stone-600 font-mono text-xs">[--]</span>
                )}
                <span className="text-xs text-stone-400">First:</span>
                <span className="text-xs font-bold text-stone-200 truncate">
                  {editedClient.firstName || <span className="text-zinc-600 italic">Extracting Juan...</span>}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingField("firstName")}
                className="text-[10px] text-stone-500 hover:text-stone-300 font-mono"
              >
                [Edit]
              </button>
            </div>
          )}
        </div>

        {/* Field 2: Last Name */}
        <div className="border-b border-zinc-800 pb-2">
          {editingField === "lastName" ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={editedClient.lastName}
                onChange={(e) => setEditedClient({ ...editedClient, lastName: e.target.value })}
                className="bg-zinc-800 text-stone-100 text-xs border-b border-emerald-500 focus:outline-none py-1 px-2 flex-1 rounded-md"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="text-[10px] text-emerald-400 font-bold hover:text-emerald-300"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {editedClient.lastName ? (
                  <span className="text-emerald-500 text-xs">✅</span>
                ) : (
                  <span className="text-stone-600 font-mono text-xs">[--]</span>
                )}
                <span className="text-xs text-stone-400">Last:</span>
                <span className="text-xs font-bold text-stone-200 truncate">
                  {editedClient.lastName || <span className="text-zinc-600 italic">Extracting Pérez...</span>}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingField("lastName")}
                className="text-[10px] text-stone-500 hover:text-stone-300 font-mono"
              >
                [Edit]
              </button>
            </div>
          )}
        </div>

        {/* Field 3: DNI / National ID */}
        <div className="border-b border-zinc-800 pb-2">
          {editingField === "nationalId" ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={editedClient.nationalId}
                onChange={(e) => setEditedClient({ ...editedClient, nationalId: e.target.value })}
                className="bg-zinc-800 text-stone-100 text-xs border-b border-emerald-500 focus:outline-none py-1 px-2 flex-1 rounded-md"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="text-[10px] text-emerald-400 font-bold hover:text-emerald-300"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {editedClient.nationalId ? (
                  <span className="text-emerald-500 text-xs">✅</span>
                ) : (
                  <span className="text-stone-600 font-mono text-xs">[--]</span>
                )}
                <span className="text-xs text-stone-400">DNI:</span>
                <span className="text-xs font-bold text-stone-200 truncate">
                  {editedClient.nationalId || <span className="text-zinc-600 italic">Extracting V-123...</span>}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingField("nationalId")}
                className="text-[10px] text-stone-500 hover:text-stone-300 font-mono"
              >
                [Edit]
              </button>
            </div>
          )}
        </div>

        {/* Field 4: Address */}
        <div>
          {editingField === "address" ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={editedClient.address}
                onChange={(e) => setEditedClient({ ...editedClient, address: e.target.value })}
                className="bg-zinc-800 text-stone-100 text-xs border-b border-emerald-500 focus:outline-none py-1 px-2 flex-1 rounded-md"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="text-[10px] text-emerald-400 font-bold hover:text-emerald-300"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {editedClient.address ? (
                  <span className="text-emerald-500 text-xs">✅</span>
                ) : (
                  <span className="text-stone-600 font-mono text-xs">[--]</span>
                )}
                <span className="text-xs text-stone-400">Address:</span>
                <span className="text-xs font-bold text-stone-200 truncate max-w-[120px]">
                  {editedClient.address || <span className="text-zinc-600 italic">Extracting address...</span>}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingField("address")}
                className="text-[10px] text-stone-500 hover:text-stone-300 font-mono"
              >
                [Edit]
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Extracted Live Shopping Cart */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
          <span>Live Shopping Cart</span>
          <span className="text-[10px] font-mono text-zinc-500">{cartItems.length} items</span>
        </h4>

        {cartItems.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl">
            <p className="text-xs text-zinc-600 font-semibold italic">Waiting for client order details...</p>
          </div>
        ) : (
          <div className="border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800 bg-zinc-900/30">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-900 text-zinc-500 font-black uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <th className="p-2.5">Product</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Price</th>
                  <th className="p-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {cartItems.map((item) => (
                  <tr key={item.productId} className="hover:bg-zinc-900/40">
                    <td className="p-2.5 font-semibold text-stone-200 truncate max-w-[120px]">
                      {item.productName}
                    </td>
                    <td className="p-2.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateLiveQty(item.productId, -1)}
                          className="p-0.5 hover:bg-zinc-800 rounded text-stone-400"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold text-stone-200">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateLiveQty(item.productId, 1)}
                          className="p-0.5 hover:bg-zinc-800 rounded text-stone-400"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLiveItem(item.productId)}
                        className="text-red-400 hover:text-red-300 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delivery Type Option inside AI Panel */}
      <div className="flex items-center justify-between py-1.5 border-t border-b border-zinc-850">
        <label className="text-xs font-bold text-stone-400 uppercase">
          Delivery Method
        </label>
        <div className="flex bg-zinc-900 p-0.5 rounded-lg text-xs font-bold border border-zinc-800">
          <button
            type="button"
            onClick={() => setDeliveryType("pickup")}
            className={`px-3 py-1 rounded-md transition-colors ${
              deliveryType === "pickup"
                ? "bg-emerald-500/10 text-emerald-400 shadow-sm"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            Pickup
          </button>
          <button
            type="button"
            onClick={() => setDeliveryType("delivery")}
            className={`px-3 py-1 rounded-md transition-colors ${
              deliveryType === "delivery"
                ? "bg-emerald-500/10 text-emerald-400 shadow-sm"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            Delivery
          </button>
        </div>
      </div>

      {deliveryType === "delivery" && (
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3 animate-[fadeIn_0.2s_ease-out]">
          <div>
            <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">
              Caracas Delivery Zone
            </label>
            <select
              value={selectedZoneIndex}
              onChange={(e) => setSelectedZoneIndex(parseInt(e.target.value))}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold focus:outline-none text-stone-200"
            >
              {CARACAS_ZONES.map((zone, i) => (
                <option key={zone.name} value={i}>
                  {zone.name} {zone.name !== "Custom Coordinates" ? `(${calculateDistance(DEFAULT_ORIGIN_LAT, DEFAULT_ORIGIN_LNG, zone.lat, zone.lng).toFixed(1)} km)` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Calculations Monospace High Precision Panel */}
      <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
        <pre className="font-mono text-xs tabular-nums text-right text-stone-300">
{`SUBTOTAL:  ${formatCurrency(aiSubtotal).padStart(10)}
SHIPPING:  ${formatCurrency(deliveryType === "delivery" ? deliveryCost : 0).padStart(10)}
------------------------
TOTAL:     ${formatCurrency(aiFinalTotal).padStart(10)}`}
        </pre>
      </div>

      {/* Sync 1-Click Sync & Register CTA */}
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
          <>
            ⚡️ Sync & Register in CRM
          </>
        )}
      </button>
    </div>
  );
};
