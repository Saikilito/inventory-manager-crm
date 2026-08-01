import React from "react";
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { calculateDistance, DEFAULT_ORIGIN_LAT, DEFAULT_ORIGIN_LNG } from "@shared-domain/delivery/delivery-calculator";
import { formatCurrency } from "@utils/formatters";
import { DeliveryMethod } from "@shared-domain/delivery/delivery.entity";
import { CARACAS_ZONES, CUSTOM_ZONE_NAME } from "../../action-panel/delivery-zones";
import type { ActionPanelClient, DraftOrderItem } from "../../action-panel/action-panel.types";

export type { DraftOrderItem as OrderItem } from "../../action-panel/action-panel.types";

interface DraftOrderTabProps {
  clients: ActionPanelClient[];
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  orderItems: DraftOrderItem[];
  onUpdateItemQty: (productId: string, delta: number) => void;
  onRemoveOrderItem: (productId: string) => void;
  deliveryType: DeliveryMethod;
  setDeliveryType: (type: DeliveryMethod) => void;
  selectedZoneIndex: number;
  setSelectedZoneIndex: (index: number) => void;
  customLat: number;
  setCustomLat: (lat: number) => void;
  customLng: number;
  setCustomLng: (lng: number) => void;
  deliveryCost: number;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  subtotal: number;
  total: number;
  submitting: boolean;
  onSubmit: () => void;
}

export const DraftOrderTab: React.FC<DraftOrderTabProps> = ({
  clients,
  selectedClientId,
  setSelectedClientId,
  orderItems,
  onUpdateItemQty,
  onRemoveOrderItem,
  deliveryType,
  setDeliveryType,
  selectedZoneIndex,
  setSelectedZoneIndex,
  customLat,
  setCustomLat,
  customLng,
  setCustomLng,
  deliveryCost,
  deliveryAddress,
  setDeliveryAddress,
  subtotal,
  total,
  submitting,
  onSubmit,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1.5">
          Client (CRM Match)
        </label>
        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">-- Select Client --</option>
          {clients.map((c) => (
            <option key={c._id || c.id} value={c._id || c.id}>
              {c.firstName} {c.lastName} ({c.whatsapp})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase">
          Order Items
        </label>
        {orderItems.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
            <p className="text-xs text-stone-400 font-semibold">No items added to draft yet.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {orderItems.map(({ product, quantity }) => (
              <div
                key={product._id}
                className="p-2.5 bg-stone-50 dark:bg-stone-950/30 border border-stone-100 dark:border-stone-850 rounded-xl flex items-center justify-between"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{product.name}</p>
                  <p className="text-xs text-stone-400 font-bold mt-0.5">{formatCurrency(product.sellingPrice)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateItemQty(product._id, -1)}
                    className="p-1 hover:bg-stone-100 dark:hover:bg-stone-850 rounded-lg text-stone-500"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => onUpdateItemQty(product._id, 1)}
                    className="p-1 hover:bg-stone-100 dark:hover:bg-stone-850 rounded-lg text-stone-500"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveOrderItem(product._id)}
                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 pt-3 border-t border-stone-100 dark:border-stone-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase">
            Delivery Method
          </label>
          <div className="flex bg-stone-100 dark:bg-stone-950 p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setDeliveryType(DeliveryMethod.PICKUP)}
              className={`px-3 py-1 rounded-md transition-colors ${
                deliveryType === DeliveryMethod.PICKUP
                  ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs"
                  : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              }`}
            >
              Pickup
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType(DeliveryMethod.DELIVERY)}
              className={`px-3 py-1 rounded-md transition-colors ${
                deliveryType === DeliveryMethod.DELIVERY
                  ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs"
                  : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              }`}
            >
              Delivery
            </button>
          </div>
        </div>

        {deliveryType === DeliveryMethod.DELIVERY && (
          <div className="space-y-3 animate-[fadeIn_0.2s_ease-out]">
            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">
                Caracas Delivery Zone
              </label>
              <select
                value={selectedZoneIndex}
                onChange={(e) => setSelectedZoneIndex(parseInt(e.target.value))}
                className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CARACAS_ZONES.map((zone, i) => (
                  <option key={zone.name} value={i}>
                    {zone.name} {zone.name !== CUSTOM_ZONE_NAME ? `(${calculateDistance(DEFAULT_ORIGIN_LAT, DEFAULT_ORIGIN_LNG, zone.lat, zone.lng).toFixed(1)} km)` : ""}
                  </option>
                ))}
              </select>
            </div>

            {CARACAS_ZONES[selectedZoneIndex].name === CUSTOM_ZONE_NAME && (
              <div className="grid grid-cols-2 gap-3 animate-[fadeIn_0.2s_ease-out]">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={customLat}
                    onChange={(e) => setCustomLat(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-2 py-1 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase mb-0.5">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={customLng}
                    onChange={(e) => setCustomLng(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-2 py-1 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">
                Delivery Address
              </label>
              <input
                type="text"
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 3rd street house 14 Altamira"
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-stone-50 dark:bg-stone-950/60 rounded-xl space-y-2 border border-stone-100 dark:border-stone-850">
        <div className="flex justify-between text-xs font-semibold text-stone-500 dark:text-stone-400">
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs font-semibold text-stone-500 dark:text-stone-400">
          <span>Shipping Fee:</span>
          <span>{formatCurrency(deliveryCost)}</span>
        </div>
        <div className="flex justify-between text-sm font-black text-stone-900 dark:text-stone-100 pt-2 border-t border-stone-200 dark:border-stone-800">
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || orderItems.length === 0}
        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating draft...
          </>
        ) : (
          <>
            <ShoppingBag className="w-4 h-4" />
            Draft CRM Order
          </>
        )}
      </button>
    </form>
  );
};
