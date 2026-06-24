import React, { useEffect, useState, Fragment } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useApolloClient } from '@apollo/client';
import { match } from 'ts-pattern';

// Shell & Global Contexts
import { ShellProvider } from '@contexts/ShellContext';
import { NavShell } from '@components/shell/NavShell';

// Shared Components & Hooks
import { Header } from '@components/Header';
import { usePlocState } from '@hooks/use-ploc-state';
import { UserRole } from '@shared-domain/shared/value-objects/role.vo';
// @ts-ignore
import Spinkit from '../components/Spinkit';

// Auth Module
import { makeApolloAuthRepository } from '@modules/auth/infrastructure/repositories/apollo-auth.repository';
import { makeLoginUseCase } from '@modules/auth/application/use-cases/login';
import { makeRegisterUseCase } from '@modules/auth/application/use-cases/register';
import { makeGetCurrentUserUseCase } from '@modules/auth/application/use-cases/get-current-user';
import { makeLogoutUseCase } from '@modules/auth/application/use-cases/logout';
import { makeAuthPloc } from '@modules/auth/presentation/ploc/auth-ploc';
import { AuthStateKind } from '@modules/auth/presentation/ploc/auth-state';
import { AuthProvider, useAuthPloc } from '@contexts/auth-context';
import LoginPage from '@pages/auth/LoginPage';
import RegisterPage from '@pages/auth/RegisterPage';

// Clients Module
import { makeApolloClientRepository } from '@modules/client/infrastructure/repositories/apollo-client.repository';
import { makeGetClientsUseCase } from '@modules/client/application/use-cases/get-clients';
import { makeDeleteClientUseCase as makeDeleteClientUseCaseObj } from '@modules/client/application/use-cases/delete-client';
import { makeClientsPloc } from '@modules/client/presentation/ploc/clients-ploc';
import { ClientsPlocProvider } from '@contexts/clients-context';
import ClientList from '@pages/client/ClientList';
import NewClient from '@pages/client/NewClient';
import EditClient from '@pages/client/EditClient';

// Products Module
import { makeApolloProductRepository } from '@modules/product/infrastructure/repositories/apollo-product.repository';
import { makeGetProductsUseCase } from '@modules/product/application/use-cases/get-products';
import { makeDeleteProductUseCase } from '@modules/product/application/use-cases/delete-product';
import { makeProductsPloc } from '@modules/product/presentation/ploc/products-ploc';
import { ProductsPlocProvider } from '@contexts/products-context';
import ProductList from '@pages/product/ProductList';
import NewProduct from '@pages/product/NewProduct';
import EditProduct from '@pages/product/EditProduct';

// Orders Module
import { makeApolloOrderRepository } from '@modules/order/infrastructure/repositories/apollo-order.repository';
import { makeGetClientOrdersUseCase } from '@modules/order/application/use-cases/get-client-orders';
import { makeCreateOrderUseCase } from '@modules/order/application/use-cases/create-order';
import { makeUpdateOrderUseCase } from '@modules/order/application/use-cases/update-order';
import { makeOrdersPloc } from '@modules/order/presentation/ploc/order-ploc';
import { OrdersProvider } from '@contexts/order-context';
import ClientOrdersPage from '@pages/order/ClientOrdersPage';
import CreateOrderPage from '@pages/order/CreateOrderPage';

// Dashboard Module
import { makeApolloDashboardRepository } from '@modules/dashboard/infrastructure/repositories/apollo-dashboard.repository';
import { makeGetTopClientsUseCase } from '@modules/dashboard/application/use-cases/get-top-clients';
import { makeGetTopSellersUseCase } from '@modules/dashboard/application/use-cases/get-top-sellers';
import { makeDashboardPloc } from '@modules/dashboard/presentation/ploc/dashboard-ploc';
import { DashboardProvider } from '@contexts/dashboard-context';
import DashboardPage from '@pages/dashboard/DashboardPage';

// Route Wrapper for Products PLoC (Scoped lifecycle)
const ProductsRouteWrapper: React.FC = () => {
  const apolloClient = useApolloClient();

  const [ploc] = useState(() => {
    const repository = makeApolloProductRepository(apolloClient as any);
    const getProducts = makeGetProductsUseCase(repository);
    const deleteProduct = makeDeleteProductUseCase(repository);
    return makeProductsPloc(getProducts, deleteProduct);
  });

  return (
    <ProductsPlocProvider ploc={ploc}>
      <ProductList />
    </ProductsPlocProvider>
  );
};

// Route Wrapper for Clients PLoC (Scoped lifecycle)
const ClientsRouteWrapper: React.FC = () => {
  const authPloc = useAuthPloc();
  const authState = usePlocState(authPloc);
  const apolloClient = useApolloClient();

  const [ploc] = useState(() => {
    const repository = makeApolloClientRepository(apolloClient as any);
    const getClients = makeGetClientsUseCase(repository);
    const deleteClient = makeDeleteClientUseCaseObj(repository);
    return makeClientsPloc(getClients, deleteClient);
  });

  const user = authState.kind === 'auth:authenticated' ? authState.user : null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Cast session info safely
  const sessionInfo = {
    _id: String(user.id),
    rol: user.role === UserRole.ADMIN ? 'adm' : 'seller',
    name: String(user.name),
  };

  return (
    <ClientsPlocProvider ploc={ploc}>
      <ClientList session={sessionInfo} />
    </ClientsPlocProvider>
  );
};

// Route Wrapper for Orders PLoC (Scoped lifecycle)
const OrdersRouteWrapper: React.FC = () => {
  const apolloClient = useApolloClient();

  const [ploc] = useState(() => {
    const repository = makeApolloOrderRepository(apolloClient as any);
    const getClientOrders = makeGetClientOrdersUseCase(repository);
    const createOrder = makeCreateOrderUseCase(repository);
    const updateOrder = makeUpdateOrderUseCase(repository);
    return makeOrdersPloc(getClientOrders, createOrder, updateOrder);
  });

  return (
    <OrdersProvider ploc={ploc}>
      <ClientOrdersPage />
    </OrdersProvider>
  );
};

// Route Wrapper for New Order PLoC (Scoped lifecycle)
const CreateOrderRouteWrapper: React.FC = () => {
  const authPloc = useAuthPloc();
  const authState = usePlocState(authPloc);
  const apolloClient = useApolloClient();

  const [ploc] = useState(() => {
    const repository = makeApolloOrderRepository(apolloClient as any);
    const getClientOrders = makeGetClientOrdersUseCase(repository);
    const createOrder = makeCreateOrderUseCase(repository);
    const updateOrder = makeUpdateOrderUseCase(repository);
    return makeOrdersPloc(getClientOrders, createOrder, updateOrder);
  });

  const user = authState.kind === 'auth:authenticated' ? authState.user : null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const sessionInfo = {
    _id: String(user.id),
    rol: String(user.role) === 'admin' ? 'adm' : 'seller',
    name: String(user.name),
  };

  return (
    <OrdersProvider ploc={ploc}>
      <CreateOrderPage session={sessionInfo} />
    </OrdersProvider>
  );
};

// Route Wrapper for New Client Wrapper (Decoupled session mapping)
const NewClientRouteWrapper: React.FC = () => {
  const authPloc = useAuthPloc();
  const authState = usePlocState(authPloc);

  const user = authState.kind === 'auth:authenticated' ? authState.user : null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const sessionInfo = {
    _id: String(user.id),
    rol: String(user.role) === 'admin' ? 'adm' : 'seller',
    name: String(user.name),
  };

  return <NewClient session={sessionInfo} />;
};

// Route Wrapper for Dashboard PLoC (Scoped lifecycle)
const DashboardRouteWrapper: React.FC = () => {
  const apolloClient = useApolloClient();

  const [ploc] = useState(() => {
    const repository = makeApolloDashboardRepository(apolloClient as any);
    const getTopClients = makeGetTopClientsUseCase(repository);
    const getTopSellers = makeGetTopSellersUseCase(repository);
    return makeDashboardPloc(getTopClients, getTopSellers);
  });

  return (
    <DashboardProvider ploc={ploc}>
      <DashboardPage />
    </DashboardProvider>
  );
};

const AppView: React.FC = () => {
  const ploc = useAuthPloc();
  const state = usePlocState(ploc);

  useEffect(() => {
    // Check session on mount
    ploc.checkSession();
  }, [ploc]);

  return match(state)
    .with({ kind: AuthStateKind.INITIAL }, { kind: AuthStateKind.AUTHENTICATING }, () => (
      <div className="text-center p-5 my-5">
        <Spinkit />
        <p className="text-muted mt-3">Validando sesión...</p>
      </div>
    ))
    .otherwise((st) => {
      const isAuthenticated = st.kind === AuthStateKind.AUTHENTICATED;

      return (
        <Router>
          <NavShell>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={isAuthenticated ? <Navigate to="/clients" replace /> : <LoginPage />} />
              
              {/* Protected Routes */}
              {isAuthenticated ? (
                <Fragment>
                  <Route path="/" element={<Navigate to="/clients" replace />} />
                  
                  {/** Clients */}
                  <Route path="/clients" element={<ClientsRouteWrapper />} />
                  <Route path="/clients/new" element={<NewClientRouteWrapper />} />
                  <Route path="/clients/edit/:id" element={<EditClient />} />

                  {/** Products */}
                  <Route path="/products" element={<ProductsRouteWrapper />} />
                  <Route path="/products/new" element={<NewProduct />} />
                  <Route path="/products/edit/:id" element={<EditProduct />} />

                  {/** Orders */}
                  <Route path="/orders/:id" element={<OrdersRouteWrapper />} />
                  <Route path="/orders/new/:id" element={<CreateOrderRouteWrapper />} />

                  {/** Dashboard */}
                  <Route path="/dashboard" element={<DashboardRouteWrapper />} />

                  {/** Registration (Admin only) */}
                  <Route path="/register" element={<RegisterPage />} />
                </Fragment>
              ) : (
                // Catch all redirect to login for unauthenticated users
                <Route path="*" element={<Navigate to="/login" replace />} />
              )}
            </Routes>
          </NavShell>
        </Router>
      );
    });
};

export const AppRoutes: React.FC = () => {
  const apolloClient = useApolloClient();

  // Root Auth PLoC instantiation (Global session context)
  const [authPloc] = useState(() => {
    const repository = makeApolloAuthRepository(apolloClient as any);
    const login = makeLoginUseCase(repository);
    const register = makeRegisterUseCase(repository);
    const getCurrentUser = makeGetCurrentUserUseCase(repository);
    const logout = makeLogoutUseCase(repository);
    return makeAuthPloc(login, register, getCurrentUser, logout);
  });

  return (
    <ShellProvider>
      <AuthProvider ploc={authPloc}>
        <AppView />
      </AuthProvider>
    </ShellProvider>
  );
};

export default AppRoutes;
