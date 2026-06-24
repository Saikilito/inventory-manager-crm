import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { match } from 'ts-pattern';
import { useApolloClient } from '@apollo/client';
import { usePlocState } from '@hooks/use-ploc-state';
import { useOrdersPloc } from '@contexts/order-context';
import { OrderItemCard } from './OrderItemCard';
import { makeApolloProductRepository } from '@modules/product/infrastructure/repositories/apollo-product.repository';
import { makeGetProductsUseCase } from '@modules/product/application/use-cases/get-products';
import { PositiveNumberVO } from '@shared-domain/shared/value-objects/positive-number.vo';
import { OrdersStateKind } from '@modules/order/presentation/ploc/order-state';
import Spinkit from '../../components/Spinkit';
import Alert from '../../components/Alert';
import { ShoppingBag } from 'lucide-react';

export const ClientOrdersPage: React.FC = () => {
  const { id: clientId } = useParams<{ id: string }>();
  const ploc = useOrdersPloc();
  const state = usePlocState(ploc);
  const apolloClient = useApolloClient();

  // Local products Map to solve client-side waterfalls (Rule 7.2)
  const [productMap, setProductMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const fetchProductsAndOrders = async () => {
      if (!clientId) return;

      // 1. Fetch products once at parent level
      const prodRepo = makeApolloProductRepository(apolloClient as any);
      const getProducts = makeGetProductsUseCase(prodRepo);
      const prodResult = await getProducts.execute(PositiveNumberVO.create(100), PositiveNumberVO.create(0));

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

  const handleStatusChange = async (order: any, newStatus: any) => {
    await ploc.updateOrderStatus(order, newStatus);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Title Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-stone-200 dark:border-stone-800 pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-stone-500" />
            Pedidos del Cliente
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Administra, visualiza y actualiza el estado de todos los pedidos asociados a este cliente.
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
                <Alert type="warning" message="Este cliente no tiene pedidos registrados." />
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {st.orders.map((order) => (
                <OrderItemCard
                  key={String(order.id)}
                  order={order}
                  productMap={productMap}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          );
        })
        .exhaustive()}
    </div>
  );
};

export default ClientOrdersPage;
