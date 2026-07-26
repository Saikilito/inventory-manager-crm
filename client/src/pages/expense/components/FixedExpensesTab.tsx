import React from 'react';
import { Calendar, CheckSquare, Square, Settings, Edit2, Trash2 } from 'lucide-react';
import { match } from 'ts-pattern';
import { FixedExpenseState, FixedExpenseStateKind } from '@modules/expense/presentation/ploc/fixed-expense-state';
import { FixedExpenseChecklistItem } from '@modules/expense/domain/fixed-expense.repository';
import Spinkit from '@components/Spinkit';

import { IFixedExpense } from '@shared-domain/expense/fixed-expense.entity';

interface FixedExpensesTabProps {
  fixedState: FixedExpenseState;
  onChangeBillingMonth: (month: string) => void;
  toggleChecklistPayment: (item: FixedExpenseChecklistItem) => void;
  getCategoryBadgeClass: (cat: string) => string;
  getCategoryLabel: (cat: string) => string;
  formatDate: (date: string | number | Date) => string;
  formatCurrency: (amount: number) => string;
  onEditTemplate: (tpl: IFixedExpense) => void;
  onDeleteTemplate: (id: string, name: string) => void;
}

export const FixedExpensesTab: React.FC<FixedExpensesTabProps> = ({
  fixedState,
  onChangeBillingMonth,
  toggleChecklistPayment,
  getCategoryBadgeClass,
  getCategoryLabel,
  formatDate,
  formatCurrency,
  onEditTemplate,
  onDeleteTemplate,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT: PAYMENT CHECKLIST */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-5 mb-5">
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Month Checklist Payments
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Select a month to mark templates paid/unpaid. Double-entry syncs standard ledger.
              </p>
            </div>
            <div>
              <input
                type="month"
                value={fixedState.selectedBillingMonth}
                onChange={(e) => onChangeBillingMonth(e.target.value)}
                className="h-10 px-3 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 text-sm font-semibold focus:outline-none"
              />
            </div>
          </div>

          {match(fixedState)
            .with({ kind: FixedExpenseStateKind.LOADING }, () => (
              <div className="flex justify-center py-8">
                <Spinkit />
              </div>
            ))
            .with({ kind: FixedExpenseStateKind.ERROR }, (st) => (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4 rounded-xl text-center text-xs font-semibold text-red-700">
                {st.errorMessage || 'Error loading checklist'}
              </div>
            ))
            .with({ kind: FixedExpenseStateKind.LOADED }, (st) => {
              if (st.checklist.length === 0) {
                return (
                  <div className="text-center py-10 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl text-stone-500 text-xs font-semibold">
                    No active templates found for this context. Create templates on the right panel!
                  </div>
                );
              }

              const totalScheduled = st.checklist.reduce((sum, item) => sum + Number(item.fixedExpense.amount), 0);
              const totalPaid = st.checklist.reduce((sum, item) => sum + (item.payment?.isPaid ? Number(item.fixedExpense.amount) : 0), 0);
              const totalPending = totalScheduled - totalPaid;

              return (
                <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                  {st.checklist.map((item: FixedExpenseChecklistItem) => {
                    const isPaid = item.payment?.isPaid;

                    return (
                      <div
                        key={item.fixedExpense.id}
                        onClick={() => toggleChecklistPayment(item)}
                        className="flex items-center justify-between py-4 cursor-pointer hover:bg-stone-50/50 dark:hover:bg-stone-950/20 transition-all rounded-xl px-3 -mx-3"
                      >
                        <div className="flex items-center gap-3.5">
                          {isPaid ? (
                            <CheckSquare className="w-5.5 h-5.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-5.5 h-5.5 text-stone-300 dark:text-stone-700 hover:text-emerald-500 shrink-0" />
                          )}
                          <div>
                            <h4 className={`text-sm font-bold ${isPaid ? 'line-through text-stone-400' : 'text-stone-900 dark:text-stone-100'}`}>
                              {item.fixedExpense.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getCategoryBadgeClass(String(item.fixedExpense.category))}`}>
                                {getCategoryLabel(String(item.fixedExpense.category))}
                              </span>
                              {isPaid && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                                  Paid at {formatDate(item.payment?.paidAt as string | number | Date)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-stone-900 dark:text-stone-50 tabular-nums">
                            {formatCurrency(Number(item.fixedExpense.amount))}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* TOTALS SUMMARY */}
                  <div className="pt-5 mt-4 space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-stone-50/50 dark:bg-stone-950/20 border border-stone-100 dark:border-stone-800/40 p-3 rounded-xl">
                        <span className="block text-[10px] uppercase tracking-wider font-extrabold text-stone-400 mb-1">Programado</span>
                        <span className="text-sm font-black text-stone-700 dark:text-stone-300 tabular-nums">{formatCurrency(totalScheduled)}</span>
                      </div>
                      <div className="bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/40 dark:border-emerald-950/30 p-3 rounded-xl">
                        <span className="block text-[10px] uppercase tracking-wider font-extrabold text-emerald-500/80 mb-1">Pagado</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(totalPaid)}</span>
                      </div>
                      <div className="bg-stone-50/30 dark:bg-stone-950/10 border border-stone-100/20 dark:border-stone-800/10 p-3 rounded-xl">
                        <span className="block text-[10px] uppercase tracking-wider font-extrabold text-stone-400 mb-1">Pendiente</span>
                        <span className="text-sm font-black text-stone-600 dark:text-stone-400 tabular-nums">{formatCurrency(totalPending)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
            .exhaustive()}
        </div>
      </div>

      {/* RIGHT: RECURRING TEMPLATES CONFIGURATOR */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-5 mb-5">
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
                <Settings className="w-5 h-5 text-stone-500" />
                Template Configurator
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Define recurring bills, wages, software licensing templates.
              </p>
            </div>
          </div>

          {match(fixedState)
            .with({ kind: FixedExpenseStateKind.LOADING }, () => (
              <div className="flex justify-center py-6">
                <Spinkit />
              </div>
            ))
            .with({ kind: FixedExpenseStateKind.ERROR }, () => null)
            .with({ kind: FixedExpenseStateKind.LOADED }, (st) => {
              if (st.templates.length === 0) {
                return (
                  <div className="text-center py-10 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl text-stone-400 text-xs font-semibold">
                    No recurring templates configured. Let's create your first template!
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {st.templates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="bg-stone-50 dark:bg-stone-950/20 border border-stone-100 dark:border-stone-800/40 rounded-xl p-3.5 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-extrabold text-stone-800 dark:text-stone-200">
                          {tpl.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black border ${getCategoryBadgeClass(String(tpl.category))}`}>
                            {getCategoryLabel(String(tpl.category))}
                          </span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${tpl.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-stone-200/50 text-stone-500 border border-stone-300/30'}`}>
                            {tpl.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-stone-900 dark:text-stone-50 tabular-nums">
                          {formatCurrency(Number(tpl.amount))}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onEditTemplate(tpl)}
                            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                            title="Edit template"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (tpl.id) {
                                onDeleteTemplate(tpl.id, String(tpl.name));
                              }
                            }}
                            className="p-1 text-rose-400 hover:text-rose-600"
                            title="Delete template"
                            disabled={!tpl.id}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })
            .exhaustive()}
        </div>
      </div>
    </div>
  );
};
