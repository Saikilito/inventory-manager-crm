import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { GET_CONTEXT_METRICS } from '@modules/product/infrastructure/graphql/queries';
import { formatCurrency } from '@utils/formatters';

interface ProductiveDaysCardProps {
  contextId?: string;
  selectedPeriod: string;
}

export const ProductiveDaysCard: React.FC<ProductiveDaysCardProps> = ({
  contextId,
  selectedPeriod,
}) => {
  const { data, loading } = useQuery(GET_CONTEXT_METRICS, {
    variables: {
      contextId,
      period: selectedPeriod,
    },
    fetchPolicy: 'cache-first',
  });

  const metrics = data?.getContextMetrics;

  // Get daily periods for productive days analysis
  const dailyPeriods = metrics?.periods?.daily || [];

  // Sort by revenue to find most productive days
  const productiveDays = [...dailyPeriods]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3)
    .map((p: { period: string; revenue: number; salesCount: number }) => {
      // Parse period to get day name
      let dayName = p.period;
      try {
        const date = new Date(p.period);
        dayName = date.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric' });
      } catch {
        // Keep original if parsing fails
      }
      
      return {
        day: dayName,
        sales: p.salesCount,
        revenue: p.revenue,
      };
    });

  const getPeriodText = () => {
    switch (selectedPeriod) {
      case 'DAILY':
        return 'últimas horas';
      case 'WEEKLY':
        return 'días de la semana';
      default:
        return 'días del mes';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-stone-200 dark:bg-stone-800 rounded w-40 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-stone-100 dark:bg-stone-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-lg">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">Días Más Productivos</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Cuándo vendes más
          </p>
        </div>
      </div>

      {productiveDays.length > 0 && productiveDays[0].revenue > 0 ? (
        <div className="space-y-2">
          {productiveDays.map((day, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-950/40 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 capitalize">
                    {day.day}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {day.sales} {day.sales === 1 ? 'venta' : 'ventas'}
                  </p>
                </div>
              </div>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(day.revenue)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-stone-400 dark:text-stone-500">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Analizando tus {getPeriodText()}</p>
          <p className="text-xs mt-1">Necesitamos más datos</p>
        </div>
      )}

      {dailyPeriods.length > 0 && (
        <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Basado en {dailyPeriods.length} días de actividad
          </p>
        </div>
      )}
    </div>
  );
};
