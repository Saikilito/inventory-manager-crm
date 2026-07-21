import React from 'react';
import { Lightbulb, AlertTriangle, TrendingDown, Package, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSuggestionsLogic } from '../hooks/useSuggestionsLogic';
import { match } from 'ts-pattern';

interface SuggestionsCardProps {
  contextId?: string;
}

export const SuggestionsCard: React.FC<SuggestionsCardProps> = ({ contextId }) => {
  const navigate = useNavigate();
  const { suggestions, loading, error } = useSuggestionsLogic(contextId);

  const getPriorityColor = (priority: 'high' | 'medium' | 'low'): string => {
    return match(priority)
      .with('high', () => 'border-rose-500/30 bg-rose-500/5')
      .with('medium', () => 'border-amber-500/30 bg-amber-500/5')
      .with('low', () => 'border-blue-500/30 bg-blue-500/5')
      .exhaustive();
  };

  const getTypeIcon = (type: 'low_rotation' | 'low_margin' | 'restock') => {
    return match(type)
      .with('low_rotation', () => <TrendingDown className="w-4 h-4 text-amber-500" />)
      .with('low_margin', () => <AlertTriangle className="w-4 h-4 text-rose-500" />)
      .with('restock', () => <Package className="w-4 h-4 text-blue-500" />)
      .exhaustive();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 w-1/3 bg-stone-100 dark:bg-stone-800 rounded mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-stone-100 dark:bg-stone-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm text-stone-500 dark:text-stone-400">Error loading suggestions</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">Sugerencias</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Recomendaciones para mejorar tu negocio</p>
        </div>
      </div>

      {suggestions.length > 0 ? (
        <>
          <div className="space-y-2">
            {suggestions.slice(0, 5).map((suggestion, index) => (
              <div
                key={`${suggestion.productId}-${index}`}
                className={`p-3 rounded-lg border cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors ${getPriorityColor(
                  suggestion.priority
                )}`}
                onClick={() => navigate(`/products/edit/${suggestion.productId}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getTypeIcon(suggestion.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                        {suggestion.productName}
                      </p>
                      {suggestion.priority === 'high' && (
                        <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                          URGENTE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{suggestion.reason}</p>
                    <p className="text-xs text-stone-600 dark:text-stone-300 font-medium mt-1">
                      💡 {suggestion.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/products')}
            className="mt-4 w-full py-2 text-sm font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 flex items-center justify-center gap-1 transition-colors"
          >
            Gestionar productos
            <ArrowRight className="w-4 h-4" />
          </button>
        </>
      ) : (
        <div className="text-center py-8 text-stone-400 dark:text-stone-500">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Todo va bien por ahora</p>
          <p className="text-xs mt-1">No hay sugerencias pendientes</p>
        </div>
      )}

      {/* Info footer explaining calculation metrics */}
      <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
        <p className="text-[10px] text-stone-400 dark:text-stone-500">
          Las sugerencias se basan en tu rotación de productos, márgenes de ganancia y niveles de stock.
        </p>
      </div>
    </div>
  );
};
