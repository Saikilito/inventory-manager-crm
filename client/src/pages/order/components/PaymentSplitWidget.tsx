import React, { useState, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { GET_ACCOUNTS, GET_FINANCIAL_DAY_BY_DATE } from "../../../modules/financial/infrastructure/graphql/queries";
import { Plus, Trash2, Coins, AlertCircle, RefreshCw } from "lucide-react";

interface PaymentRow {
  accountId: string;
  amount: number;
  exchangeRate: number;
}

interface PaymentSplitWidgetProps {
  totalUSD: number;
  onSave: (payments: Array<{ accountId: string; amount: number; exchangeRate: number }>) => void;
  onCancel?: () => void;
}

export const PaymentSplitWidget: React.FC<PaymentSplitWidgetProps> = ({
  totalUSD,
  onSave,
  onCancel: _onCancel,
}) => {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Query: Accounts
  const { data: accountsData, loading: loadingAccounts } = useQuery(GET_ACCOUNTS, {
    fetchPolicy: "no-cache",
  });
  const accounts = accountsData?.getAccounts || [];

  // Query: Active Exchange Rate of the day
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: financialDayData, loading: loadingFinancialDay } = useQuery(GET_FINANCIAL_DAY_BY_DATE, {
    variables: { date: todayStr },
    fetchPolicy: "no-cache",
  });

  const activeExchangeRate = financialDayData?.getFinancialDayByDate?.exchangeRate || 1.0;

  // Initialize with a single pre-allocated payment row once accounts are loaded
  useEffect(() => {
    if (accounts.length > 0 && payments.length === 0) {
      // Prefer USD account as default first row if present
      const usdAcc = accounts.find((a: { id: string; currency: string; name: string; type: string }) => a.currency === "USD");
      const defaultAcc = usdAcc || accounts[0];
      const initialRate = defaultAcc.currency === "USD" ? 1.0 : activeExchangeRate;
      setPayments([
        {
          accountId: defaultAcc.id,
          amount: Number((totalUSD * initialRate).toFixed(2)),
          exchangeRate: initialRate,
        },
      ]);
    }
  }, [accounts, activeExchangeRate, payments.length, totalUSD]);

  const handleAddRow = () => {
    if (accounts.length === 0) return;
    const usdAcc = accounts.find((a: { id: string; currency: string; name: string; type: string }) => a.currency === "USD");
    const defaultAcc = usdAcc || accounts[0];
    setPayments((prev) => [
      ...prev,
      {
        accountId: defaultAcc.id,
        amount: 0,
        exchangeRate: defaultAcc.currency === "USD" ? 1.0 : activeExchangeRate,
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof PaymentRow, value: string | number) => {
    setPayments((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        const updatedRow = { ...row, [field]: value };

        // If changing accountId, auto-update exchangeRate and amount proportionally based on currency type
        if (field === "accountId") {
          const selectedAccount = accounts.find((a: { id: string; currency: string; name: string; type: string }) => a.id === value);
          if (selectedAccount) {
            const oldRate = row.exchangeRate || 1.0;
            const newRate = selectedAccount.currency === "USD" ? 1.0 : activeExchangeRate;
            updatedRow.exchangeRate = newRate;
            
            // Adjust amount proportionally
            if (oldRate > 0) {
              updatedRow.amount = Number(((row.amount / oldRate) * newRate).toFixed(2));
            } else {
              updatedRow.amount = Number((totalUSD * newRate).toFixed(2));
            }
          }
        }

        return updatedRow;
      })
    );
  };

  // Calculations
  const calculatedRows = payments.map((row) => {
    const usdEquivalent = row.exchangeRate > 0 ? row.amount / row.exchangeRate : 0;
    return {
      ...row,
      usdEquivalent,
    };
  });

  const allocatedUSD = calculatedRows.reduce((sum, row) => sum + row.usdEquivalent, 0);
  const remainingUSD = totalUSD - allocatedUSD;

  // Validation
  const isValid = (() => {
    if (payments.length === 0) return false;

    // Check if remaining is close to zero (within 2 decimal places precision)
    const isAmountFullyAllocated = Math.abs(remainingUSD) <= 0.015;

    const allRowsValid = payments.every(
      (row) =>
        row.accountId &&
        row.amount > 0 &&
        row.exchangeRate > 0
    );

    return isAmountFullyAllocated && allRowsValid;
  })();

  const handleSave = () => {
    setError(null);

    // Double check constraints
    const invalidRow = payments.find((r) => r.amount <= 0 || r.exchangeRate <= 0 || !r.accountId);
    if (invalidRow) {
      setError("Please ensure all rows have an account selected, a positive amount, and a valid exchange rate.");
      return;
    }

    if (Math.abs(remainingUSD) > 0.015) {
      const allocatedFormatted = allocatedUSD ? allocatedUSD.toFixed(2) : "0.00";
      const totalFormatted = totalUSD ? totalUSD.toFixed(2) : "0.00";
      setError(`Allocated sum ($${allocatedFormatted}) does not equal the order total ($${totalFormatted}).`);
      return;
    }

    // Submit mapped clean parameters
    onSave(
      payments.map((p) => ({
        accountId: p.accountId,
        amount: Number(p.amount),
        exchangeRate: Number(p.exchangeRate),
      }))
    );
  };

  if (loadingAccounts || loadingFinancialDay) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3 bg-stone-50 dark:bg-stone-900/30 border border-stone-100 dark:border-stone-800 rounded-xl">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="text-xs font-semibold text-stone-500">Loading payment accounts...</span>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 dark:bg-stone-900/30 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Coins className="w-4.5 h-4.5 text-emerald-600" />
          Mixed Payment Split Allocations
        </h4>
        <span className="text-xs font-bold text-stone-500 dark:text-stone-400 font-mono">
          Target: ${totalUSD ? totalUSD.toFixed(2) : "0.00"} USD
        </span>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs p-3 rounded-xl flex gap-2 items-start">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[400px]">
          <thead>
            <tr className="border-b border-stone-100 dark:border-stone-800 text-[10px] font-extrabold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              <th className="pb-3 pl-1">Financial Account</th>
              <th className="pb-3 text-right">Native Amount</th>
              <th className="pb-3 text-right pr-2">USD Equivalent</th>
              <th className="pb-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100/50 dark:divide-stone-800/40">
            {calculatedRows.map((row, index) => {
              const selectedAccount = accounts.find((a: { id: string; currency: string; name: string; type: string }) => a.id === row.accountId);
              const currency = selectedAccount?.currency || "USD";

              return (
                <tr key={index} className="group align-middle">
                  <td className="py-2.5 pl-1">
                    <select
                      value={row.accountId}
                      onChange={(e) => handleRowChange(index, "accountId", e.target.value)}
                      aria-label={`Select Account for row ${index + 1}`}
                      className="h-10 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl px-2.5 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
                    >
                      <option value="" disabled>Select Account</option>
                      {accounts.map((acc: { id: string; currency: string; name: string; type: string }) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.currency})
                        </option>
                      ))}
                    </select>
                    {currency !== "USD" && (
                      <div className="text-[10px] text-stone-400 dark:text-stone-500 mt-1.5 pl-1 font-mono">
                        Exchange Rate: {row.exchangeRate} bs
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 text-right pl-3">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.amount || ""}
                        placeholder="0.00"
                        onChange={(e) => handleRowChange(index, "amount", parseFloat(e.target.value) || 0)}
                        aria-label={`Enter Native Amount for row ${index + 1}`}
                        className="h-10 text-right pr-12 pl-2.5 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-mono font-semibold text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full max-w-[140px]"
                      />
                      <span className="absolute right-2.5 top-3 text-[10px] font-bold text-stone-400 font-mono pointer-events-none">
                        {currency}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right pr-2 text-xs font-semibold font-mono text-stone-900 dark:text-stone-100">
                    ${row.usdEquivalent ? row.usdEquivalent.toFixed(2) : "0.00"}
                  </td>
                  <td className="py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      disabled={payments.length === 1}
                      aria-label={`Delete row ${index + 1}`}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/35 transition-all disabled:opacity-20 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={handleAddRow}
        className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors p-1 rounded-md"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add payment allocation row
      </button>

      {/* Allocation Summary */}
      <div className="bg-white dark:bg-stone-950 border border-stone-100 dark:border-stone-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="text-xs text-stone-500 dark:text-stone-400">
            Allocated: <span className="font-bold font-mono text-stone-800 dark:text-stone-200">${allocatedUSD ? allocatedUSD.toFixed(2) : "0.00"}</span>
          </div>
          <div className="text-xs">
            Remaining:{" "}
            <span
              className={`font-extrabold font-mono ${
                Math.abs(remainingUSD || 0) <= 0.015
                  ? "text-emerald-600 dark:text-emerald-400"
                  : (remainingUSD || 0) > 0
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
            >
              ${remainingUSD ? remainingUSD.toFixed(2) : "0.00"} USD
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className="h-10 px-5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 active:bg-emerald-800 shadow-sm focus:outline-none transition-colors cursor-pointer"
          >
            Confirm payments
          </button>
        </div>
      </div>
    </div>
  );
};
