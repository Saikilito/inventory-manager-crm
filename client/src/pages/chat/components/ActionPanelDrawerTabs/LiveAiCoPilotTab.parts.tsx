import React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@utils/formatters";
import { calculateDistance, DEFAULT_ORIGIN_LAT, DEFAULT_ORIGIN_LNG } from "@shared-domain/delivery/delivery-calculator";
import { CARACAS_ZONES } from "./DraftOrderTab";
import type { LiveCartItem, LiveEditableField, LiveEditedClient } from "./LiveAiCoPilotTab.types";

export const LiveCoPilotHeader: React.FC = () => (
  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)] animate-pulse">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      LIVE AI CO-PILOT
    </span>
    <span className="text-[10px] font-mono text-zinc-500">Gemini Extraction v1.5</span>
  </div>
);

const FIELD_META: Record<LiveEditableField, { label: string; placeholder: string }> = {
  firstName: { label: "First:", placeholder: "Extracting Juan..." },
  lastName: { label: "Last:", placeholder: "Extracting Pérez..." },
  nationalId: { label: "DNI:", placeholder: "Extracting V-123..." },
  address: { label: "Address:", placeholder: "Extracting address..." },
};

interface EditableFieldRowProps {
  field: LiveEditableField;
  value: string;
  editing: boolean;
  maxWidth?: string;
  onStartEdit: () => void;
  onCommit: () => void;
  onChange: (next: string) => void;
}

export const EditableFieldRow: React.FC<EditableFieldRowProps> = ({
  field,
  value,
  editing,
  maxWidth,
  onStartEdit,
  onCommit,
  onChange,
}) => {
  const { label, placeholder } = FIELD_META[field];
  const valueClass = maxWidth ?? "truncate";

  return (
    <div className={field === "address" ? "" : "border-b border-zinc-800 pb-2"}>
      {editing ? (
        <div className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-zinc-800 text-stone-100 text-xs border-b border-emerald-500 focus:outline-none py-1 px-2 flex-1 rounded-md"
            autoFocus
          />
          <button
            type="button"
            onClick={onCommit}
            className="text-[10px] text-emerald-400 font-bold hover:text-emerald-300"
          >
            Save
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {value ? (
              <span className="text-emerald-500 text-xs">✅</span>
            ) : (
              <span className="text-stone-600 font-mono text-xs">[--]</span>
            )}
            <span className="text-xs text-stone-400">{label}</span>
            <span className={`text-xs font-bold text-stone-200 ${valueClass}`}>
              {value || <span className="text-zinc-600 italic">{placeholder}</span>}
            </span>
          </div>
          <button
            type="button"
            onClick={onStartEdit}
            className="text-[10px] text-stone-500 hover:text-stone-300 font-mono"
          >
            [Edit]
          </button>
        </div>
      )}
    </div>
  );
};

interface ExtractedClientCardProps {
  editedClient: LiveEditedClient;
  setEditedClient: React.Dispatch<React.SetStateAction<LiveEditedClient>>;
  editingField: LiveEditableField | null;
  setEditingField: React.Dispatch<React.SetStateAction<LiveEditableField | null>>;
  hasCrmMatch: boolean;
}

export const ExtractedClientCard: React.FC<ExtractedClientCardProps> = ({
  editedClient,
  setEditedClient,
  editingField,
  setEditingField,
  hasCrmMatch,
}) => {
  const fields: LiveEditableField[] = ["firstName", "lastName", "nationalId", "address"];
  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3 shadow-inner">
      <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
        <span>Extracted Client Info</span>
        {hasCrmMatch && (
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md border border-emerald-500/30">
            CRM MATCH
          </span>
        )}
      </h4>
      {fields.map((field) => (
        <EditableFieldRow
          key={field}
          field={field}
          value={editedClient[field]}
          editing={editingField === field}
          maxWidth={field === "address" ? "max-w-[120px]" : undefined}
          onStartEdit={() => setEditingField(field)}
          onCommit={() => setEditingField(null)}
          onChange={(next) => setEditedClient({ ...editedClient, [field]: next })}
        />
      ))}
    </div>
  );
};

interface LiveCartTableProps {
  cartItems: LiveCartItem[];
  handleUpdateLiveQty: (productId: string, delta: number) => void;
  handleRemoveLiveItem: (productId: string) => void;
}

export const LiveCartTable: React.FC<LiveCartTableProps> = ({
  cartItems,
  handleUpdateLiveQty,
  handleRemoveLiveItem,
}) => {
  if (cartItems.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl">
        <p className="text-xs text-zinc-600 font-semibold italic">
          Waiting for client order details...
        </p>
      </div>
    );
  }

  return (
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
  );
};

interface DeliverySectionProps {
  deliveryType: "pickup" | "delivery";
  setDeliveryType: (type: "pickup" | "delivery") => void;
  selectedZoneIndex: number;
  setSelectedZoneIndex: (index: number) => void;
}

export const DeliverySection: React.FC<DeliverySectionProps> = ({
  deliveryType,
  setDeliveryType,
  selectedZoneIndex,
  setSelectedZoneIndex,
}) => (
  <>
    <div className="flex items-center justify-between py-1.5 border-t border-b border-zinc-850">
      <label className="text-xs font-bold text-stone-400 uppercase">
        Delivery Method
      </label>
      <div className="flex bg-zinc-900 p-0.5 rounded-lg text-xs font-bold border border-zinc-800">
        {(["pickup", "delivery"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setDeliveryType(option)}
            className={`px-3 py-1 rounded-md transition-colors ${
              deliveryType === option
                ? "bg-emerald-500/10 text-emerald-400 shadow-sm"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            {option === "pickup" ? "Pickup" : "Delivery"}
          </button>
        ))}
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
                {zone.name}{" "}
                {zone.name !== "Custom Coordinates"
                  ? `(${calculateDistance(DEFAULT_ORIGIN_LAT, DEFAULT_ORIGIN_LNG, zone.lat, zone.lng).toFixed(1)} km)`
                  : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
    )}
  </>
);

interface CalculationsPanelProps {
  aiSubtotal: number;
  deliveryCost: number;
  aiFinalTotal: number;
  showShipping: boolean;
}

export const CalculationsPanel: React.FC<CalculationsPanelProps> = ({
  aiSubtotal,
  deliveryCost,
  aiFinalTotal,
  showShipping,
}) => (
  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
    <pre className="font-mono text-xs tabular-nums text-right text-stone-300">
{`SUBTOTAL:  ${formatCurrency(aiSubtotal).padStart(10)}
SHIPPING:  ${formatCurrency(showShipping ? deliveryCost : 0).padStart(10)}
------------------------
TOTAL:     ${formatCurrency(aiFinalTotal).padStart(10)}`}
    </pre>
  </div>
);
