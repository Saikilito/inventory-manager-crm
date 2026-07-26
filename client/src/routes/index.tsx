import React, { useEffect, useState, Fragment } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useApolloClient, ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { match } from "ts-pattern";

import { ShellProvider } from "@contexts/ShellContext";
import { useSystemConfig } from "@contexts/SystemConfigContext";
import { NavShell } from "@components/shell/NavShell";
import { usePlocState } from "@hooks/use-ploc-state";
import { UserRole } from "@shared-domain/shared/value-objects/role.vo";
import Spinkit from "../components/Spinkit";

import { makeApolloAuthRepository } from "@modules/auth/infrastructure/repositories/apollo-auth.repository";
import { makeLoginUseCase } from "@modules/auth/application/use-cases/login";
import { makeRegisterUseCase } from "@modules/auth/application/use-cases/register";
import { makeGetCurrentUserUseCase } from "@modules/auth/application/use-cases/get-current-user";
import { makeLogoutUseCase } from "@modules/auth/application/use-cases/logout";
import { makeGetUsersUseCase } from "@modules/auth/application/use-cases/get-users";
import { makeUpdateUserUseCase } from "@modules/auth/application/use-cases/update-user";
import { makeAuthPloc } from "@modules/auth/presentation/ploc/auth-ploc";
import { AuthStateKind } from "@modules/auth/presentation/ploc/auth-state";
import { AuthProvider, useAuthPloc } from "@contexts/auth-context";
import LoginPage from "@pages/auth/LoginPage";
import UsersPage from "@pages/auth/UsersPage";
import SettingsPage from "@pages/settings/SettingsPage";
import NewProduct from "@pages/product/NewProduct";
import EditProduct from "@pages/product/EditProduct";
import EditClient from "@pages/client/EditClient";
import AgentChatPage from "@pages/chat/AgentChatPage";
import { ProfitDetailPage } from "@pages/dashboard/ProfitDetailPage";
import { AnalyticsPage } from "@pages/dashboard/AnalyticsPage";
import { RentalsPage } from "@pages/rental/RentalsPage";
import { DeliveriesPage } from "@pages/delivery/DeliveriesPage";
import { ContextsPage } from "@pages/context/ContextsPage";
import KnowledgePage from "@pages/knowledge/KnowledgePage";
import { StockLotsPage } from "@pages/stock-lot/StockLotsPage";
import { AccountsPayablesPage } from "@pages/accounts-payable/AccountsPayablesPage";

import {
  ClientsRouteWrapper,
  OrdersPageGlobalWrapper,
  NewClientRouteWrapper,
} from "./wrappers/client-wrappers";
import {
  ProductsRouteWrapper,
  OrdersRouteWrapper,
  CreateOrderRouteWrapper,
  DashboardRouteWrapper,
  FinancialRouteWrapper,
  ExpenseRouteWrapper,
} from "./wrappers/domain-wrappers";

const useApollo = (): ApolloClient<NormalizedCacheObject> =>
  useApolloClient() as ApolloClient<NormalizedCacheObject>;

const AppView: React.FC = () => {
  const ploc = useAuthPloc();
  const state = usePlocState(ploc);
  const { rentalsEnabled } = useSystemConfig();

  useEffect(() => {
    ploc.checkSession();
  }, [ploc]);

  return match(state)
    .with(
      { kind: AuthStateKind.INITIAL },
      { kind: AuthStateKind.AUTHENTICATING },
      () => (
        <div className="text-center p-5 my-5">
          <Spinkit />
          <p className="text-muted mt-3">Validating session...</p>
        </div>
      ),
    )
    .otherwise((st) => {
      const isAuthenticated = st.kind === AuthStateKind.AUTHENTICATED;
      const isAdmin = st.kind === AuthStateKind.AUTHENTICATED && st.user.role === UserRole.ADMIN;

      return (
        <Router>
          <NavShell>
            <Routes>
              <Route
                path="/login"
                element={
                  isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
                }
              />

              {isAuthenticated ? (
                <Fragment>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/clients" element={<ClientsRouteWrapper />} />
                  <Route path="/clients/new" element={<NewClientRouteWrapper />} />
                  <Route path="/clients/edit/:id" element={<EditClient />} />
                  <Route path="/products" element={<ProductsRouteWrapper />} />
                  <Route path="/products/contexts" element={<ContextsPage />} />
                  <Route path="/products/new" element={<NewProduct />} />
                  <Route path="/products/edit/:id" element={<EditProduct />} />
                  <Route path="/orders" element={<OrdersPageGlobalWrapper />} />
                  <Route path="/orders/:id" element={<OrdersRouteWrapper />} />
                  <Route path="/orders/new" element={<CreateOrderRouteWrapper />} />
                  <Route path="/orders/new/:clientId" element={<CreateOrderRouteWrapper />} />
                  <Route path="/dashboard" element={<DashboardRouteWrapper />} />
                  <Route path="/dashboard/profit" element={<ProfitDetailPage />} />
                  <Route path="/dashboard/analytics/:contextId" element={<AnalyticsPage />} />
                  {rentalsEnabled && <Route path="/rentals" element={<RentalsPage />} />}
                  <Route path="/deliveries" element={<DeliveriesPage />} />
                  <Route path="/finance" element={<FinancialRouteWrapper />} />
                  <Route path="/stock-lots" element={<StockLotsPage />} />
                  <Route path="/accounts-payable" element={<AccountsPayablesPage />} />
                  <Route path="/expenses" element={<ExpenseRouteWrapper />} />
                  <Route path="/chat" element={<AgentChatPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route
                    path="/admin/knowledge"
                    element={isAdmin ? <KnowledgePage /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route
                    path="/settings"
                    element={isAdmin ? <SettingsPage /> : <Navigate to="/dashboard" replace />}
                  />
                </Fragment>
              ) : (
                <Route path="*" element={<Navigate to="/login" replace />} />
              )}
            </Routes>
          </NavShell>
        </Router>
      );
    });
};

export const AppRoutes: React.FC = () => {
  const apolloClient = useApollo();

  const [authPloc] = useState(() => {
    const repository = makeApolloAuthRepository(apolloClient);
    const login = makeLoginUseCase(repository);
    const register = makeRegisterUseCase(repository);
    const getCurrentUser = makeGetCurrentUserUseCase(repository);
    const logout = makeLogoutUseCase(repository);
    const getUsers = makeGetUsersUseCase(repository);
    const updateUser = makeUpdateUserUseCase(repository);
    return makeAuthPloc(login, register, getCurrentUser, logout, getUsers, updateUser);
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
