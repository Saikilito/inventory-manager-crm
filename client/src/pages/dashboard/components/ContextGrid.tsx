import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { ArrowRight, Building2, TrendingUp, TrendingDown } from 'lucide-react';
import { GET_ALL_CONTEXTS } from '@modules/product/infrastructure/graphql/queries';
import { GET_CONTEXT_METRICS } from '@modules/product/infrastructure/graphql/queries';
import { formatCurrency } from '@utils/formatters';

export const ContextGrid: React.FC = () => {
  const navigate = useNavigate();

  const { data: contextsData, loading: loadingContexts } = useQuery(GET_ALL_CONTEXTS, {
    fetchPolicy: 'cache-and-network',
  });

  const contexts: Array<{ _id: string; name: string }> = contextsData?.getAllContexts || [];

  // Get metrics for each context (top 6)
  const topContexts = contexts.slice(0, 6);

  return (
    <div className="col-span-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">Tus Negocios</h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Selecciona uno para ver analytics detallado
            </p>
          </div>
        </div>
        {contexts.length > 6 && (
          <button
            onClick={() => navigate('/products/contexts')}
            className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
          >
            Ver todos ({contexts.length})
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {loadingContexts ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 bg-stone-100 dark:bg-stone-800 rounded-xl" />
          ))}
        </div>
      ) : topContexts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {topContexts.map((context) => (
            <ContextCard
              key={context._id}
              contextId={context._id}
              contextName={context.name}
              onClick={() => navigate(`/dashboard/analytics/${context._id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-stone-400 dark:text-stone-500">
          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No tienes negocios configurados</p>
          <button
            onClick={() => navigate('/products/contexts')}
            className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            Crear un negocio
          </button>
        </div>
      )}

      {/* General Analytics Button */}
      <button
        onClick={() => navigate('/dashboard/analytics/general')}
        className="mt-4 w-full py-3 bg-stone-50 dark:bg-stone-950/40 border border-stone-200 dark:border-stone-800 rounded-xl text-sm font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
      >
        <Building2 className="w-4 h-4" />
        Ver Analytics General (todos los negocios)
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// Individual context card
const ContextCard: React.FC<{
  contextId: string;
  contextName: string;
  onClick: () => void;
}> = ({ contextId, contextName, onClick }) => {
  const { data } = useQuery(GET_CONTEXT_METRICS, {
    variables: { contextId, period: 'MONTHLY' },
    fetchPolicy: 'cache-first',
    skip: !contextId,
  });

  const metrics = data?.getContextMetrics;
  const netProfit = metrics?.netProfit || 0;
  const profitTrend = metrics?.profitTrend;

  return (
    <button
      onClick={onClick}
      className="p-4 bg-stone-50 dark:bg-stone-950/40 border border-stone-200 dark:border-stone-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all text-left group"
    >
      <p className="text-sm font-bold text-stone-900 dark:text-stone-50 truncate">
        {contextName}
      </p>
      <p className="text-lg font-black text-stone-900 dark:text-stone-50 font-mono mt-1">
        {formatCurrency(netProfit)}
      </p>
      <div className="flex items-center gap-1 mt-1">
        {profitTrend !== null && profitTrend !== undefined ? (
          <>
            {profitTrend >= 0 ? (
              <TrendingUp className="w-3 h-3 text-emerald-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-rose-500" />
            )}
            <span
              className={`text-[10px] font-bold ${
                profitTrend >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {profitTrend >= 0 ? '+' : ''}
              {profitTrend.toFixed(0)}%
            </span>
          </>
        ) : (
          <span className="text-[10px] text-stone-400">Sin datos</span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
        Ver detalles
        <ArrowRight className="w-3 h-3" />
      </div>
    </button>
  );
};
