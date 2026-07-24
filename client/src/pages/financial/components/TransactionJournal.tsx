import React, { Fragment } from 'react';
import { Wallet, Search, FileText, Lock, Trash2 } from 'lucide-react';
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
  onDeleteTransaction,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2.5">
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
          <FileText className="w-5 h-5 text-emerald-600" />
          Transaction Journal Ledger
        </h3>
      </div>

      {!selectedAccount ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-12 rounded-3xl text-center space-y-3 shadow-sm">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <h4 className="font-bold text-stone-900 dark:text-stone-100">No Account Selected</h4>
            <p className="text-sm text-stone-400 dark:text-stone-500 mt-1">
              Select an account from the top panel to inspect its historical ledger journal.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-2 border-b border-stone-100 dark:border-stone-850 bg-stone-50/50 dark:bg-stone-950/50">
            <div className="relative flex items-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl transition-all focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500/50 shadow-sm">
              <Search className="absolute left-3 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search transactions..."
                className="w-full bg-transparent border-none focus:ring-0 text-sm py-2.5 pl-9 pr-4 text-stone-900 dark:text-stone-100 placeholder-stone-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 bg-stone-50/50 dark:bg-stone-950/50">
                  <th className="px-5 py-3 font-medium">Details</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium text-right">Virtual USD</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-850">
                {(() => {
                  const filteredTxs = transactions.filter((tx) => {
                    if (tx.date.toString() !== selectedDate) {
                      return false;
                    }
                    const q = searchQuery.toLowerCase();
                    if (!q) return true;
                    return (
                      tx.description.toString().toLowerCase().includes(q) ||
                      (tx.sourceReferenceId && tx.sourceReferenceId.toString().toLowerCase().includes(q))
                    );
                  });

                  if (filteredTxs.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} className="px-4 py-16 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-stone-50 dark:bg-stone-800/50 flex items-center justify-center mb-1">
                              <Search className="w-5 h-5 text-stone-400" />
                            </div>
                            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">No transactions found</p>
                            <p className="text-xs text-stone-500 dark:text-stone-400">Try adjusting your search criteria.</p>
                          </div>
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
                      <tr
                        key={tx.id?.toString()}
                        className="hover:bg-stone-50/80 dark:hover:bg-stone-950/50 transition-colors group"
                      >
                        <td className="px-5 py-4 space-y-1">
                          <div className="font-semibold text-stone-900 dark:text-stone-100">
                            {tx.description.toString()}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                            <span>{tx.date.toString()}</span>
                            {tx.sourceReferenceId && (
                              <Fragment>
                                <span>•</span>
                                <span className="font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-1.5 py-0.5 rounded-md">
                                  Ref: {tx.sourceReferenceId.toString()}
                                </span>
                              </Fragment>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isCredit
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                                : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                            }`}
                          >
                            {isCredit ? 'Income' : 'Expense'}
                          </span>
                        </td>
                        <td
                          className={`px-5 py-4 text-right font-semibold ${
                            isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-900 dark:text-stone-100'
                          }`}
                        >
                          {isCredit ? '+' : '-'}
                          {currency === 'USD' ? '$' : 'Bs.'}
                          {amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-4 text-right text-stone-500 dark:text-stone-400 font-medium">
                          ${virtualUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            {!isDayClosed ? (
                              <button
                                onClick={() => onDeleteTransaction(tx.id!.toString())}
                                className="text-stone-400 hover:text-red-600 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors cursor-pointer"
                                title="Delete Transaction"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span
                                className="text-stone-400 dark:text-stone-600 cursor-not-allowed p-1.5"
                                title="Day is closed"
                              >
                                <Lock className="w-4 h-4" />
                              </span>
                            )}
                          </div>
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
