import React, { Fragment } from 'react';
import { Plus, Wallet, Search, FileText, Lock, Trash2 } from 'lucide-react';
import { IAccount } from '@shared-domain/financial/account.entity.js';
import { ITransaction } from '@shared-domain/financial/transaction.entity.js';

interface TransactionJournalProps {
  selectedAccount: IAccount | undefined;
  transactions: ITransaction[];
  selectedDate: string;
  activeRate: number;
  isDayClosed: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddTransaction: (acc: IAccount, e?: React.MouseEvent) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionJournal: React.FC<TransactionJournalProps> = ({
  selectedAccount,
  transactions,
  selectedDate,
  activeRate,
  isDayClosed,
  searchQuery,
  onSearchChange,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2.5">
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
          <FileText className="w-5 h-5 text-emerald-600" />
          Transaction Journal Ledger
        </h3>
        {selectedAccount && (
          <button
            onClick={(e) => onAddTransaction(selectedAccount, e)}
            disabled={isDayClosed}
            className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Transaction
          </button>
        )}
      </div>

      {!selectedAccount ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-12 rounded-3xl text-center space-y-3 shadow-sm">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-bold text-stone-900 dark:text-stone-100">
              No Account Selected
            </h4>
            <p className="text-sm text-stone-400 dark:text-stone-500 mt-1">
              Select an account from the top panel to inspect its historical ledger journal.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-stone-150 dark:border-stone-850 flex items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-stone-400 dark:text-stone-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search transactions..."
                className="block w-full pl-9 pr-3 py-2 text-xs bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-stone-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-950 border-b border-stone-150 dark:border-stone-850 text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Virtual USD</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-850 font-medium">
                {(() => {
                  const filteredTxs = transactions.filter((tx) => {
                    if (tx.date.toString() !== selectedDate) {
                      return false;
                    }
                    const q = searchQuery.toLowerCase();
                    if (!q) return true;
                    return (
                      tx.description.toString().toLowerCase().includes(q) ||
                      (tx.referenceId && tx.referenceId.toString().toLowerCase().includes(q))
                    );
                  });

                  if (filteredTxs.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-stone-400 dark:text-stone-500">
                          No transactions found matching criteria.
                        </td>
                      </tr>
                    );
                  }

                  return filteredTxs.map((tx) => {
                    const isCredit = tx.type === 'CREDIT';
                    const currency = tx.currency.toString();
                    const amount = tx.amount;
                    
                    const rateAtTx = tx.amount / activeRate;
                    const virtualUsd = currency === 'USD' ? amount : rateAtTx;

                    return (
                      <tr key={tx.id?.toString()} className="hover:bg-stone-50/50 dark:hover:bg-stone-950/30 transition-colors">
                        <td className="px-4 py-3.5 space-y-1">
                          <div className="font-bold text-stone-850 dark:text-stone-150">
                            {tx.description.toString()}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-stone-400 dark:text-stone-500">
                            <span>Date: {tx.date.toString()}</span>
                            {tx.referenceId && (
                              <Fragment>
                                <span>•</span>
                                <span className="font-semibold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-1.5 py-0.5 rounded">Ref: {tx.referenceId.toString()}</span>
                              </Fragment>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isCredit
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30'
                              : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30'
                          }`}>
                            {isCredit ? 'INCOME' : 'EXPENSE'}
                          </span>
                        </td>
                        <td className={`px-4 py-3.5 text-right font-extrabold text-sm ${
                          isCredit ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {isCredit ? '+' : '-'}
                          {currency === 'USD' ? '$' : 'Bs.'}
                          {amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 text-right text-stone-500 dark:text-stone-400 font-semibold">
                          ${virtualUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {!isDayClosed ? (
                            <button
                              onClick={() => onDeleteTransaction(tx.id!.toString())}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                              title="Delete Transaction"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          ) : (
                            <span className="text-stone-400 dark:text-stone-600 cursor-not-allowed" title="Day is closed">
                              <Lock className="w-3.5 h-3.5 inline" />
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
