import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { usePlocState } from "@hooks/use-ploc-state";
import { useFinancialPloc } from "@contexts/financial-context";
import { FinancialStateKind } from "@modules/financial/presentation/ploc/financial-state";
import {
  ArrowLeft,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Scale,
  Calendar,
} from "lucide-react";
import Spinkit from "@components/Spinkit";
import Alert from "@components/Alert";
import { ROUTES } from "../../routes/paths";

export const DailyArqueoPage: React.FC = () => {
  const ploc = useFinancialPloc();
  const state = usePlocState(ploc);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [errorMsg, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const dateParam = searchParams.get("date") || state.selectedDate;

  useEffect(() => {
    ploc.load(dateParam);
  }, [ploc, dateParam]);

  if (state.kind === FinancialStateKind.LOADING) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Spinkit />
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Loading daily session statement...
        </p>
      </div>
    );
  }

  const activeDay = state.activeDay;
  if (!activeDay) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
          Session Day Not Opened
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          No active financial day session exists for <b>{dateParam}</b>. You
          must first open the day in the Ledger Dashboard before auditing a
          closing arqueo statement.
        </p>
        <button
          onClick={() => navigate(ROUTES.FINANCE)}
          className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isClosed = activeDay.status === "CLOSED";

  const activeRate = state.activeRate || 1.0;

  const accountMap = new Map(state.accounts.map((a) => [a.id!.toString(), a]));

  const getAccountCurrency = (id: string) => {
    const acc = accountMap.get(id);
    return acc ? acc.currency.toString() : "USD";
  };

  const openingRecords = activeDay.openingBalances || [];
  const totalOpeningUSD = openingRecords.reduce((sum, item) => {
    const idStr = item.accountId.toString();
    const curr = getAccountCurrency(idStr);
    const bal = item.balance;
    return sum + (curr === "USD" ? bal : bal / activeRate);
  }, 0);

  const closingRecords = isClosed
    ? activeDay.closingBalances || []
    : state.accounts.map((a) => ({
        accountId: a.id!,
        balance: a.balance,
      }));

  const totalClosingUSD = closingRecords.reduce((sum, item) => {
    const idStr = item.accountId.toString();
    const curr = getAccountCurrency(idStr);
    const bal = item.balance;
    return sum + (curr === "USD" ? bal : bal / activeRate);
  }, 0);

  const deltaUSD = totalClosingUSD - totalOpeningUSD;

  // Unify the list of accounts to render on the comparative statement
  const uniqueAccountIds = new Set<string>();
  openingRecords.forEach((r) => uniqueAccountIds.add(r.accountId.toString()));
  closingRecords.forEach((r) => uniqueAccountIds.add(r.accountId.toString()));
  if (!isClosed) {
    state.accounts.forEach((a) => uniqueAccountIds.add(a.id!.toString()));
  }

  const accountsToRender = Array.from(uniqueAccountIds).map((idStr) => {
    const acc = accountMap.get(idStr);
    return {
      id: idStr,
      name: acc ? acc.name.toString() : "Unknown Account",
      currency: acc ? acc.currency.toString() : "USD",
    };
  });

  const handleCloseDay = async () => {
    if (
      window.confirm(
        `Are you sure you want to CLOSE and LOCK the financial day for ${dateParam}? This will finalize balances and lock the transaction log forever.`,
      )
    ) {
      setIsClosing(true);
      setError(null);
      try {
        await ploc.closeDay(dateParam);
        setIsClosing(false);
      } catch (err: unknown) {
        setIsClosing(false);
        setError((err as Error).message || "Failed to close the financial day.");
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Back Header */}
      <div className="flex items-center justify-between border-b border-stone-150 dark:border-stone-850 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.FINANCE)}
            className="p-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 rounded-xl transition-all text-stone-600 dark:text-stone-400"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" />
              Arqueo de Caja & Audit
            </span>
            <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              Daily Ledger Closure Statement
            </h1>
          </div>
        </div>

        {/* Date and Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-850 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold font-mono">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            {dateParam}
          </div>
          {isClosed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-250 dark:border-amber-900/50">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              Locked (Closed)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/50 animate-pulse">
              <Unlock className="w-3.5 h-3.5 shrink-0" />
              Open Audit
            </span>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4">
          <Alert message={errorMsg} type="error" />
        </div>
      )}

      {/* Main Grid: Auditing Details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Side: Comparative Balance Sheet (Col 7) */}
        <div className="md:col-span-8 space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-stone-50 dark:bg-stone-950 border-b border-stone-150 dark:border-stone-850 flex items-center justify-between">
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Ledger Accounts audit trail
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                1 USD = Bs.{activeRate.toFixed(2)}
              </span>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-stone-850">
              {accountsToRender.length === 0 ? (
                <div className="p-8 text-center text-stone-500 dark:text-stone-400">
                  <p className="text-sm font-semibold">
                    No accounts found for this financial day statement.
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    Please create or activate accounts in the dashboard.
                  </p>
                </div>
              ) : (
                accountsToRender.map((account) => {
                  const idStr = account.id;
                  const currency = account.currency;
                  const openItem = openingRecords.find(
                    (o) => o.accountId.toString() === idStr,
                  );
                  const openBal = openItem ? openItem.balance : 0;
                  const closeItem = closingRecords.find(
                    (c) => c.accountId.toString() === idStr,
                  );
                  const closeBal = closeItem ? closeItem.balance : 0;
                  const diff = closeBal - openBal;

                  return (
                    <div
                      key={idStr}
                      className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                          {account.name}
                        </h4>
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-extrabold rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                          {currency}
                        </span>
                      </div>

                      {/* Compare Open vs Close balances */}
                      <div className="grid grid-cols-3 gap-6 text-right sm:w-80">
                        <div>
                          <span className="block text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                            Opening
                          </span>
                          <span className="font-semibold text-stone-700 dark:text-stone-300">
                            {currency === "USD" ? "$" : "Bs."}
                            {openBal.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                            Closing
                          </span>
                          <span className="font-bold text-stone-900 dark:text-stone-100">
                            {currency === "USD" ? "$" : "Bs."}
                            {closeBal.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                            Delta
                          </span>
                          <span
                            className={`font-bold ${diff >= 0 ? "text-emerald-600" : "text-red-500"}`}
                          >
                            {diff >= 0 ? "+" : ""}
                            {currency === "USD" ? "$" : "Bs."}
                            {diff.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Totals, Delta & Lock Action Box (Col 4) */}
        <div className="md:col-span-4 space-y-6">
          {/* Statement Summary Card */}
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm border-b border-stone-100 dark:border-stone-850 pb-2.5">
              Journal Balance Sheet
            </h3>

            <div className="space-y-4 text-xs font-semibold">
              <div className="flex justify-between items-center text-stone-500 dark:text-stone-400">
                <span>Total Opening (USD Equiv.)</span>
                <span className="font-bold text-stone-850 dark:text-stone-200">
                  $
                  {totalOpeningUSD.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center text-stone-500 dark:text-stone-400">
                <span>Total Closing (USD Equiv.)</span>
                <span className="font-bold text-stone-850 dark:text-stone-200">
                  $
                  {totalClosingUSD.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <hr className="border-stone-100 dark:border-stone-850" />

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Daily Cash Delta
                </span>
                <div className="text-right">
                  <span
                    className={`text-xl font-extrabold block ${deltaUSD >= 0 ? "text-emerald-600" : "text-red-500"}`}
                  >
                    {deltaUSD >= 0 ? "+" : ""}$
                    {deltaUSD.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                    USD Equivalent
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Locked / Open Alert Box */}
          {isClosed ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-250 dark:border-emerald-900/30 p-5 rounded-2xl space-y-3 shadow-inner">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h4 className="font-bold text-emerald-800 dark:text-emerald-400 text-sm">
                  Ledger Safely Locked
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                  This financial day is successfully closed and locked. All
                  transaction logs and monetary snapshots are stored permanently
                  for auditable accounting.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-start gap-3">
                <Unlock className="w-6 h-6 text-emerald-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                    Review and Finalize
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Auditing checks match current transaction flow. Closing
                    locks transaction updates for this day.
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseDay}
                disabled={isClosing}
                className="w-full h-11 inline-flex items-center justify-center rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950 disabled:bg-stone-300 dark:disabled:bg-stone-800 disabled:cursor-not-allowed"
              >
                {isClosing
                  ? "Closing Session..."
                  : "Lock and Close Financial Day"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
