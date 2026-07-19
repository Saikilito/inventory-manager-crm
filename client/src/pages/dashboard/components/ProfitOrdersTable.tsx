import React from "react";
import { ChevronDown, ChevronUp, Receipt } from "lucide-react";
import { formatCurrency, formatDate } from "@utils/formatters";
import { GroupedOrder } from "../types";

interface ProfitOrdersTableProps {
  orders: GroupedOrder[];
  expandedOrders: Record<string, boolean>;
  toggleOrder: (orderId: string) => void;
}

export const ProfitOrdersTable: React.FC<ProfitOrdersTableProps> = ({
  orders,
  expandedOrders,
  toggleOrder,
}) => {
  return (
    <div className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl overflow-hidden bg-white dark:bg-stone-900 shadow-sm">
      <div className="px-4 py-3 bg-stone-50 dark:bg-stone-950/60 border-b border-stone-200/60 dark:border-stone-800/60">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
          Desglose de Transacciones Completadas
        </h2>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <Receipt className="w-12 h-12 mx-auto text-stone-300 mb-3" />
          <p className="text-sm font-semibold">No se encontraron transacciones completadas</p>
          <p className="text-xs text-stone-400 mt-1">Intente cambiar el período o contexto para auditar otros datos.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-950/40 text-stone-500 uppercase text-[10px] font-bold border-b border-stone-200/60 dark:border-stone-800/60">
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">Pedido ID</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4 text-right">Ingreso</th>
                <th className="py-3 px-4 text-right">Costo (COGS)</th>
                <th className="py-3 px-4 text-right">Ganancia</th>
                <th className="py-3 px-4 text-right">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-850">
              {orders.map((order) => {
                const isExpanded = !!expandedOrders[order.orderId];
                return (
                  <React.Fragment key={order.orderId}>
                    <tr
                      onClick={() => toggleOrder(order.orderId)}
                      className="hover:bg-stone-50/50 dark:hover:bg-stone-950/20 cursor-pointer transition-all border-b border-stone-100 dark:border-stone-800/30"
                    >
                      <td className="py-3 px-4 text-center">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-stone-400 mx-auto" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-stone-400 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-stone-900 dark:text-stone-100">
                        {order.shortId}
                        {order.hasFallback && (
                          <span className="ml-2 inline-flex items-center text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-500 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/10">
                            Fallback
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-stone-500 dark:text-stone-400 font-medium">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-xs font-bold text-stone-700 dark:text-stone-300">
                        {order.clientName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
                        {formatCurrency(order.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
                        {formatCurrency(order.totalCOGS)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(order.netProfit)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs font-bold text-stone-750 dark:text-stone-300 tabular-nums">
                        {order.marginPct.toFixed(1)}%
                      </td>
                    </tr>

                    {/* Expandable items sub-table */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="bg-stone-50/50 dark:bg-stone-950/10 py-4 px-6">
                          <div className="border border-stone-200/40 dark:border-stone-800/30 rounded-lg overflow-hidden bg-stone-50/30 dark:bg-stone-950/20">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-stone-100/50 dark:bg-stone-900/40 text-stone-400 uppercase text-[9px] font-bold border-b border-stone-200/40 dark:border-stone-800/20">
                                  <th className="py-2 px-3">Producto</th>
                                  <th className="py-2 px-3 text-right">Cant.</th>
                                  <th className="py-2 px-3 text-right">Precio Venta</th>
                                  <th className="py-2 px-3 text-right">Precio Compra</th>
                                  <th className="py-2 px-3 text-right">Total COGS</th>
                                  <th className="py-2 px-3 text-right">Total Ingreso</th>
                                  <th className="py-2 px-3 text-right">Neto Item</th>
                                  <th className="py-2 px-3 text-right">Margen</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-100/40 dark:divide-stone-800/20 text-xs font-semibold text-stone-600 dark:text-stone-400">
                                {order.items.map((item, idx) => {
                                  const itemMarginPct = item.revenue > 0 ? (item.netMargin / item.revenue) * 100 : 0;
                                  return (
                                    <tr key={idx} className="hover:bg-stone-100/20 dark:hover:bg-stone-900/10">
                                      <td className="py-2.5 px-3">
                                        <div className="flex items-center gap-1.5">
                                          {item.productName}
                                          {item.isFallback && (
                                            <span className="text-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-500 px-1 rounded border border-amber-500/10">
                                              VO Fallback
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                        {item.quantity}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                        {formatCurrency(item.unitPrice)}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                        {formatCurrency(item.unitPurchasePrice)}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-600 dark:text-amber-500">
                                        {formatCurrency(item.totalCOGS)}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                        {formatCurrency(item.revenue)}
                                      </td>
                                      <td className={`py-2.5 px-3 text-right font-mono tabular-nums font-bold ${item.netMargin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                                        {formatCurrency(item.netMargin)}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                        {itemMarginPct.toFixed(1)}%
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
