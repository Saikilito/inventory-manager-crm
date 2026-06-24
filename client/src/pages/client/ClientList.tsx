import React, { useEffect, useState, Fragment } from "react";
import { Link } from "react-router-dom";
import { match } from "ts-pattern";
import { usePlocState } from "@hooks/use-ploc-state";
import { useClientsPloc } from "@contexts/clients-context";
import { Paginator } from "@components/Paginator";
import { ClientsStateKind } from "@modules/client/presentation/ploc/clients-state";

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

  const alertComponent = deletionSuccess ? (
    <Alert message={deletionSuccess} />
  ) : (
    ""
  );

  return (
    <Fragment>
      <h2 className="text-center">Listado de clientes</h2>
      {alertComponent}

      {match(state)
        .with({ kind: ClientsStateKind.LOADING }, () => <Spinkit />)
        .with({ kind: ClientsStateKind.ERROR }, (st) => (
          <div className="alert alert-danger text-center" role="alert">
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
                <div className="position-relative">
                  {isReloading && (
                    <div
                      className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center"
                      style={{
                        background: "rgba(255,255,255,0.4)",
                        zIndex: 10,
                      }}
                    >
                      <Spinkit />
                    </div>
                  )}

                  <ul className="list-group">
                    {st.clients.map((client) => {
                      const id = client.id!;

                      return (
                        <li key={id} className="list-group-item">
                          <div className="row justify-content-between align-items-center">
                            <div className="col-md-6 d-flex justify-content-between align-items-center">
                              {client.firstName} {client.lastName} -{" "}
                              {client.company}
                            </div>
                            <div className="col-md-6 d-flex justify-content-end">
                              <Link
                                to={`/orders/new/${id}`}
                                className="btn btn-warning d-block d-md-inline-block mr-1"
                              >
                                &#43; Nuevo Pedido
                              </Link>
                              <Link
                                to={`/orders/${id}`}
                                className="btn btn-primary d-block d-md-inline-block mr-1"
                              >
                                Ver Pedidos
                              </Link>
                              <button
                                className="btn btn-danger d-block d-md-inline-block"
                                type="button"
                                onClick={() =>
                                  handleDelete(id, String(client.lastName))
                                }
                              >
                                &times; Eliminar
                              </button>
                              <Link
                                to={`/clients/edit/${id}`}
                                className="btn btn-success d-block d-md-inline-block ml-1"
                              >
                                Editar clientes
                              </Link>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <Paginator
                  actual={st.currentPage}
                  total={st.totalClients}
                  limit={st.limit}
                  paginaAnterior={handlePaginaAnterior}
                  paginaSiguiente={handlePaginaSiguiente}
                />
              </Fragment>
            );
          },
        )
        .exhaustive()}
    </Fragment>
  );
};
export default ClientList;
