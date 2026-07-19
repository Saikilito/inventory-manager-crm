import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@utils/formatters";
import { ProfitDetailSummary } from "@modules/dashboard/infrastructure/utils/aggregation";

interface ProfitAuditBannerProps {
  summary: ProfitDetailSummary | null;
}

export const ProfitAuditBanner: React.FC<ProfitAuditBannerProps> = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="space-y-3">
      {summary.isReconciled ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">Conciliación Exitosa</p>
            <p className="text-xs font-semibold opacity-90">
              Los cálculos basados en transacciones coinciden exactamente con el servidor (discrepancia de {formatCurrency(summary.discrepancy)} USD).
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">Auditoría Requerida (Discrepancia)</p>
            <p className="text-xs font-semibold opacity-90">
              Existe una discrepancia de {formatCurrency(summary.discrepancy)} USD entre los cálculos del cliente y el servidor.
            </p>
          </div>
        </div>
      )}

      {summary.fallbackCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-bold">Costos de Catálogo Aplicados (COGS Fallback)</p>
            <p className="text-xs font-semibold opacity-90">
              {summary.fallbackCount} transacción(es) tenían costo de compra no registrado (&lt;= 0.01 USD). Se utilizó el precio de compra del catálogo como fallback.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
