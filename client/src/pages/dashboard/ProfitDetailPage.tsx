import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useProfitDetailPageLogic } from "./hooks/useProfitDetailPageLogic";
import { ProfitAuditBanner } from "./components/ProfitAuditBanner";
import { ProfitSummaryCards } from "./components/ProfitSummaryCards";
import { ProfitOrdersTable } from "./components/ProfitOrdersTable";

export const ProfitDetailPage: React.FC = () => {
  const {
    period,
    activeContextName,
    loading,
    error,
    summary,
    resolvedGroupedOrders,
    expandedOrders,
    toggleOrder,
    grossMarginPct,
    refetch,
  } = useProfitDetailPageLogic();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <RefreshCw className="w-8 h-8 animate-spin text-stone-500" />
        <p className="text-sm text-stone-500 mt-4">Cargando detalles de ganancia...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          Error al cargar los detalles de ganancia: {error.message}
        </p>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Header with back button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="flex items-center gap-3">
          <Link
            to={`/dashboard`}
            className="p-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg active:scale-95 transition-all"
            title="Volver al Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-stone-900 dark:text-stone-50 tracking-tight flex items-center gap-2">
              Detalle de Ganancia Real
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Contexto: <span className="font-semibold text-stone-700 dark:text-stone-300">{activeContextName}</span> • Período: <span className="font-semibold text-stone-700 dark:text-stone-300">{period}</span>
            </p>
          </div>
        </div>

        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-lg transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sincronizar
        </button>
      </div>

      <ProfitAuditBanner summary={summary} />
      
      <ProfitSummaryCards summary={summary} grossMarginPct={grossMarginPct} />
      
      <ProfitOrdersTable 
        orders={resolvedGroupedOrders} 
        expandedOrders={expandedOrders} 
        toggleOrder={toggleOrder} 
      />
    </div>
  );
};

export default ProfitDetailPage;
