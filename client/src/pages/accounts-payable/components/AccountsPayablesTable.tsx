import React from "react";
import { Calendar, DollarSign, TrendingDown, CheckCircle2 } from "lucide-react";
import type { AccountsPayable } from "../../../modules/financial/infrastructure/graphql/accounts-payable-types";

interface AccountsPayablesTableProps {
  filteredAccountsPayables: AccountsPayable[];
  onPay: (payable: AccountsPayable) => void;
  getAccountNameById: (accountId: string) => string;
}

export const AccountsPayablesTable: React.FC<AccountsPayablesTableProps> = ({
  filteredAccountsPayables,
  onPay,
  getAccountNameById,
}) => {
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
      PARTIAL: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
      PAID: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
    };
    const labels: Record<string, string> = {
      PENDING: "Pending",
      PARTIAL: "Partial",
      PAID: "Paid",
    };
    const icons: Record<string, React.ReactNode> = {
      PENDING: <TrendingDown className="w-3 h-3" />,
      PARTIAL: <DollarSign className="w-3 h-3" />,
      PAID: <CheckCircle2 className="w-3 h-3" />,
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.PENDING}`}
      >
        {icons[status]}
        {labels[status] || status}
      </span>
    );
  };

  const getProgressPercentage = (ap: AccountsPayable): number => {
    if (ap.totalAmount === 0) return 100;
    const paidAmount = ap.totalAmount - ap.remainingBalance;
    return (paidAmount / ap.totalAmount) * 100;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredAccountsPayables.map((ap) => {
        const shortId = ap.id.substring(18).toUpperCase();
        const shortLotId = ap.stockLotId.substring(18).toUpperCase();
        const progress = getProgressPercentage(ap);

        return (
          <div
            key={ap.id}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full"
          >
            {/* Header */}
            <div className="p-5 border-b border-stone-150 dark:border-stone-850 flex items-center justify-between bg-stone-50/50 dark:bg-stone-950/20">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 font-mono tracking-wider">
                  AP #{shortId}
                </span>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {ap.supplier}
                </h3>
                <span className="block text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                  LOT #{shortLotId}
                </span>
              </div>
              {getStatusBadge(ap.status)}
            </div>

            {/* Body */}
            <div className="p-5 flex-1 space-y-4">
              {/* Total Amount */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-stone-600 dark:text-stone-400" />
                  <span className="text-stone-600 dark:text-stone-400">Total:</span>
                </div>
                <span className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  ${ap.totalAmount.toFixed(2)}
                </span>
              </div>

              {/* Remaining Balance */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-stone-600 dark:text-stone-400">Remaining:</span>
                </div>
                <span className={`text-lg font-bold ${ap.remainingBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  ${ap.remainingBalance.toFixed(2)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-stone-400">Payment Progress</span>
                  <span className="font-semibold text-stone-900 dark:text-stone-100">
                    {progress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      progress === 100
                        ? 'bg-emerald-600'
                        : progress >= 50
                        ? 'bg-blue-600'
                        : 'bg-amber-600'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Payments */}
              {ap.payments.length > 0 && (
                <div className="border-t border-stone-200 dark:border-stone-800 pt-4">
                  <p className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
                    Payments ({ap.payments.length})
                  </p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {ap.payments.slice(-3).reverse().map((payment, idx) => (
                      <div
                        key={payment.id || idx}
                        className="flex items-center justify-between text-xs bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                            ${payment.amount.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-stone-500 dark:text-stone-400">
                            {getAccountNameById(payment.accountId)}
                          </p>
                        </div>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500">
                          {new Date(payment.paidAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                <Calendar className="w-3 h-3" />
                <span>Created {new Date(ap.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Footer */}
            {ap.status !== 'PAID' && (
              <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/20">
                <button
                  onClick={() => onPay(ap)}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Record Payment
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
