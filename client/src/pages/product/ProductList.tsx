import React, { useEffect, useState, Fragment } from "react";
import { Link } from "react-router-dom";
import { match } from "ts-pattern";
import { usePlocState } from "@hooks/use-ploc-state";
import { useProductsPloc } from "@contexts/products-context";
import { Paginator } from "@components/Paginator";
import { ProductsStateKind } from "@modules/product/presentation/ploc/products-state";

// @ts-ignore
import Alert from "../../components/Alert";
// @ts-ignore
import Spinkit from "../../components/Spinkit";

export const ProductList: React.FC = () => {
  const ploc = useProductsPloc();
  const state = usePlocState(ploc);

  const [deletionSuccess, setDeletionSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Initial load
    ploc.load(state.currentPage, state.limit);
  }, [ploc]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`¿Seguro que desea eliminar el producto ${name}?`)) {
      await ploc.deleteProduct(id);
      setDeletionSuccess("Se ha eliminado correctamente el producto");
      setTimeout(() => {
        setDeletionSuccess(null);
      }, 4000);
    }
  };

  const handlePaginaAnterior = () => {
    ploc.load(state.currentPage - 1, state.limit);
  };

  const handlePaginaSiguiente = () => {
    ploc.load(state.currentPage + 1, state.limit);
  };

  const alertComponent = deletionSuccess ? (
    <Alert message={deletionSuccess} />
  ) : (
    ""
  );

  return (
    <Fragment>
      <h1 className="text-center mb-3">Productos</h1>
      {alertComponent}

      {match(state)
        .with({ kind: ProductsStateKind.LOADING }, () => (
          <div className="d-flex justify-content-center my-5">
            <Spinkit />
          </div>
        ))
        .with({ kind: ProductsStateKind.ERROR }, (st) => (
          <div className="alert alert-danger text-center" role="alert">
            <b>Error:</b> {st.errorMessage}
          </div>
        ))
        .with(
          { kind: ProductsStateKind.LOADED },
          { kind: ProductsStateKind.RELOADING },
          (st) => {
            const isReloading = st.kind === ProductsStateKind.RELOADING;

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

                  <table className="table">
                    <thead>
                      <tr className="table-primary">
                        <th scope="col">Nombre</th>
                        <th scope="col">Precio</th>
                        <th scope="col">Existencia</th>
                        <th scope="col">Eliminar</th>
                        <th scope="col">Editar</th>
                      </tr>
                    </thead>

                    <tbody>
                      {st.products.map((product) => {
                        const id = product.id!; // Non-null assertion, database products always have an ID
                        const stock = Number(product.stock);

                        let rowClass = "";
                        if (stock < 30) {
                          rowClass = "table-danger text-dark"; // Use dark text for Bootstrap row visibility
                        } else if (stock < 100) {
                          rowClass = "table-warning";
                        }

                        return (
                          <tr key={id} className={rowClass}>
                            <td>{product.name}</td>
                            <td>${product.price}</td>
                            <td>{product.stock}</td>
                            <td>
                              <button
                                className="btn btn-danger"
                                type="button"
                                onClick={() => handleDelete(id, product.name)}
                              >
                                &times; Eliminar
                              </button>
                            </td>
                            <td>
                              <Link
                                to={`/products/edit/${id}`}
                                className="btn btn-success"
                              >
                                Editar Producto
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <Paginator
                  actual={st.currentPage}
                  total={st.totalProducts}
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
export default ProductList;
