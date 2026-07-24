import React from 'react';
import { Plus, Wallet } from 'lucide-react';
import { IAccount } from '@shared-domain/financial/account.entity.js';

interface AccountsOverviewProps {
  accounts: IAccount[];
  selectedAccountId: string | null;
  activeRate: number;
  isDayClosed: boolean;
  onSelectAccount: (id: string) => void;
  onOpenTxDrawer: (acc: IAccount, e?: React.MouseEvent) => void;
}

export const AccountsOverview: React.FC<AccountsOverviewProps> = ({
  accounts,
  selectedAccountId,
  activeRate,
  isDayClosed,
  onSelectAccount,
  onOpenTxDrawer,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
          <Wallet className="w-5 h-5 text-emerald-600" />
          Monodivisa Accounts
        </h3>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 rounded-2xl text-center text-sm text-stone-500">
          No financial accounts registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {accounts.map((acc) => {
            const isSelected = selectedAccountId === acc.id?.toString();
            const currency = acc.currency.toString();
            const balance = acc.balance;

            return (
              <div
                key={acc.id?.toString()}
                onClick={() => onSelectAccount(acc.id!.toString())}
                className={`group cursor-pointer bg-white dark:bg-stone-900 border p-5 rounded-2xl transition-all flex flex-col justify-between h-40 shadow-sm relative ${
                  isSelected
                    ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 transition-colors">
                      {acc.name.toString()}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-0.5 mt-1 text-[10px] font-bold uppercase rounded-md ${
                      currency === 'USD'
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                        : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400'
                    }`}>
                      {currency}
                    </span>
                  </div>
                  
                  {/* Record cashflow action */}
                  <button
                    onClick={(e) => onOpenTxDrawer(acc, e)}
                    disabled={isDayClosed}
                    className="inline-flex items-center justify-center p-1.5 bg-stone-50 dark:bg-stone-950 text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-stone-200 dark:border-stone-800 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-stone-500"
                    title="Record Ledger Transaction"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
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
          })}
        </div>
      )}
    </div>
  );
};
