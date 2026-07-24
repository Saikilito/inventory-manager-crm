import React, { useEffect, useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { match } from 'ts-pattern';
import { UserRole } from '@shared-domain/shared/value-objects/role.vo';
import { ClientRatingTier } from '@shared-domain/client/client.entity';
import { usePlocState } from '@hooks/use-ploc-state';
import { useClientsPloc } from '@contexts/clients-context';
import { Paginator } from '@components/Paginator';
import { ClientsStateKind } from '@modules/client/presentation/ploc/clients-state';
import { Plus, Edit2, Trash2, Search, MapPin, ArrowRight, Fingerprint, Phone, ShoppingCart } from 'lucide-react';

import Alert from '../../components/Alert';
import Spinkit from '../../components/Spinkit';

interface ClientListProps {
  session: {
    _id: string;
    role: string;
    name: string;
  };
}

export const ClientList: React.FC<ClientListProps> = ({ session }) => {
  const ploc = useClientsPloc();
  const state = usePlocState(ploc);

  const [deletionSuccess, setDeletionSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sellerId = session.role === UserRole.ADMIN ? '' : session._id;

  useEffect(() => {
    ploc.load(state.currentPage, state.limit, sellerId);
  }, [ploc, sellerId]);

  const handleDelete = async (id: string, lastName: string) => {
    if (window.confirm(`Are you sure you want to delete client ${lastName}?`)) {
      await ploc.deleteClient(id);
      setDeletionSuccess('Deleted successfully');
      setTimeout(() => {
        setDeletionSuccess(null);
      }, 4000);
    }
  };

  const handlePrevPage = () => {
    ploc.load(state.currentPage - 1, state.limit, sellerId);
  };

  const handleNextPage = () => {
    ploc.load(state.currentPage + 1, state.limit, sellerId);
  };

  const getInitials = (firstName: string, lastName: string) => {
    const f = firstName ? firstName.charAt(0).toUpperCase() : '';
    const l = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${f}${l}` || '?';
  };

  const alertComponent = deletionSuccess ? (
    <div className="mb-6">
      <Alert message={deletionSuccess} type="success" />
    </div>
  ) : null;

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Clients List</h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Manage and track registered clients.</p>
        </div>
        <div>
          <Link
            to="/clients/new"
            className="inline-flex items-center justify-center h-11 px-5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Link>
        </div>
      </div>

      {alertComponent}

      {/* Search Filter Bar */}
      <div className="relative max-w-md w-full mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-stone-400 dark:text-stone-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search client by name, address, ID or whatsapp..."
          className="block w-full pl-10 pr-4 py-2.5 h-11 text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-stone-400 dark:placeholder-stone-500 shadow-sm transition-all duration-150"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {match(state)
        .with({ kind: ClientsStateKind.LOADING }, () => (
          <div className="flex justify-center py-12">
            <Spinkit />
          </div>
        ))
        .with({ kind: ClientsStateKind.ERROR }, (st) => (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4 rounded-xl text-center text-sm font-medium text-red-800 dark:text-red-300 mb-6">
            <b>Error:</b> {st.errorMessage}
          </div>
        ))
        .with({ kind: ClientsStateKind.LOADED }, { kind: ClientsStateKind.RELOADING }, (st) => {
          const isReloading = st.kind === ClientsStateKind.RELOADING;

          const filteredClients = st.clients.filter((client) => {
            const term = searchQuery.toLowerCase();
            if (!term) return true;

            const firstName = (client.firstName || '').toLowerCase();
            const lastName = (client.lastName || '').toLowerCase();
            const address = (client.address || '').toLowerCase();
            const whatsapp = (client.whatsapp || '').toLowerCase();
            const nationalId = (client.nationalId || '').toLowerCase();
            const fullName = `${firstName} ${lastName}`;

            return (
              firstName.includes(term) ||
              lastName.includes(term) ||
              address.includes(term) ||
              whatsapp.includes(term) ||
              nationalId.includes(term) ||
              fullName.includes(term)
            );
          });

          return (
            <Fragment>
              <div className="relative min-h-[100px]">
                {isReloading && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px] bg-white/40 dark:bg-black/30 rounded-xl transition-all">
                    <Spinkit />
                  </div>
                )}

                {filteredClients.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
                    <p className="text-stone-500 dark:text-stone-400">
                      {searchQuery ? 'No clients found matching the search.' : 'No registered clients.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredClients.map((client) => {
                      const id = client.id!;
                      const initials = getInitials(client.firstName || '', client.lastName || '');

                      return (
                        <div
                          key={id}
                          className="group flex flex-col bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-2xl p-5 hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/30 dark:hover:shadow-emerald-900/10 transition-all duration-300 relative h-full"
                        >
                          {/* Actions Menu */}
                          <div className="absolute top-5 right-5 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm rounded-lg p-0.5 z-10">
                            <Link
                              to={`/clients/edit/${id}`}
                              title="Edit Client"
                              className="p-1.5 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-md transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              type="button"
                              title="Delete Client"
                              onClick={() => handleDelete(id, String(client.lastName))}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Top Header: Avatar + Name + Type */}
                          <div className="flex items-start gap-4 mb-5">
                            <div className="shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg font-bold ring-1 ring-emerald-500/20">
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0 pr-12">
                              <h3 className="font-semibold text-base text-stone-900 dark:text-stone-100 truncate">
                                {client.firstName} {client.lastName}
                              </h3>
                              <div className="mt-1">
                                {client.type === ClientRatingTier.PREMIUM ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                                    PREMIUM
                                  </span>
                                ) : client.type === ClientRatingTier.CONCURRENT ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                                    CONCURRENT
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-200 dark:border-stone-700/60">
                                    BASIC
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Details List (Left Aligned) */}
                          <div className="flex flex-col gap-3.5 text-sm text-stone-600 dark:text-stone-400 mb-6">
                            <div className="flex items-center gap-3">
                              <Fingerprint className="w-4 h-4 text-stone-400 shrink-0" />
                              <span className="truncate">{client.nationalId || 'No ID'}</span>
                            </div>

                            <a
                              href={`https://wa.me/${String(client.whatsapp).replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-3 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group/wa w-fit"
                              title="Chat on WhatsApp"
                            >
                              <Phone className="w-4 h-4 text-stone-400 shrink-0 group-hover/wa:text-emerald-500" />
                              <span className="truncate">{client.whatsapp || 'No phone'}</span>
                            </a>

                            <div className="flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2 leading-relaxed">{client.address || 'No address'}</span>
                            </div>
                          </div>

                          {/* Footer Divider + Bottom Action */}
                          <div className="mt-auto pt-4 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-900/50 px-2 py-1 rounded-md border border-stone-100 dark:border-stone-800">
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold tracking-wide">
                                {client.orders ? client.orders.length : 0} ORDER
                                {client.orders && client.orders.length !== 1 ? 'S' : ''}
                              </span>
                            </div>

                            <Link
                              to={`/orders/${id}`}
                              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors group/link"
                            >
                              View Details
                              <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-8">
                <Paginator
                  currentPage={st.currentPage}
                  totalItems={st.totalClients}
                  pageSize={st.limit}
                  onPrevPage={handlePrevPage}
                  onNextPage={handleNextPage}
                />
              </div>
            </Fragment>
          );
        })
        .exhaustive()}
    </div>
  );
};

export default ClientList;
