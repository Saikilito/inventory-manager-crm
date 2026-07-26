import React, { useState } from "react";
import { X, DollarSign, AlertCircle } from "lucide-react";
import type { AccountsPayable } from "../../../modules/financial/infrastructure/graphql/accounts-payable-types";

interface AccountShape {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

interface PayModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountsPayable: AccountsPayable;
  onPay: (accountsPayableId: string, amount: number, accountId: string) => Promise<any>;
  loading: boolean;
  accounts: AccountShape[];
}

export const PayModal: React.FC<PayModalProps> = ({
  isOpen,
  onClose,
  accountsPayable,
  onPay,
  loading,
  accounts,
}) => {
  const [amount, setAmount] = useState<string>(accountsPayable.remainingBalance.toString());
  const [accountId, setAccountId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);

    if (!accountId) {
      setError("Please select a payment account");
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    if (numAmount > accountsPayable.remainingBalance) {
      setError(`Payment cannot exceed remaining balance of $${accountsPayable.remainingBalance.toFixed(2)}`);
      return;
    }

    const result = await onPay(accountsPayable.id, numAmount, accountId);
    if (result?.success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setAmount(accountsPayable.remainingBalance.toString());
    setAccountId("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const remainingBalance = accountsPayable.remainingBalance;
  const totalAmount = accountsPayable.totalAmount;
  const paidAmount = totalAmount - remainingBalance;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Record Payment
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              {accountsPayable.supplier}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Summary */}
          <div className="bg-stone-50 dark:bg-stone-950/20 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600 dark:text-stone-400">Total Amount:</span>
              <span className="font-bold text-stone-900 dark:text-stone-100">
                ${totalAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600 dark:text-stone-400">Already Paid:</span>
              <span className="font-bold text-emerald-600">
                ${paidAmount.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-stone-200 dark:border-stone-800 pt-3 flex items-center justify-between">
              <span className="text-stone-600 dark:text-stone-400 font-semibold">Remaining:</span>
              <span className="text-lg font-bold text-red-600">
                ${remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Payment Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                max={remainingBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setAmount(remainingBalance.toString())}
              className="text-xs text-blue-600 hover:text-blue-700 mt-1 font-medium"
            >
              Pay full amount (${remainingBalance.toFixed(2)})
            </button>
          </div>

          {/* Payment Account */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Payment Account *
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - Balance: ${account.balance.toFixed(2)} {account.currency}
                </option>
              ))}
            </select>
            {selectedAccount && selectedAccount.balance < parseFloat(amount || "0") && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Warning: Account balance is lower than payment amount
              </p>
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((percent) => {
              const amountValue = (remainingBalance * percent / 100).toFixed(2);
              return (
                <button
                  key={percent}
                  type="button"
                  onClick={() => setAmount(amountValue)}
                  className="flex-1 px-3 py-1.5 text-xs font-semibold border border-stone-200 dark:border-stone-800 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  {percent}%
                </button>
              );
            })}
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-stone-600 dark:text-stone-400 font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            {loading ? "Processing..." : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
};
