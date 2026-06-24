import React, { useEffect, useState, Fragment } from "react";
import { Link } from "react-router-dom";
import { match } from "ts-pattern";
import { usePlocState } from "@hooks/use-ploc-state";
import { useClientsPloc } from "@contexts/clients-context";
import { Paginator } from "@components/Paginator";
import { ClientsStateKind } from "@modules/client/presentation/ploc/clients-state";
import { Plus, Eye, Edit2, Trash2, ShoppingBag } from "lucide-react";

// @ts-ignore
import Alert from "../../components/Alert";
// @ts-ignore
import Spinkit from "../../components/Spinkit";

interface ClientListProps {
  session: {
    _id: string;
    rol: string;
    name: string;
  };
}

export const ClientList: React.FC<ClientListProps> = ({ session }) => {
  const ploc = useClientsPloc();
  const state = usePlocState(ploc);

  const [deletionSuccess, setDeletionSuccess] = useState<string | null>(null);

  const sellerId = session.rol === "adm" ? "" : session._id;

  useEffect(() => {
    ploc.load(state.currentPage, state.limit, sellerId);
  }, [ploc, sellerId]);

  const handleDelete = async (id: string, lastName: string) => {
    if (window.confirm(`¿Seguro que desea eliminar al cliente ${lastName}?`)) {
      await ploc.deleteClient(id);
      setDeletionSuccess("Se ha eliminado correctamente");
      setTimeout(() => {
        setDeletionSuccess(null);
      }, 4000);
    }
  };

  const handlePaginaAnterior = () => {
    ploc.load(state.currentPage - 1, state.limit, sellerId);
  };

  const handlePaginaSiguiente = () => {
    ploc.load(state.currentPage + 1, state.limit, sellerId);
  };

  const getInitials = (firstName: string, lastName: string) => {
    const f = firstName ? firstName.charAt(0).toUpperCase() : "";
    const l = lastName ? lastName.charAt(0).toUpperCase() : "";
    return `${f}${l}` || "?";
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
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Listado de Clientes
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Gestiona y realiza un seguimiento de los clientes registrados.
          </p>
        </div>
        <div>
          <Link
            to="/clients/new"
            className="inline-flex items-center justify-center h-11 px-5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Cliente
          </Link>
        </div>
      </div>

      {alertComponent}

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
        .with(
          { kind: ClientsStateKind.LOADED },
          { kind: ClientsStateKind.RELOADING },
          (st) => {
            const isReloading = st.kind === ClientsStateKind.RELOADING;

            return (
              <Fragment>
                <div className="relative min-h-[100px]">
                  {isReloading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px] bg-white/40 dark:bg-black/30 rounded-xl transition-all">
                      <Spinkit />
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    {st.clients.map((client) => {
                      const id = client.id!;
                      const initials = getInitials(client.firstName || "", client.lastName || "");

                      return (
                        <div
                          key={id}
                          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl p-5 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-md transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                          {/* Left: Info section with avatar */}
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-sm font-semibold text-stone-700 dark:text-stone-300 shrink-0 select-none">
                              {initials}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-stone-900 dark:text-stone-100">
                                  {client.firstName} {client.lastName}
                                </span>
                                {client.type === "PREMIUM" ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                                    PREMIUM
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-200 dark:border-stone-700/60">
                                    BÁSICO
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-stone-500 dark:text-stone-400">
                                {client.company}
                              </span>
                            </div>
                          </div>

                          {/* Right: Actions Grid */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <Link
                              to={`/orders/new/${id}`}
                              className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                              Nuevo Pedido
                            </Link>

                            <Link
                              to={`/orders/${id}`}
                              className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 active:bg-stone-300 dark:active:bg-stone-600 border border-stone-200 dark:border-stone-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1.5" />
                              Ver Pedidos
                            </Link>

                            <Link
                              to={`/clients/edit/${id}`}
                              className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-xs font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 active:bg-stone-300 dark:active:bg-stone-600 border border-stone-200 dark:border-stone-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                              Editar
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(id, String(client.lastName))
                              }
                              className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 active:bg-red-200 dark:active:bg-red-950/60 border border-red-200 dark:border-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                              Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8">
                  <Paginator
                    actual={st.currentPage}
                    total={st.totalClients}
                    limit={st.limit}
                    paginaAnterior={handlePaginaAnterior}
                    paginaSiguiente={handlePaginaSiguiente}
                  />
                </div>
              </Fragment>
            );
          }
        )
        .exhaustive()}
    </div>
  );
};

export default ClientList;