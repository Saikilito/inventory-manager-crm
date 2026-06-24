import React, { useEffect, useState, Fragment } from 'react';
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

// @ts-ignore
import Spinkit from '../../components/Spinkit';

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
    <Fragment>
      <h1 className="text-center mb-5">Pedidos del Cliente</h1>

      <div className="row">
        {match(state)
          .with({ kind: OrdersStateKind.LOADING }, () => (
            <div className="col-12 text-center my-5">
              <Spinkit />
            </div>
          ))
          .with({ kind: OrdersStateKind.ERROR }, (st) => (
            <div className="col-12 alert alert-danger text-center" role="alert">
              <b>Error:</b> {st.errorMessage}
            </div>
          ))
          .with({ kind: OrdersStateKind.LOADED }, (st) => {
            if (st.orders.length === 0) {
              return (
                <div className="col-12 alert alert-warning text-center" role="alert">
                  Este cliente no tiene pedidos registrados.
                </div>
              );
            }

            return (
              <Fragment>
                {st.orders.map((order) => (
                  <OrderItemCard
                    key={String(order.id)}
                    order={order}
                    productMap={productMap}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </Fragment>
            );
          })
          .exhaustive()}
      </div>
    </Fragment>
  );
};
export default ClientOrdersPage;
