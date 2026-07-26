import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Settings2 } from 'lucide-react';
import { IAccount } from '@shared-domain/financial/account.entity.js';

interface SortableAccountCardProps {
  account: IAccount;
  isSelected: boolean;
  activeRate: number;
  isDayClosed: boolean;
  onSelectAccount: (id: string) => void;
  onOpenTxDrawer: (acc: IAccount, e?: React.MouseEvent) => void;
  onOpenAdjustModal: (acc: IAccount, e?: React.MouseEvent) => void;
}

export const SortableAccountCard: React.FC<SortableAccountCardProps> = ({
  account,
  isSelected,
  activeRate,
  isDayClosed,
  onSelectAccount,
  onOpenTxDrawer,
  onOpenAdjustModal,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: account.id?.toString() || '' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: isDragging ? 'relative' as const : 'static' as const,
  };

  const currency = account.currency.toString();
  const balance = account.balance;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelectAccount(account.id!.toString())}
      {...attributes}
      {...listeners}
      className={`group cursor-grab active:cursor-grabbing bg-white dark:bg-stone-900 border p-5 rounded-2xl flex flex-col justify-between h-40 relative ${
        isDragging ? 'shadow-xl ring-2 ring-emerald-500/50 opacity-90' : 'shadow-sm transition-all'
      } ${
        isSelected && !isDragging
          ? 'border-emerald-600 ring-2 ring-emerald-500/20'
          : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 transition-colors">
            {account.name.toString()}
          </h4>
          <span className={`inline-flex items-center px-2 py-0.5 mt-1 text-[10px] font-bold uppercase rounded-md ${
            currency === 'USD'
              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
              : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400'
          }`}>
            {currency}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Adjust Account action */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenAdjustModal(account, e);
            }}
            disabled={isDayClosed}
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking button
            className="inline-flex items-center justify-center p-1.5 bg-stone-50 dark:bg-stone-950 text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-stone-200 dark:border-stone-800 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-stone-500"
            title="Adjust Account"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          {/* Record cashflow action */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenTxDrawer(account, e);
            }}
            disabled={isDayClosed}
            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking button
            className="inline-flex items-center justify-center p-1.5 bg-stone-50 dark:bg-stone-950 text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-stone-200 dark:border-stone-800 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-stone-500"
            title="Record Ledger Transaction"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <span className="block text-[11px] text-stone-400 dark:text-stone-500 uppercase font-medium tracking-wider">
          Balance
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-stone-950 dark:text-stone-50">
            {currency === 'USD' ? '$' : 'Bs.'}
            {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-stone-400 uppercase font-bold">{currency}</span>
        </div>

        {/* Show converted USD equivalent for VES account */}
        {currency === 'VES' && (
          <span className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
            ≈ ${(balance / activeRate).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
          </span>
        )}
      </div>
    </div>
  );
};
