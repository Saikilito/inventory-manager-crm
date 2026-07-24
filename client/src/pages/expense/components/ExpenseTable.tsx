import React, { Fragment } from 'react';
import { match } from 'ts-pattern';
import { Edit2, Trash2 } from 'lucide-react';
import { ExpenseState, ExpenseStateKind } from '@modules/expense/presentation/ploc/expense-state';
import { IExpense } from '@shared-domain/expense/expense.entity';
import { Paginator } from '@components/Paginator';
import Spinkit from '@components/Spinkit';

interface ExpenseTableProps {
  state: ExpenseState;
  searchQuery: string;
  startDate: string;
  endDate: string;
  getCategoryBadgeClass: (cat: string) => string;
  getCategoryLabel: (cat: string) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string | number | Date) => string;
  onEdit: (expense: IExpense) => void;
  onDelete: (id: string, description: string) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  state,
  searchQuery,
  startDate,
  endDate,
  getCategoryBadgeClass,
  getCategoryLabel,
  formatCurrency,
  formatDate,
  onEdit,
  onDelete,
  onPrevPage,
  onNextPage,
}) => {
  return match(state)
    .with({ kind: ExpenseStateKind.LOADING }, () => (
      <div className="flex justify-center py-12">
        <Spinkit />
      </div>
    ))
    .with({ kind: ExpenseStateKind.ERROR }, (st) => (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4 rounded-xl text-center text-sm font-medium text-red-800 dark:text-red-300">
        <b>Error:</b> {st.errorMessage || 'Failed to load expenses'}
      </div>
    ))
    .with({ kind: ExpenseStateKind.LOADED }, { kind: ExpenseStateKind.RELOADING }, (st) => {
      const isReloading = st.kind === ExpenseStateKind.RELOADING;

      const filteredItems = st.items.filter((item: IExpense) => {
        const term = searchQuery.toLowerCase();
        const matchesSearch = !term || (item.description || '').toLowerCase().includes(term);
        
        let matchesDate = true;
        if (startDate && item.createdAt) {
          const createdAtNum = Number(item.createdAt);
          const itemDateMs = new Date(isNaN(createdAtNum) ? String(item.createdAt) : createdAtNum).getTime();
          matchesDate = matchesDate && itemDateMs >= new Date(startDate).getTime();
        }
        if (endDate && item.createdAt) {
          const createdAtNum = Number(item.createdAt);
          const itemDateMs = new Date(isNaN(createdAtNum) ? String(item.createdAt) : createdAtNum).getTime();
          matchesDate = matchesDate && itemDateMs <= new Date(endDate).getTime();
        }
        
        return matchesSearch && matchesDate;
      });

      return (
        <Fragment>
          <div className="relative min-h-[150px]">
            {isReloading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px] bg-white/40 dark:bg-black/30 rounded-xl">
                <Spinkit />
              </div>
            )}

            {filteredItems.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
                <p className="text-stone-500 dark:text-stone-400">
                  {searchQuery ? 'No expenses found matching the search.' : 'No registered expenses found.'}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-stone-200 dark:divide-stone-800/60">
                    <thead className="bg-stone-50 dark:bg-stone-950/50">
                      <tr>
                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Description</th>
                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Category</th>
                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Context</th>
                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-6 py-3.5 text-right text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800/40 bg-white dark:bg-stone-900">
                      {filteredItems.map((item: IExpense) => {
                        const id = String(item.id);
                        const contextName = item.contextId ? contextMap.get(String(item.contextId)) || 'Loading...' : 'General';
                        
                        const isFixed = item.referenceType === 'FIXED_EXPENSE';
                        const typeLabel = isFixed ? 'Fixed' : 'Variable';
                        const typeBadgeClass = isFixed 
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50'
                          : 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700';

                        return (
                          <tr key={id} className="hover:bg-stone-50/50 dark:hover:bg-stone-950/20 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-stone-900 dark:text-stone-100">{item.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCategoryBadgeClass(String(item.category))}`}>
                                {getCategoryLabel(String(item.category))}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500 dark:text-stone-400 font-medium">{contextName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${typeBadgeClass}`}>
                                {typeLabel}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-stone-500 dark:text-stone-400">{formatDate(String(item.createdAt))}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-stone-900 dark:text-stone-50 text-right">{formatCurrency(Number(item.amount))}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => onEdit(item)}
                                  className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 focus:outline-none"
                                  title="Edit Expense"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onDelete(id, String(item.description))}
                                  className="p-1 text-rose-400 hover:text-rose-600 transition-colors focus:outline-none"
                                  title="Delete Expense"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            <Paginator
              currentPage={st.currentPage}
              totalItems={st.total}
              pageSize={st.limit}
              onPrevPage={onPrevPage}
              onNextPage={onNextPage}
            />
          </div>
        </Fragment>
      );
    })
    .exhaustive();
};
