import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { match } from 'ts-pattern';
import { useApolloClient, ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { usePlocState } from '@hooks/use-ploc-state';
import { useOrdersPloc } from '@contexts/order-context';
import { OrderItemCard } from './OrderItemCard';
import { makeApolloProductRepository } from '@modules/product/infrastructure/repositories/apollo-product.repository';
import { makeGetProductsUseCase } from '@modules/product/application/use-cases/get-products';
import { PositiveNumberVO } from '@shared-domain/shared/value-objects/positive-number.vo';
import { NonNegativeNumberVO } from '@shared-domain/shared/value-objects/non-negative-number.vo';
import { OrdersStateKind } from '@modules/order/presentation/ploc/order-state';
import Spinkit from '../../components/Spinkit';
import Alert from '../../components/Alert';
import { ShoppingBag } from 'lucide-react';
import { Paginator } from '@components/Paginator';
import { IOrder, OrderStatus } from '@shared-domain/order/order.entity';

export const ClientOrdersPage: React.FC = () => {
  const { id: clientId } = useParams<{ id: string }>();
  const ploc = useOrdersPloc();
  const state = usePlocState(ploc);
  const apolloClient = useApolloClient() as ApolloClient<NormalizedCacheObject>;

  // Local products Map to solve client-side waterfalls (Rule 7.2)
  const [productMap, setProductMap] = useState<Map<string, string>>(new Map());

  // Local state for status filtering and pagination of orders
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchProductsAndOrders = async () => {
      if (!clientId) return;

      // 1. Fetch products once at parent level
      const prodRepo = makeApolloProductRepository(apolloClient);
      const getProducts = makeGetProductsUseCase(prodRepo);
      const prodResult = await getProducts.execute(PositiveNumberVO.create(100), NonNegativeNumberVO.create(0));

      if (!prodResult.isFailure) { // Checked with !isFailure!
        const prodData = prodResult.getValue();
        const mapping = new Map<string, string>();
        prodData.products.forEach((p) => {
          mapping.set(String(p.id), String(p.name));
        });
        setProductMap(mapping);
      }

      // 2. Load orders
      await ploc.loadClientOrders(clientId);
    };

    fetchProductsAndOrders();
  }, [clientId, ploc, apolloClient]);

  const handleStatusChange = async (order: IOrder, newStatus: OrderStatus) => {
    await ploc.updateOrderStatus(order, newStatus);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Title Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-stone-200 dark:border-stone-800 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-stone-500" />
            Client Orders
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Manage, view, and update the status of all orders associated with this client.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      {match(state)
        .with({ kind: OrdersStateKind.LOADING }, () => (
          <div className="flex items-center justify-center min-h-[300px]">
            <Spinkit />
          </div>
        ))
        .with({ kind: OrdersStateKind.ERROR }, (st) => (
          <div className="max-w-xl mx-auto">
            <Alert type="error" message={st.errorMessage} />
          </div>
        ))
        .with({ kind: OrdersStateKind.LOADED }, (st) => {
          if (st.orders.length === 0) {
            return (
              <div className="max-w-xl mx-auto py-12">
                <Alert type="warning" message="This client has no registered orders." />
              </div>
            );
          }

          const filteredOrders = st.orders.filter((order) => {
            if (statusFilter === 'ALL') return true;
            return order.status === statusFilter;
          });

          const totalOrders = filteredOrders.length;
          const startIndex = (currentPage - 1) * itemsPerPage;
          const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

          return (
            <div className="space-y-6">
              {/* Filter and Stats Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-stone-100/50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/80 p-4 rounded-2xl">
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'All', value: 'ALL' },
                    { label: 'Pending', value: 'PENDING' },
                    { label: 'Completed', value: 'COMPLETED' },
                    { label: 'Cancelled', value: 'CANCELLED' },
                  ].map((tab) => {
                    const count = tab.value === 'ALL' 
                      ? st.orders.length 
                      : st.orders.filter(o => o.status === tab.value).length;

                    return (
                      <button
                        key={tab.value}
                        onClick={() => {
                          setStatusFilter(tab.value);
                          setCurrentPage(1);
                        }}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                          statusFilter === tab.value
                            ? 'bg-stone-950 text-white dark:bg-white dark:text-stone-950 shadow-sm border border-transparent'
                            : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800/60'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                          statusFilter === tab.value
                            ? 'bg-stone-800 text-stone-200 dark:bg-stone-100 dark:text-stone-800'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {paginatedOrders.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
                  <p className="text-stone-500 dark:text-stone-400 font-medium">
                    No orders found with the selected status.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedOrders.map((order) => (
                    <OrderItemCard
                      key={String(order.id)}
                      order={order}
                      productMap={productMap}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}

              {totalOrders > itemsPerPage && (
                <Paginator
                  currentPage={currentPage}
                  totalItems={totalOrders}
                  pageSize={itemsPerPage}
                  onPrevPage={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  onNextPage={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalOrders / itemsPerPage)))}
                />
              )}
            </div>
          );
        })
        .exhaustive()}
    </div>
  );
};

export default ClientOrdersPage;
