import React from "react";
import { Users, Package, ShoppingCart, Shield, Server } from "lucide-react";

interface DBStats {
  clientsCount: number;
  testingClientsCount: number;
  productsCount: number;
  testingProductsCount: number;
  ordersCount: number;
  testingOrdersCount: number;
  usersCount: number;
  testingUsersCount: number;
}

interface DatabaseInventoryGridProps {
  stats: DBStats;
}

export const DatabaseInventoryGrid: React.FC<DatabaseInventoryGridProps> = ({ stats }) => {
  const statItems = [
    {
      label: "Clients",
      total: stats.clientsCount,
      testing: stats.testingClientsCount,
      icon: Users,
      color: "from-blue-500/10 to-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    },
    {
      label: "Products",
      total: stats.productsCount,
      testing: stats.testingProductsCount,
      icon: Package,
      color: "from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: "Orders",
      total: stats.ordersCount,
      testing: stats.testingOrdersCount,
      icon: ShoppingCart,
      color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Team Users",
      total: stats.usersCount,
      testing: stats.testingUsersCount,
      icon: Shield,
      color: "from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
        <Server className="w-5 h-5 text-stone-400" />
        Database Resource Inventory
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((item) => {
          const Icon = item.icon;
          const nonTesting = item.total - item.testing;
          const testingPercentage = item.total > 0 ? (item.testing / item.total) * 100 : 0;

          return (
            <div
              key={item.label}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-stone-500 dark:text-stone-400">{item.label}</p>
                  <h3 className="text-3xl font-black text-stone-950 dark:text-stone-50 mt-1">
                    {item.total}
                  </h3>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-stone-100 dark:border-stone-800/60">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-stone-500">Sandbox Testing</span>
                  <span className="text-amber-500 font-bold">{item.testing}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-stone-500">Production Data</span>
                  <span className="text-stone-800 dark:text-stone-300">{nonTesting}</span>
                </div>

                <div className="relative w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden mt-1">
                  <div
                    style={{ width: `${testingPercentage}%` }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
