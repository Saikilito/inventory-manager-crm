import React, { useEffect, useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { match } from 'ts-pattern';
import { usePlocState } from '@hooks/use-ploc-state';
import { useClientsPloc } from '@contexts/clients-context';
import { Paginator } from '@components/Paginator';
import { ClientsStateKind } from '@modules/client/presentation/ploc/clients-state';
import { Search, Plus, Eye } from 'lucide-react';
// @ts-ignore
import Spinkit from '../../components/Spinkit';

interface OrdersPageProps {
  session: {
    _id: string;
    rol: string;
    name: string;
  };
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ session }) => {
  const ploc = useClientsPloc();
  const state = usePlocState(ploc);
  const [searchQuery, setSearchQuery] = useState('');

  const sellerId = session.rol === 'adm' ? '' : session._id;

  useEffect(() => {
    ploc.load(state.currentPage, state.limit, sellerId);
  }, [ploc, sellerId]);

  const handlePaginaAnterior = () => {
    ploc.load(state.currentPage - 1, state.limit, sellerId);
  };

  const handlePaginaSiguiente = () => {
    ploc.load(state.currentPage + 1, state.limit, sellerId);
  };

  const getInitials = (firstName: string, lastName: string) => {
    const f = firstName ? firstName.charAt(0).toUpperCase() : '';
    const l = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${f}${l}` || '?';
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Gestión de Pedidos
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">
            Seleccioná un cliente para emitir nuevos pedidos o consultar su historial completo.
          </p>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="relative max-w-md w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-stone-400 dark:text-stone-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar cliente por nombre o empresa..."
          className="block w-full pl-10 pr-4 py-2.5 h-11 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-stone-400 dark:placeholder-stone-500 shadow-sm transition-all duration-150"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {match(state)
        .with({ kind: ClientsStateKind.LOADING }, () => (
          <div className="flex justify-center py-12">
            <Spinkit />
          </div>
        ))
        .with({ kind: ClientsStateKind.ERROR }, (st) => (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4 rounded-xl text-center text-sm font-medium text-red-800 dark:text-red-300">
            <b>Error:</b> {st.errorMessage}
          </div>
        ))
        .with(
          { kind: ClientsStateKind.LOADED },
          { kind: ClientsStateKind.RELOADING },
          (st) => {
            const isReloading = st.kind === ClientsStateKind.RELOADING;

            // Apply client-side search filtering
            const filteredClients = st.clients.filter((client) => {
              const term = searchQuery.toLowerCase();
              const firstName = (client.firstName || '').toLowerCase();
              const lastName = (client.lastName || '').toLowerCase();
              const company = (client.company || '').toLowerCase();
              const fullName = `${firstName} ${lastName}`;
              return (
                firstName.includes(term) ||
                lastName.includes(term) ||
                company.includes(term) ||
                fullName.includes(term)
              );
            });

            return (
              <Fragment>
                <div className="relative min-h-[150px]">
                  {isReloading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px] bg-white/40 dark:bg-black/30 rounded-xl transition-all">
                      <Spinkit />
                    </div>
                  )}

                  {filteredClients.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
                      <p className="text-stone-500 dark:text-stone-400">
                        {searchQuery ? 'No se encontraron clientes que coincidan con la búsqueda.' : 'No hay clientes registrados.'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredClients.map((client) => {
                        const id = client.id!;
                        const initials = getInitials(client.firstName || '', client.lastName || '');

                        return (
                          <div
                            key={id}
                            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4"
                          >
                            {/* Card Content (Header & Info) */}
                            <div className="flex items-start gap-4">
                              {/* Avatar */}
                              <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-sm font-semibold text-stone-700 dark:text-stone-300 shrink-0 select-none border border-stone-200/50 dark:border-stone-700/50">
                                {initials}
                              </div>
                              <div className="flex flex-col gap-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-stone-900 dark:text-stone-100 truncate max-w-[150px] sm:max-w-none">
                                    {client.firstName} {client.lastName}
                                  </span>
                                  {client.type === 'PREMIUM' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                                      PREMIUM
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-200 dark:border-stone-700/60">
                                      BÁSICO
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm text-stone-500 dark:text-stone-400 truncate">
                                  {client.company || 'Sin Empresa'}
                                </span>
                              </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100 dark:border-stone-800/60">
                              <Link
                                to={`/orders/new/${id}`}
                                className="inline-flex items-center justify-center h-10 px-3 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-offset-stone-950 transition-colors shadow-sm gap-1.5"
                                aria-label={`Nuevo pedido para ${client.firstName} ${client.lastName}`}
                              >
                                <Plus className="w-4 h-4 shrink-0" />
                                Nuevo Pedido
                              </Link>

                              <Link
                                to={`/orders/${id}`}
                                className="inline-flex items-center justify-center h-10 px-3 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-offset-stone-950 transition-colors gap-1.5"
                                aria-label={`Ver pedidos de ${client.firstName} ${client.lastName}`}
                              >
                                <Eye className="w-4 h-4 shrink-0" />
                                Ver Pedidos
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {filteredClients.length > 0 && (
                  <div className="mt-8">
                    <Paginator
                      actual={st.currentPage}
                      total={st.totalClients}
                      limit={st.limit}
                      paginaAnterior={handlePaginaAnterior}
                      paginaSiguiente={handlePaginaSiguiente}
                    />
                  </div>
                )}
              </Fragment>
            );
          }
        )
        .exhaustive()}
    </div>
  );
};

export default OrdersPage;
