import React from "react";
import { CreditCard, DollarSign, TrendingDown, AlertCircle } from "lucide-react";
import Spinkit from "../../components/Spinkit";
import Alert from "../../components/Alert";
import { useAccountsPayablesLogic } from "./hooks/useAccountsPayablesLogic";
import { AccountsPayablesTable } from "./components/AccountsPayablesTable";
import { PayModal } from "./components/PayModal";
import { useState } from "react";
import type { AccountsPayable } from "../../../modules/financial/infrastructure/graphql/accounts-payable-types";

export const AccountsPayablesPage: React.FC = () => {
  const {
    accountsPayables,
    filteredAccountsPayables,
    loadingAccountsPayables,
    payingAccountsPayable,
    successMessage,
    statusFilter,
    setStatusFilter,
    supplierFilter,
    setSupplierFilter,
    handlePayAccountsPayable,
    refetchAccountsPayables,
    totalOutstanding,
    totalPaid,
    accounts,
    getAccountNameById,
  } = useAccountsPayablesLogic();

  const [selectedPayable, setSelectedPayable] = useState<AccountsPayable | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const handleOpenPayModal = (payable: AccountsPayable) => {
    setSelectedPayable(payable);
    setIsPayModalOpen(true);
  };

  const handleClosePayModal = () => {
    setSelectedPayable(null);
    setIsPayModalOpen(false);
  };

  const handlePayment = async (accountsPayableId: string, amount: number, accountId: string) => {
    const result = await handlePayAccountsPayable(accountsPayableId, amount, accountId);
    if (result?.success) {
      handleClosePayModal();
    }
    return result;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-600" />
            Accounts Payable
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Track supplier credit, manage payments, and monitor outstanding balances.
          </p>
        </div>
      </div>

      {successMessage && <Alert message={successMessage} type="success" />}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Total Accounts</p>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                {filteredAccountsPayables.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Outstanding</p>
              <p className="text-2xl font-bold text-red-600">
                ${totalOutstanding.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Total Paid</p>
              <p className="text-2xl font-bold text-emerald-600">
                ${totalPaid.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Pending</p>
              <p className="text-2xl font-bold text-blue-600">
                {filteredAccountsPayables.filter((ap) => ap.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      {accountsPayables.length > 0 && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-stone-50/50 dark:bg-stone-900/40 p-4 rounded-xl border border-stone-200 dark:border-stone-800/80">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mr-1">
              Status:
            </span>
            {[
              { label: "All", value: "ALL" },
              { label: "Pending", value: "PENDING" },
              { label: "Partial", value: "PARTIAL" },
              { label: "Paid", value: "PAID" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  statusFilter === tab.value
                    ? "bg-stone-950 text-white dark:bg-white dark:text-stone-950 shadow-sm"
                    : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Supplier Search */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search supplier..."
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Loading State */}
      {loadingAccountsPayables && (
        <div className="flex justify-center items-center py-12">
          <Spinkit />
        </div>
      )}

      {/* Empty State */}
      {!loadingAccountsPayables && filteredAccountsPayables.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-4" />
          <p className="text-stone-500 dark:text-stone-400 text-sm">No accounts payable found</p>
          <p className="text-stone-400 dark:text-stone-500 text-xs mt-1">
            Accounts payable are created automatically when you create stock lots with CREDIT payment
          </p>
        </div>
      )}

      {/* Accounts Payables Table */}
      {!loadingAccountsPayables && filteredAccountsPayables.length > 0 && (
        <AccountsPayablesTable
          filteredAccountsPayables={filteredAccountsPayables}
          onPay={handleOpenPayModal}
          getAccountNameById={getAccountNameById}
        />
      )}

      {/* Pay Modal */}
      {selectedPayable && (
        <PayModal
          isOpen={isPayModalOpen}
          onClose={handleClosePayModal}
          accountsPayable={selectedPayable}
          onPay={handlePayment}
          loading={payingAccountsPayable}
          accounts={accounts}
        />
      )}
    </div>
  );
};
