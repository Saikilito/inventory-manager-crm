import React from 'react';
import { Users, UserCheck, ArrowRight } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { TOP_CLIENTS } from '@modules/dashboard/infrastructure/graphql/queries';
import { formatCurrency } from '@utils/formatters';

interface TopClientsCardProps {
  contextId?: string;
}

export const TopClientsCard: React.FC<TopClientsCardProps> = () => {
  const navigate = useNavigate();

  const { data, loading } = useQuery(TOP_CLIENTS, {
    fetchPolicy: 'cache-first',
  });

  const topClients = (data?.topClients || []).slice(0, 5);

  const getClientName = (client: { firstName?: string; lastName?: string }) => {
    if (!client) return 'Cliente';
    const parts = [client.firstName, client.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Cliente';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-stone-200 dark:bg-stone-800 rounded w-32 mb-4" />
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-50">Mejores Clientes</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Quienes más compran
            </p>
          </div>
        </div>
      </div>

      {topClients.length > 0 ? (
        <>
          <div className="space-y-2">
            {topClients.map((item: { total: number; client: { _id: string; firstName?: string; lastName?: string } }, index: number) => (
              <div
                key={item.client._id || index}
                className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-950/40 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                onClick={() => navigate(`/clients/edit/${item.client._id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {getClientName(item.client)}
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Top comprador
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-stone-900 dark:text-stone-50 font-mono">
                    {formatCurrency(item.total)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/clients')}
            className="mt-4 w-full py-2 text-sm font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 flex items-center justify-center gap-1 transition-colors"
          >
            Ver todos los clientes
            <ArrowRight className="w-4 h-4" />
          </button>
        </>
      ) : (
        <div className="text-center py-8 text-stone-400 dark:text-stone-500">
          <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Sin clientes frecuentes aún</p>
          <p className="text-xs mt-1">Registra tus primeras ventas</p>
        </div>
      )}
    </div>
  );
};
