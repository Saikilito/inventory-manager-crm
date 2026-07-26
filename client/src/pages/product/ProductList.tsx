import React, { useEffect, useState, Fragment } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { match } from "ts-pattern";
import { usePlocState } from "@hooks/use-ploc-state";
import { useProductsPloc } from "@contexts/products-context";
import { Paginator } from "@components/Paginator";
import { ProductsStateKind } from "@modules/product/presentation/ploc/products-state";
import { GET_ALL_CONTEXTS } from "@modules/product/infrastructure/graphql/queries";
import type { GQLContext } from "@modules/context/infrastructure/graphql/types";
import {
  DELETION_SUCCESS_TIMEOUT_MS,
  PRODUCT_MESSAGES,
} from "@modules/product/domain/product.constants";
import {
  calculateStockValue,
  calculatePotentialProfit,
} from "@shared-domain/product/product-calculations";
import {
  Plus,
  Layers,
  Boxes,
} from "lucide-react";import Alert from "../../components/Alert";
import Spinkit from "../../components/Spinkit";
import { ProductFilters } from "./components/ProductFilters";
import { ProductSummaryCards } from "./components/ProductSummaryCards";
import { ProductTableRow } from "./components/ProductTableRow";

export const ProductList: React.FC = () => {
  const ploc = useProductsPloc();
  const state = usePlocState(ploc);

  const [deletionSuccess, setDeletionSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: contextsData } = useQuery<{ getAllContexts: GQLContext[] }>(GET_ALL_CONTEXTS);
  const contexts = contextsData?.getAllContexts || [];

  useEffect(() => {
    ploc.load(state.currentPage, state.limit);
  }, [ploc, state.selectedContextId]);

  const handleContextChange = (contextId: string | null) => {
    ploc.selectContext(contextId);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`${PRODUCT_MESSAGES.CONFIRM_DELETE} ${name}?`)) {
      await ploc.deleteProduct(id);
      setDeletionSuccess(PRODUCT_MESSAGES.DELETED);
      setTimeout(() => setDeletionSuccess(null), DELETION_SUCCESS_TIMEOUT_MS);
    }
  };

  const handlePrevPage = () => {
    ploc.load(state.currentPage - 1, state.limit);
  };

  const handleNextPage = () => {
    ploc.load(state.currentPage + 1, state.limit);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Products Catalog
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Manage products, control stock, and track profit margins.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/products/contexts"
            className="inline-flex items-center justify-center h-11 px-5 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-750 active:bg-stone-100 dark:active:bg-stone-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
          >
            <Layers className="w-4 h-4 mr-2" />
            Contexts
          </Link>
          <Link
            to="/stock-lots"
            className="inline-flex items-center justify-center h-11 px-5 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-750 active:bg-stone-100 dark:active:bg-stone-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
          >
            <Boxes className="w-4 h-4 mr-2" />
            Stock Lots
          </Link>
          <Link
            to="/products/new"
            className="inline-flex items-center justify-center h-11 px-5 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-950"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <ProductFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedContextId={state.selectedContextId}
        onContextChange={handleContextChange}
        contexts={contexts}
      />

      {/* Success Alert */}
      {deletionSuccess && (
        <div className="mb-6">
          <Alert message={deletionSuccess} type="success" />
        </div>
      )}

      {/* Content */}
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
        .with({ kind: ProductsStateKind.LOADED }, { kind: ProductsStateKind.RELOADING }, (st) => {
          const isReloading = st.kind === ProductsStateKind.RELOADING;

          const filteredProducts = st.products.filter((product) => {
            const term = searchQuery.toLowerCase();
            if (!term) return true;
            return (product.name || "").toLowerCase().includes(term);
          });

          const totals = filteredProducts.reduce(
            (acc, product) => {
              const purchasePrice = Number(product.purchasePrice) || 0;
              const fallbackPrice = "price" in product ? Number((product as Record<string, unknown>).price) : 0;
              const sellingPrice = Number(product.sellingPrice ?? fallbackPrice) || 0;
              const stock = Number(product.stock) || 0;

              return {
                totalStockValue: acc.totalStockValue + calculateStockValue(purchasePrice, stock),
                totalPotentialProfit: acc.totalPotentialProfit + calculatePotentialProfit(sellingPrice, purchasePrice, stock),
              };
            },
            { totalStockValue: 0, totalPotentialProfit: 0 }
          );

          return (
            <Fragment>
              <ProductSummaryCards
                totalStockValue={totals.totalStockValue}
                totalPotentialProfit={totals.totalPotentialProfit}
              />

              <div className="relative min-h-[100px]">
                {isReloading && (
                  <div className="absolute inset-0 bg-white/40 dark:bg-stone-950/40 backdrop-blur-sm flex justify-center items-center z-10 rounded-xl">
                    <Spinkit />
                  </div>
                )}

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
                    <p className="text-stone-500 dark:text-stone-400">
                      {searchQuery ? "No products found matching the search." : "No products available."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl shadow-sm mb-6">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
                          <th scope="col" className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-left text-sm border-b border-stone-200 dark:border-stone-800">Name</th>
                          <th scope="col" className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-right text-sm border-b border-stone-200 dark:border-stone-800">Purchase</th>
                          <th scope="col" className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-right text-sm border-b border-stone-200 dark:border-stone-800">Selling</th>
                          <th scope="col" className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-right text-sm border-b border-stone-200 dark:border-stone-800">Profit/Unit</th>
                          <th scope="col" className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-right text-sm border-b border-stone-200 dark:border-stone-800">Margin</th>
                          <th scope="col" className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-right text-sm border-b border-stone-200 dark:border-stone-800">Stock</th>
                          <th scope="col" className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-right text-sm border-b border-stone-200 dark:border-stone-800">Stock Value</th>
                          <th scope="col" className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-right text-sm border-b border-stone-200 dark:border-stone-800">Potential</th>
                          <th scope="col" className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-center text-sm border-b border-stone-200 dark:border-stone-800">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                        {filteredProducts.map((product) => (
                          <ProductTableRow key={product.id} product={product} onDelete={handleDelete} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <Paginator
                  currentPage={st.currentPage}
                  totalItems={st.totalProducts}
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

export default ProductList;
