import React from "react";
import { useApolloClient, ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { Navigate } from "react-router-dom";
import { usePlocState } from "@hooks/use-ploc-state";
import { UserRole } from "@shared-domain/shared/value-objects/role.vo";
import { useAuthPloc } from "@contexts/auth-context";
import { makeApolloProductRepository } from "@modules/product/infrastructure/repositories/apollo-product.repository";
import { makeGetProductsUseCase } from "@modules/product/application/use-cases/get-products";
import { makeDeleteProductUseCase } from "@modules/product/application/use-cases/delete-product";
import { makeProductsPloc } from "@modules/product/presentation/ploc/products-ploc";
import { ProductsPlocProvider } from "@contexts/products-context";
import { makeApolloOrderRepository } from "@modules/order/infrastructure/repositories/apollo-order.repository";
import { makeGetClientOrdersUseCase } from "@modules/order/application/use-cases/get-client-orders";
import { makeCreateOrderUseCase } from "@modules/order/application/use-cases/create-order";
import { makeUpdateOrderUseCase } from "@modules/order/application/use-cases/update-order";
import { makeOrdersPloc } from "@modules/order/presentation/ploc/order-ploc";
import { OrdersProvider } from "@contexts/order-context";
import { makeApolloDashboardRepository } from "@modules/dashboard/infrastructure/repositories/apollo-dashboard.repository";
import { makeGetTopClientsUseCase } from "@modules/dashboard/application/use-cases/get-top-clients";
import { makeGetTopSellersUseCase } from "@modules/dashboard/application/use-cases/get-top-sellers";
import { makeDashboardPloc } from "@modules/dashboard/presentation/ploc/dashboard-ploc";
import { DashboardProvider } from "@contexts/dashboard-context";
import ProductList from "@pages/product/ProductList";
import ClientOrdersPage from "@pages/order/ClientOrdersPage";
import CreateOrderPage from "@pages/order/CreateOrderPage";
import DashboardPage from "@pages/dashboard/DashboardPage";
import { makeApolloExpenseRepository } from "@modules/expense/infrastructure/repositories/apollo-expense.repository";
import { makeApolloFixedExpenseRepository } from "@modules/expense/infrastructure/repositories/apollo-fixed-expense.repository";
import { makeGetExpensesUseCase } from "@modules/expense/application/use-cases/get-expenses";
import { makeCreateExpenseUseCase } from "@modules/expense/application/use-cases/create-expense";
import { makeUpdateExpenseUseCase } from "@modules/expense/application/use-cases/update-expense";
import { makeDeleteExpenseUseCase } from "@modules/expense/application/use-cases/delete-expense";
import { makeExpensePloc } from "@modules/expense/presentation/ploc/expense-ploc";
import { makeFixedExpensePloc } from "@modules/expense/presentation/ploc/fixed-expense-ploc";
import { ExpenseProvider } from "@contexts/expense-context";
import { FixedExpenseProvider } from "@contexts/fixed-expense-context";
import { ExpenseList } from "@pages/expense/ExpenseList";
import { makeApolloFinancialRepository } from "@modules/financial/infrastructure/repositories/apollo-financial.repository";
import { makeFinancialPloc } from "@modules/financial/presentation/ploc/financial-ploc";
import { FinancialProvider } from "@contexts/financial-context";
import { FinancialDashboardPage } from "@pages/financial/FinancialDashboardPage";

const useApollo = (): ApolloClient<NormalizedCacheObject> =>
  useApolloClient() as ApolloClient<NormalizedCacheObject>;

const useAuthSession = (): { _id: string; role: typeof UserRole.ADMIN | typeof UserRole.SELLER; name: string } | null => {
  const authPloc = useAuthPloc();
  const authState = usePlocState(authPloc);
  const user = authState.kind === "auth:authenticated" ? authState.user : null;
  if (!user) return null;
  return {
    _id: String(user.id),
    role: user.role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.SELLER,
    name: String(user.name),
  };
};

export const ProductsRouteWrapper: React.FC = () => {
  const apolloClient = useApollo();
  const [ploc] = React.useState(() => {
    const repository = makeApolloProductRepository(apolloClient);
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

export const OrdersRouteWrapper: React.FC = () => {
  const apolloClient = useApollo();
  const [ploc] = React.useState(() => {
    const repository = makeApolloOrderRepository(apolloClient);
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

export const CreateOrderRouteWrapper: React.FC = () => {
  const apolloClient = useApollo();
  const [ploc] = React.useState(() => {
    const repository = makeApolloOrderRepository(apolloClient);
    const getClientOrders = makeGetClientOrdersUseCase(repository);
    const createOrder = makeCreateOrderUseCase(repository);
    const updateOrder = makeUpdateOrderUseCase(repository);
    return makeOrdersPloc(getClientOrders, createOrder, updateOrder);
  });
  const sessionInfo = useAuthSession();
  if (!sessionInfo) return <Navigate to="/login" replace />;
  return (
    <OrdersProvider ploc={ploc}>
      <CreateOrderPage session={sessionInfo} />
    </OrdersProvider>
  );
};

export const DashboardRouteWrapper: React.FC = () => {
  const apolloClient = useApollo();
  const [ploc] = React.useState(() => {
    const repository = makeApolloDashboardRepository(apolloClient);
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

export const FinancialRouteWrapper: React.FC = () => {
  const apolloClient = useApollo();
  const [ploc] = React.useState(() => {
    const repository = makeApolloFinancialRepository(apolloClient);
    return makeFinancialPloc(repository);
  });
  return (
    <FinancialProvider ploc={ploc}>
      <FinancialDashboardPage />
    </FinancialProvider>
  );
};

export const ExpenseRouteWrapper: React.FC = () => {
  const apolloClient = useApollo();
  const [plocs] = React.useState(() => {
    const expenseRepository = makeApolloExpenseRepository(apolloClient);
    const fixedExpenseRepository = makeApolloFixedExpenseRepository(apolloClient);
    const getExpenses = makeGetExpensesUseCase(expenseRepository);
    const createExpense = makeCreateExpenseUseCase(expenseRepository);
    const updateExpense = makeUpdateExpenseUseCase(expenseRepository);
    const deleteExpense = makeDeleteExpenseUseCase(expenseRepository);
    return {
      expensePloc: makeExpensePloc(getExpenses, createExpense, updateExpense, deleteExpense),
      fixedExpensePloc: makeFixedExpensePloc(fixedExpenseRepository),
    };
  });
  return (
    <ExpenseProvider ploc={plocs.expensePloc}>
      <FixedExpenseProvider ploc={plocs.fixedExpensePloc}>
        <ExpenseList />
      </FixedExpenseProvider>
    </ExpenseProvider>
  );
};
