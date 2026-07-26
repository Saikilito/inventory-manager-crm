import React from "react";
import { Package, TrendingUp, DollarSign } from "lucide-react";
import Spinkit from "../../components/Spinkit";
import Alert from "../../components/Alert";
import { DateNavigator } from "../../components/ui/DateNavigator";
import { useStockLotsLogic } from "./hooks/useStockLotsLogic";
import { StockLotsTable } from "./components/StockLotsTable";
import { CreateStockLotModal } from "./components/CreateStockLotModal";
import { useState } from "react";

export const StockLotsPage: React.FC = () => {
  const {
    stockLots,
    filteredStockLots,
    loadingStockLots,
    creatingStockLot,
    successMessage,
    statusFilter,
    setStatusFilter,
    supplierFilter,
    setSupplierFilter,
    selectedDate,
    setSelectedDate,
    handleCreateStockLot,
    handleCompleteDraft,
    totalPurchaseValue,
    totalProjectedProfit,
    products,
    accounts,
    contexts,
  } = useStockLotsLogic();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<any>(undefined);

  const openCreateModal = () => {
    setEditingDraft(undefined);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (draft: any) => {
    setEditingDraft(draft);
    setIsCreateModalOpen(true);
  };

  // Calculate counts for the status tabs based on current date and supplier filters
  const baseFilteredLots = stockLots.filter((lot) => {
    const matchesDate = lot.purchaseDate === selectedDate;
    const matchesSupplier = !supplierFilter || lot.supplier.toLowerCase().includes(supplierFilter.toLowerCase());
    return matchesDate && matchesSupplier;
  });

  const tabCounts = {
    RECEIVED: baseFilteredLots.filter((l) => l.status === "RECEIVED").length,
    DRAFT: baseFilteredLots.filter((l) => l.status === "DRAFT").length,
    ALL: baseFilteredLots.length,
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Stock Lots Management
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Manage inventory purchases, track stock lots, and monitor supplier accounts.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Package className="w-4 h-4" />
          New Stock Lot
        </button>
      </div>

      {successMessage && <Alert message={successMessage} type="success" />}

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-stone-50/50 dark:bg-stone-900/40 p-4 rounded-xl border border-stone-200 dark:border-stone-800/80">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mr-1">
              Status:
            </span>
            {[
              { label: "Received", value: "RECEIVED" },
              { label: "Draft", value: "DRAFT" },
              { label: "All", value: "ALL" },
            ].map((tab) => {
              const count = tabCounts[tab.value as keyof typeof tabCounts];
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === tab.value
                      ? "bg-stone-950 text-white dark:bg-white dark:text-stone-950 shadow-sm"
                      : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800/60"
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                      statusFilter === tab.value 
                        ? "bg-stone-800 dark:bg-stone-200" 
                        : "bg-stone-100 dark:bg-stone-800"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Supplier Search */}
          <div className="flex items-center gap-2 max-w-sm w-full">
            <input
              type="text"
              placeholder="Search supplier..."
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center">
          <DateNavigator
            selectedDate={selectedDate}
            onChangeDate={setSelectedDate}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Total Lots</p>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                {filteredStockLots.length}
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
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Total Purchase Value</p>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                ${totalPurchaseValue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Projected Profit</p>
              <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                ${totalProjectedProfit.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loadingStockLots && (
        <div className="flex justify-center items-center py-12">
          <Spinkit />
        </div>
      )}

      {/* Empty State */}
      {!loadingStockLots && filteredStockLots.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-4" />
          <p className="text-stone-500 dark:text-stone-400 text-sm">No stock lots found</p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first stock lot
          </button>
        </div>
      )}

      {/* Stock Lots Table */}
      {!loadingStockLots && filteredStockLots.length > 0 && (
        <StockLotsTable
          filteredStockLots={filteredStockLots}
          onReceiveDraft={handleCompleteDraft}
          onEditDraft={openEditModal}
        />
      )}

      {/* Create Stock Lot Modal */}
      <CreateStockLotModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateStockLot}
        loading={creatingStockLot}
        products={products}
        accounts={accounts}
        contexts={contexts}
        initialData={editingDraft}
        selectedDate={selectedDate}
      />
    </div>
  );
};
