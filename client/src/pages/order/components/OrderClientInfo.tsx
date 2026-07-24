import { User } from 'lucide-react';

interface OrderClientInfoProps {
  clientId: string;
  clientName: string;
  clientAddress: string;
  customDeliveryAddress?: string | null;
}

export const OrderClientInfo = ({
  clientId,
  clientName,
  clientAddress,
  customDeliveryAddress,
}: OrderClientInfoProps) => {
  return (
    <div className="bg-stone-50 dark:bg-stone-950/30 border border-stone-100 dark:border-stone-800 p-4 rounded-xl flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-sm font-semibold text-stone-700 dark:text-stone-300">
          <User className="w-5 h-5 text-stone-500" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            {clientName}
          </h4>
          <p className="text-xs text-stone-500 dark:text-stone-400">Client ID: {clientId}</p>
        </div>
      </div>
      {(customDeliveryAddress || clientAddress) && (
        <div className="border-t border-stone-200/55 dark:border-stone-800/60 pt-3 text-xs text-stone-600 dark:text-stone-400">
          <span className="font-bold block text-[10px] uppercase text-stone-400 tracking-wider mb-1">
            Delivery Address:
          </span>
          <span className="font-medium">{customDeliveryAddress || clientAddress}</span>
          {customDeliveryAddress && (
            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">
              Custom Address
            </span>
          )}
        </div>
      )}
    </div>
  );
};
