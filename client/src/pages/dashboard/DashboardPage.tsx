import React, { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { match } from 'ts-pattern';
import { usePlocState } from '@hooks/use-ploc-state';
import { useDashboardPloc } from '@contexts/dashboard-context';
import { DashboardStateKind } from '@modules/dashboard/presentation/ploc/dashboard-state';
import { useShell } from '@contexts/ShellContext';
import { DollarSign, Users, Award, TrendingUp, Inbox } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const color = payload[0].fill || payload[0].color;
    return (
      <div className="bg-white/80 dark:bg-stone-950/85 backdrop-blur-md border border-stone-200 dark:border-stone-800 p-3 rounded-lg shadow-xl text-xs font-medium text-stone-800 dark:text-stone-200">
        <p className="font-semibold text-stone-900 dark:text-stone-50 mb-1">{label}</p>
        <p className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
          <span>Total:</span>
          <span className="font-bold text-stone-900 dark:text-stone-50 tabular-nums">
            {formatCurrency(value)}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title area skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-stone-200 dark:bg-stone-800 rounded-lg w-48" />
        <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-96" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 flex items-center justify-between">
            <div className="space-y-3 w-1/2">
              <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-16" />
              <div className="h-6 bg-stone-200 dark:bg-stone-800 rounded w-24" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-stone-200 dark:bg-stone-800" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-4">
          <div className="h-5 bg-stone-200 dark:bg-stone-800 rounded w-48" />
          <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-32" />
          <div className="h-[250px] bg-stone-200 dark:bg-stone-800 rounded-lg" />
        </div>
        <div className="lg:col-span-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-4">
          <div className="h-5 bg-stone-200 dark:bg-stone-800 rounded w-48" />
          <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-32" />
          <div className="h-[250px] bg-stone-200 dark:bg-stone-800 rounded-lg" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-4">
        <div className="h-5 bg-stone-200 dark:bg-stone-800 rounded w-36" />
        <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-64" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between border-b border-stone-100 dark:border-stone-800/50 pb-2">
              <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-1/4" />
              <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const ploc = useDashboardPloc();
  const state = usePlocState(ploc);
  const { theme } = useShell();
  const isDark = theme === 'dark';

  useEffect(() => {
    ploc.loadStats();
  }, [ploc]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {match(state)
        .with({ kind: DashboardStateKind.LOADING }, () => <DashboardSkeleton />)
        .with({ kind: DashboardStateKind.ERROR }, (st) => (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4 animate-[fadeIn_0.3s_ease-out]">
            <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 rounded-2xl">
              <TrendingUp className="w-8 h-8 rotate-180" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">Error al cargar datos</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {st.errorMessage || "No se pudieron obtener las estadísticas del dashboard. Por favor, intente nuevamente."}
              </p>
            </div>
            <button
              onClick={() => ploc.loadStats()}
              className="px-4 py-2 bg-stone-900 dark:bg-stone-50 text-white dark:text-stone-900 font-semibold rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors text-xs"
            >
              Reintentar
            </button>
          </div>
        ))
        .with({ kind: DashboardStateKind.LOADED }, (st) => {
          // Calculate Dynamic KPI Metrics during render (Vercel Best Practice 5.1)
          const totalIngresos = st.topClients.reduce((sum, item) => sum + item.total, 0);
          const activeClientsCount = new Set(st.topClients.map((c) => c.clientName)).size;
          const registeredSellersCount = new Set(st.topSellers.map((s) => s.sellerName)).size;
          const maxSale = st.topClients.length > 0 ? Math.max(...st.topClients.map((c) => c.total)) : 0;

          return (
            <div className="space-y-8 animate-[fadeIn_0.4s_ease-out]">
              {/* Header Title Area */}
              <div>
                <h1 className="text-3xl font-black text-stone-900 dark:text-stone-50 tracking-tight">
                  Dashboard Analítico
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5 font-medium">
                  Monitoreo en tiempo real de ventas, vendedores e inventario.
                </p>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                
                {/* Row 1: KPI Metrics Cards */}
                {/* Card 1: Total Ingresos */}
                <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Ventas Completadas
                    </p>
                    <p className="text-2xl font-bold text-stone-900 dark:text-stone-50 mt-1.5 tabular-nums">
                      {formatCurrency(totalIngresos)}
                    </p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-505 mt-0.5">
                      Total Ingresos
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>

                {/* Card 2: Clientes Activos */}
                <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Compradores en el CRM
                    </p>
                    <p className="text-2xl font-bold text-stone-900 dark:text-stone-50 mt-1.5 tabular-nums">
                      {activeClientsCount}
                    </p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-505 mt-0.5">
                      Clientes Activos
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                {/* Card 3: Vendedores */}
                <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Vendedores estrella
                    </p>
                    <p className="text-2xl font-bold text-stone-900 dark:text-stone-50 mt-1.5 tabular-nums">
                      {registeredSellersCount}
                    </p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-505 mt-0.5">
                      Vendedores Registrados
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                {/* Card 4: Venta Máxima */}
                <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Compra más alta registrada
                    </p>
                    <p className="text-2xl font-bold text-stone-900 dark:text-stone-50 mt-1.5 tabular-nums">
                      {formatCurrency(maxSale)}
                    </p>
                    <p className="text-[10px] text-stone-400 dark:text-stone-505 mt-0.5">
                      Venta Máxima
                    </p>
                  </div>
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>

                {/* Row 2: Data Visualizations */}
                {/* Top Clients Chart */}
                <div className="col-span-12 lg:col-span-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl p-6 shadow-sm flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
                      Top Clientes que más compran
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
                      Clientes líderes por monto total acumulado de compras completadas.
                    </p>
                  </div>
                  {st.topClients.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[250px] p-6 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-lg">
                      <Inbox className="w-8 h-8 text-stone-400 dark:text-stone-600 mb-2" />
                      <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">No hay ventas registradas</p>
                      <p className="text-xs text-stone-400 dark:text-stone-505 mt-1">Las estadísticas se actualizarán una vez se completen pedidos.</p>
                    </div>
                  ) : (
                    <div className="w-full h-[280px]">
                      <ResponsiveContainer width="100%" aspect={16 / 9}>
                        <BarChart
                          data={st.topClients}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={isDark ? 0.05 : 0.1} stroke={isDark ? '#e7e5e4' : '#292524'} />
                          <XAxis 
                            dataKey="clientName" 
                            stroke={isDark ? '#a8a29e' : '#78716c'}
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            dy={8}
                            tickFormatter={(val) => val.length > 12 ? `${val.substring(0, 10)}...` : val}
                          />
                          <YAxis 
                            stroke={isDark ? '#a8a29e' : '#78716c'}
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                            dx={-8}
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }} />
                          <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Top Sellers Chart */}
                <div className="col-span-12 lg:col-span-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl p-6 shadow-sm flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
                      Top Vendedores de la temporada
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
                      Asesores con el mayor volumen de facturación por pedidos completados.
                    </p>
                  </div>
                  {st.topSellers.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[250px] p-6 text-center border border-dashed border-stone-200 dark:border-stone-800 rounded-lg">
                      <Inbox className="w-8 h-8 text-stone-400 dark:text-stone-600 mb-2" />
                      <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">No hay ventas registradas</p>
                      <p className="text-xs text-stone-400 dark:text-stone-505 mt-1">Las estadísticas se actualizarán una vez se completen pedidos.</p>
                    </div>
                  ) : (
                    <div className="w-full h-[280px]">
                      <ResponsiveContainer width="100%" aspect={16 / 9}>
                        <BarChart
                          data={st.topSellers}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={isDark ? 0.05 : 0.1} stroke={isDark ? '#e7e5e4' : '#292524'} />
                          <XAxis 
                            dataKey="sellerName" 
                            stroke={isDark ? '#a8a29e' : '#78716c'}
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            dy={8}
                            tickFormatter={(val) => val.length > 12 ? `${val.substring(0, 10)}...` : val}
                          />
                          <YAxis 
                            stroke={isDark ? '#a8a29e' : '#78716c'}
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                            dx={-8}
                          />
                          <Tooltip content={<CustomTooltip />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }} />
                          <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Row 3: Bento Details */}
                <div className="col-span-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-sm">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">Resumen Detallado</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Comparativa de rendimiento y participación en ventas entre clientes y vendedores.</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Clientes Table */}
                    <div>
                      <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-3 bg-blue-500 rounded-full" />
                        Ranking de Clientes
                      </h4>
                      {st.topClients.length === 0 ? (
                        <p className="text-xs text-stone-400 dark:text-stone-505 py-4">No hay clientes registrados.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-stone-100 dark:border-stone-800">
                                <th className="py-2.5 text-xs font-bold text-stone-400 dark:text-stone-505 uppercase tracking-wider w-12">Pos</th>
                                <th className="py-2.5 text-xs font-bold text-stone-400 dark:text-stone-505 uppercase tracking-wider">Cliente</th>
                                <th className="py-2.5 text-xs font-bold text-stone-400 dark:text-stone-505 uppercase tracking-wider text-right">Total Comprado</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50 dark:divide-stone-800/50">
                              {st.topClients.map((client, index) => (
                                <tr key={index} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors">
                                  <td className="py-3.5 text-xs font-bold text-stone-400 dark:text-stone-505 tabular-nums">#{index + 1}</td>
                                  <td className="py-3.5 text-xs font-semibold text-stone-800 dark:text-stone-200">{client.clientName}</td>
                                  <td className="py-3.5 text-xs font-bold text-stone-900 dark:text-stone-100 text-right tabular-nums">{formatCurrency(client.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Vendedores Table */}
                    <div>
                      <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-3 bg-emerald-500 rounded-full" />
                        Ranking de Vendedores
                      </h4>
                      {st.topSellers.length === 0 ? (
                        <p className="text-xs text-stone-400 dark:text-stone-505 py-4">No hay vendedores registrados.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-stone-100 dark:border-stone-800">
                                <th className="py-2.5 text-xs font-bold text-stone-400 dark:text-stone-505 uppercase tracking-wider w-12">Pos</th>
                                <th className="py-2.5 text-xs font-bold text-stone-400 dark:text-stone-505 uppercase tracking-wider">Vendedor</th>
                                <th className="py-2.5 text-xs font-bold text-stone-400 dark:text-stone-505 uppercase tracking-wider text-right">Total Vendido</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50 dark:divide-stone-800/50">
                              {st.topSellers.map((seller, index) => (
                                <tr key={index} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors">
                                  <td className="py-3.5 text-xs font-bold text-stone-400 dark:text-stone-505 tabular-nums">#{index + 1}</td>
                                  <td className="py-3.5 text-xs font-semibold text-stone-800 dark:text-stone-200">{seller.sellerName}</td>
                                  <td className="py-3.5 text-xs font-bold text-stone-900 dark:text-stone-100 text-right tabular-nums">{formatCurrency(seller.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })
        .exhaustive()}
    </div>
  );
};

export default DashboardPage;
