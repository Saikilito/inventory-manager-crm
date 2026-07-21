import React, { useState } from "react";
import { X, UserPlus, ArrowRight, Store } from "lucide-react";
import Select from "react-select";
import { getFullName } from "@utils/formatters";
import { useNavigate } from "react-router-dom";

export interface NewOrderClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Array<any>;
}

export const NewOrderClientModal: React.FC<NewOrderClientModalProps> = ({
  isOpen,
  onClose,
  clients,
}) => {
  const navigate = useNavigate();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  if (!isOpen) return null;

  const clientOptions = clients.map((c) => ({
    value: c._id,
    label: `${getFullName(c)} ${c.nationalId ? `(${c.nationalId})` : ""}`,
  }));

  const handleContinue = () => {
    if (selectedClientId) {
      navigate(`/orders/new/${selectedClientId}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-600" />
              New Order
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Select a client to start generating an order.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer h-11 w-11 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-700 dark:text-stone-300">
              Select Client
            </label>
            <Select
              options={clientOptions}
              onChange={(opt: any) => setSelectedClientId(opt?.value || null)}
              placeholder="Search clients..."
              isClearable
              unstyled
              classNames={{
                control: ({ isFocused }: { isFocused: boolean }) =>
                  `border !rounded-xl !bg-white dark:!bg-stone-950 !min-h-12 px-3 py-1 transition-all ${
                    isFocused
                      ? "!border-emerald-500 !ring-2 !ring-emerald-500/20"
                      : "!border-stone-200 dark:!border-stone-800"
                  }`,
                placeholder: () => "text-stone-400 dark:text-stone-500",
                singleValue: () => "text-stone-900 dark:text-stone-100",
                menu: () =>
                  "bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl shadow-lg mt-2 overflow-hidden z-50",
                menuList: () => "p-1 space-y-0.5 max-h-60 overflow-y-auto",
                option: ({ isFocused, isSelected }: { isFocused: boolean; isSelected: boolean }) =>
                  `rounded-lg px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold"
                      : isFocused
                      ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                      : "text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900"
                  }`,
              }}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => navigate("/clients")}
              className="w-full sm:flex-1 h-11 rounded-xl text-sm font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              New client
            </button>
            <button
              onClick={handleContinue}
              disabled={!selectedClientId}
              className="w-full sm:flex-1 h-11 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
