import React from "react";
import { useMutation } from "@apollo/client";
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { CREATE_ORDER } from "../../../../modules/order/infrastructure/graphql/mutations";
import { calculateDistance, DEFAULT_ORIGIN_LAT, DEFAULT_ORIGIN_LNG } from "@shared-domain/delivery/delivery-calculator";
import { formatCurrency } from "@utils/formatters";

// Defined the same as ActionPanelDrawer
export const CARACAS_ZONES = [
  { name: "Custom Coordinates", lat: DEFAULT_ORIGIN_LAT, lng: DEFAULT_ORIGIN_LNG },
  { name: "Altamira (Close)", lat: 10.496, lng: -66.848 },
  { name: "Las Mercedes (Medium)", lat: 10.484, lng: -66.862 },
  { name: "El Hatillo (Far)", lat: 10.428, lng: -66.825 },
  { name: "Catia", lat: 10.518, lng: -66.945 },
  { name: "Petare", lat: 10.479, lng: -66.795 },
];

export interface OrderItem {
  product: {
    _id: string;
    id?: string;
    name: string;
    price: number;
    sellingPrice: number;
    purchasePrice?: number;
    stock: number;
  };
  quantity: number;
}

interface DraftOrderTabProps {
  clients: Array<{ _id: string; id?: string; firstName: string; lastName: string; whatsapp: string }>;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  orderItems: OrderItem[];
  setOrderItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  deliveryType: "pickup" | "delivery";
  setDeliveryType: (type: "pickup" | "delivery") => void;
  selectedZoneIndex: number;
  setSelectedZoneIndex: (index: number) => void;
  customLat: number;
  setCustomLat: (lat: number) => void;
  customLng: number;
  setCustomLng: (lng: number) => void;
  deliveryCost: number;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const DraftOrderTab: React.FC<DraftOrderTabProps> = ({
  clients,
  selectedClientId,
  setSelectedClientId,
  orderItems,
  setOrderItems,
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
  onSuccess,
  onError,
}) => {
  const [createOrder, { loading: creatingOrder }] = useMutation(CREATE_ORDER);

  const handleUpdateItemQty = (productId: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((item) => {
          if (item.product._id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            return { ...item, quantity: Math.min(nextQty, item.product.stock) };
          }
          return item;
        })
        .filter((item): item is OrderItem => item !== null)
    );
  };

  const handleRemoveOrderItem = (productId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientId) {
      onError("Please select or register a client first.");
      return;
    }
    if (orderItems.length === 0) {
      onError("Order items cannot be empty.");
      return;
    }

    const itemsInput = orderItems.map((item) => ({
      productId: item.product._id,
      quantity: item.quantity,
      sellingPriceAtSale: item.product.sellingPrice,
      purchasePriceAtSale: item.product.purchasePrice || (item.product.sellingPrice * 0.7),
    }));

    const itemsSubtotal = orderItems.reduce(
      (sum, item) => sum + item.quantity * item.product.sellingPrice,
      0
    );

    const totalOrder = itemsSubtotal + deliveryCost;

    try {
      await createOrder({
        variables: {
          input: {
            clientId: selectedClientId,
            items: itemsInput,
            total: totalOrder,
            sellerId: "550e8400-e29b-41d4-a716-446655440003", // Default seller ID
            deliveryCost: deliveryCost,
            deliveryAddress: deliveryType === "delivery" ? deliveryAddress : "PICKUP",
            status: "PENDING",
            paymentStatus: "UNPAID",
            deliveryStatus: deliveryType === "delivery" ? "PENDING" : "DELIVERED",
          },
        },
      });
      onSuccess("Draft Order created successfully!");
      setOrderItems([]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        onError(err.message || "Failed to create order.");
      } else {
        onError("Failed to create order.");
      }
    }
  };

  const manualItemsSubtotal = orderItems.reduce(
    (sum, item) => sum + item.quantity * item.product.sellingPrice,
    0
  );

  const manualFinalTotal = manualItemsSubtotal + deliveryCost;

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
                    onClick={() => handleUpdateItemQty(product._id, -1)}
                    className="p-1 hover:bg-stone-100 dark:hover:bg-stone-850 rounded-lg text-stone-500"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateItemQty(product._id, 1)}
                    className="p-1 hover:bg-stone-100 dark:hover:bg-stone-850 rounded-lg text-stone-500"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveOrderItem(product._id)}
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
              onClick={() => setDeliveryType("pickup")}
              className={`px-3 py-1 rounded-md transition-colors ${
                deliveryType === "pickup"
                  ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs"
                  : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              }`}
            >
              Pickup
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType("delivery")}
              className={`px-3 py-1 rounded-md transition-colors ${
                deliveryType === "delivery"
                  ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs"
                  : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              }`}
            >
              Delivery
            </button>
          </div>
        </div>

        {deliveryType === "delivery" && (
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
                    {zone.name} {zone.name !== "Custom Coordinates" ? `(${calculateDistance(DEFAULT_ORIGIN_LAT, DEFAULT_ORIGIN_LNG, zone.lat, zone.lng).toFixed(1)} km)` : ""}
                  </option>
                ))}
              </select>
            </div>

            {CARACAS_ZONES[selectedZoneIndex].name === "Custom Coordinates" && (
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
          <span>{formatCurrency(manualItemsSubtotal)}</span>
        </div>
        <div className="flex justify-between text-xs font-semibold text-stone-500 dark:text-stone-400">
          <span>Shipping Fee:</span>
          <span>{formatCurrency(deliveryCost)}</span>
        </div>
        <div className="flex justify-between text-sm font-black text-stone-900 dark:text-stone-100 pt-2 border-t border-stone-200 dark:border-stone-800">
          <span>Total:</span>
          <span>{formatCurrency(manualFinalTotal)}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={creatingOrder || orderItems.length === 0}
        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
      >
        {creatingOrder ? (
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
