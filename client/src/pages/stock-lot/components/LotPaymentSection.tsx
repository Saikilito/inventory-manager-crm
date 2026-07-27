import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { isInsufficientAccountBalance } from "@shared-domain/financial/account.entity";
import { PaymentMethod } from "@shared-domain/stock-lot/stock-lot.entity";
import type { AccountShape, PaymentSplit } from "./stockLotModalTypes";

interface LotPaymentSectionProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  payments: PaymentSplit[];
  accounts: AccountShape[];
  totalCost: number;
  totalPayments: number;
  handleAddPayment: () => void;
  handleRemovePayment: (index: number) => void;
  handlePaymentChange: (index: number, field: keyof PaymentSplit, value: string) => void;
}

export const LotPaymentSection: React.FC<LotPaymentSectionProps> = ({
  paymentMethod,
  setPaymentMethod,
  payments,
  accounts,
  totalCost,
  totalPayments,
  handleAddPayment,
  handleRemovePayment,
  handlePaymentChange,
}) => {
  return (
    <section className="space-y-5">
      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide">
        3. Payment
      </h3>
      
      <div className="flex bg-stone-100 dark:bg-stone-800/50 p-1 rounded-xl max-w-sm">
        <button
          type="button"
          onClick={() => setPaymentMethod(PaymentMethod.CASH)}
          className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            paymentMethod === PaymentMethod.CASH
              ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm ring-1 ring-stone-900/5"
              : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
          }`}
        >
          💵 Pay Now
        </button>
        <button
          type="button"
          onClick={() => setPaymentMethod(PaymentMethod.CREDIT)}
          className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            paymentMethod === PaymentMethod.CREDIT
              ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm ring-1 ring-stone-900/5"
              : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
          }`}
        >
          💳 Accounts Payable
        </button>
      </div>

      {paymentMethod === PaymentMethod.CASH && (
        <div className="space-y-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-stone-800 dark:text-stone-200">Funding Source</h4>
            <button
              type="button"
              onClick={handleAddPayment}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Split Source
            </button>
          </div>

          <div className="space-y-3">
            {payments.map((payment, index) => {
              const selectedAcc = accounts?.find((a) => a.id === payment.accountId);
              const paymentAmount = payments.length > 1 ? parseFloat(payment.amount) || 0 : totalCost;
              const isInsufficient = isInsufficientAccountBalance(selectedAcc, paymentAmount);

              return (
                <div key={index} className="flex flex-col gap-1">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex-1 w-full relative">
                      <select
                        value={payment.accountId}
                        onChange={(e) => handlePaymentChange(index, "accountId", e.target.value)}
                        className={`w-full px-3 py-2 text-sm border rounded-lg bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow ${
                          isInsufficient ? "border-red-500 dark:border-red-500" : "border-stone-200 dark:border-stone-700"
                        }`}
                      >
                        <option value="">-- Choose Account --</option>
                        {(accounts || [])
                          .filter((acc) => !payments.some((p, i) => i !== index && p.accountId === acc.id))
                          .map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name} (Bal: ${acc.balance.toFixed(2)})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {payments.length > 1 && (
                        <div className="relative w-full sm:w-36">
                          <span className="absolute left-3 top-2 text-stone-400 text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={payment.amount}
                            onChange={(e) => handlePaymentChange(index, "amount", e.target.value)}
                            placeholder="0.00"
                            className={`w-full pl-6 pr-3 py-2 text-sm border rounded-lg bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow ${
                              isInsufficient ? "border-red-500 dark:border-red-500" : "border-stone-200 dark:border-stone-700"
                            }`}
                          />
                        </div>
                      )}
                      {payments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePayment(index)}
                          className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {isInsufficient && selectedAcc && (
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                      Insufficient balance (${selectedAcc.balance.toFixed(2)} available)
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {payments.length > 1 && (
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-sm">
              <span className="text-stone-500">Unallocated balance:</span>
              <span className={`font-mono font-semibold ${Math.abs(totalCost - totalPayments) < 0.01 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                ${Math.max(0, totalCost - totalPayments).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
