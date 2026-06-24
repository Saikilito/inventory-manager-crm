import React, { useEffect, useState, Fragment } from "react";
import { Link } from "react-router-dom";
import { match } from "ts-pattern";
import { usePlocState } from "@hooks/use-ploc-state";
import { useProductsPloc } from "@contexts/products-context";
import { Paginator } from "@components/Paginator";
import { ProductsStateKind } from "@modules/product/presentation/ploc/products-state";
import { Plus, Edit, Trash2, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

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
    <div className="mb-6">
      <Alert message={deletionSuccess} type="success" />
    </div>
  ) : null;

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Catálogo de Productos
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Gestiona los productos, controla el stock y ajusta precios.
          </p>
        </div>
        <div>
          <Link
            to="/products/new"
            className="inline-flex items-center justify-center h-11 px-5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Link>
        </div>
      </div>

      {alertComponent}

      {match(state)
        .with({ kind: ProductsStateKind.LOADING }, () => (
          <div className="flex justify-center py-12">
            <Spinkit />
          </div>
        ))
        .with({ kind: ProductsStateKind.ERROR }, (st) => (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4 rounded-xl text-center text-sm font-medium text-red-800 dark:text-red-300 mb-6" role="alert">
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
                <div className="relative min-h-[100px]">
                  {isReloading && (
                    <div
                      className="absolute inset-0 bg-white/40 dark:bg-stone-950/40 backdrop-blur-sm flex justify-center items-center z-10 rounded-xl"
                    >
                      <Spinkit />
                    </div>
                  )}

                  <div className="overflow-x-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl shadow-sm mb-6">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
                          <th scope="col" className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-left text-sm border-b border-stone-200 dark:border-stone-800">Nombre</th>
                          <th scope="col" className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-left text-sm border-b border-stone-200 dark:border-stone-800">Precio</th>
                          <th scope="col" className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-left text-sm border-b border-stone-200 dark:border-stone-800">Existencia</th>
                          <th scope="col" className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-left text-sm border-b border-stone-200 dark:border-stone-800">Acciones</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                        {st.products.map((product) => {
                          const id = product.id!; // Non-null assertion, database products always have an ID
                          const stock = Number(product.stock);

                          let stockBadge = null;
                          if (stock < 30) {
                            stockBadge = (
                              <span className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/30 px-2 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {product.stock}
                              </span>
                            );
                          } else if (stock < 100) {
                            stockBadge = (
                              <span className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 px-2 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1">
                                <Info className="w-3.5 h-3.5" />
                                {product.stock}
                              </span>
                            );
                          } else {
                            stockBadge = (
                              <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 px-2 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {product.stock}
                              </span>
                            );
                          }

                          return (
                            <tr key={id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors border-b border-stone-100 dark:border-stone-800/60 last:border-b-0">
                              <td className="px-6 py-4 text-sm font-medium text-stone-900 dark:text-stone-100">{product.name}</td>
                              <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-300 font-mono">${product.price}</td>
                              <td className="px-6 py-4 text-sm">{stockBadge}</td>
                              <td className="px-6 py-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/products/edit/${id}`}
                                    className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 active:bg-stone-300 dark:active:bg-stone-600 transition-colors"
                                  >
                                    <Edit className="w-3.5 h-3.5 mr-1.5" />
                                    Editar
                                  </Link>
                                  <button
                                    className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 active:bg-red-200 dark:active:bg-red-950/60 border border-red-200 dark:border-red-900/30 transition-colors"
                                    type="button"
                                    onClick={() => handleDelete(id, product.name)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                    Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6">
                  <Paginator
                    actual={st.currentPage}
                    total={st.totalProducts}
                    limit={st.limit}
                    paginaAnterior={handlePaginaAnterior}
                    paginaSiguiente={handlePaginaSiguiente}
                  />
                </div>
              </Fragment>
            );
          },
        )
        .exhaustive()}
    </div>
  );
};
export default ProductList;
