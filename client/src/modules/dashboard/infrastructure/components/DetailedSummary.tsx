import React from "react";
import {
  ITopClient,
  ITopSeller,
} from "@modules/dashboard/domain/dashboard.repository";
import { formatCurrency } from "../utils/format-currency";

export interface DetailedSummaryProps {
  topClients: ITopClient[];
  topSellers: ITopSeller[];
}

export const DetailedSummary: React.FC<DetailedSummaryProps> = ({
  topClients,
  topSellers,
}) => {
  return (
    <div className="col-span-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">
          Detailed Summary
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Performance and sales share comparison between clients and sellers.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Clients Table */}
        <div>
          <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-3 bg-blue-500 rounded-full" />
            Client Ranking
          </h4>
          {topClients.length === 0 ? (
            <p className="text-xs text-stone-400 dark:text-stone-500 py-4">
              No registered clients found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-stone-800">
                    <th className="py-2.5 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider w-12">
                      Pos
                    </th>
                    <th className="py-2.5 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="py-2.5 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider text-right">
                      Total Purchased
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-stone-800/50">
                  {topClients.map((client, index) => (
                    <tr
                      key={index}
                      className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors"
                    >
                      <td className="py-3.5 text-xs font-bold text-stone-400 dark:text-stone-500 tabular-nums">
                        #{index + 1}
                      </td>
                      <td className="py-3.5 text-xs font-semibold text-stone-800 dark:text-stone-200">
                        {client.clientName}
                      </td>
                      <td className="py-3.5 text-xs font-bold text-stone-900 dark:text-stone-100 text-right tabular-nums">
                        {formatCurrency(client.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sellers Table */}
        <div>
          <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-3 bg-emerald-500 rounded-full" />
            Seller Ranking
          </h4>
          {topSellers.length === 0 ? (
            <p className="text-xs text-stone-400 dark:text-stone-500 py-4">
              No registered sellers found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 dark:border-stone-800">
                    <th className="py-2.5 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider w-12">
                      Pos
                    </th>
                    <th className="py-2.5 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                      Seller
                    </th>
                    <th className="py-2.5 text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider text-right">
                      Total Sold
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-stone-800/50">
                  {topSellers.map((seller, index) => (
                    <tr
                      key={index}
                      className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors"
                    >
                      <td className="py-3.5 text-xs font-bold text-stone-400 dark:text-stone-500 tabular-nums">
                        #{index + 1}
                      </td>
                      <td className="py-3.5 text-xs font-semibold text-stone-800 dark:text-stone-200">
                        {seller.sellerName}
                      </td>
                      <td className="py-3.5 text-xs font-bold text-stone-900 dark:text-stone-100 text-right tabular-nums">
                        {formatCurrency(seller.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
