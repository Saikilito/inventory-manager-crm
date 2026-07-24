import { makeProductMongooseRepository } from '../../modules/product/infrastructure/repositories/product-mongoose.repository.js';
import { GetProduct, makeGetProduct } from '../../modules/product/application/use-cases/get-product.js';
import { GetAllProducts, makeGetAllProducts } from '../../modules/product/application/use-cases/get-all-products.js';
import { TotalProducts, makeTotalProducts } from '../../modules/product/application/use-cases/total-products.js';
import { CreateProduct, makeCreateProduct } from '../../modules/product/application/use-cases/create-product.js';
import { UpdateProduct, makeUpdateProduct } from '../../modules/product/application/use-cases/update-product.js';
import { DeleteProduct, makeDeleteProduct } from '../../modules/product/application/use-cases/delete-product.js';
import { CreateStockLot, makeCreateStockLot } from '../../modules/product/application/use-cases/create-stock-lot.js';
import { GetStockLots, makeGetStockLots } from '../../modules/product/application/use-cases/get-stock-lots.js';
import { IProductRepository } from '../../modules/product/application/repositories/product.repository.js';
import { IStockLotRepository } from '../../modules/product/application/repositories/stock-lot.repository.js';
import { makeStockLotMongooseRepository } from '../../modules/product/infrastructure/repositories/stock-lot-mongoose.repository.js';
import { LibrarianService } from '../../modules/knowledge/application/services/librarian.service.js';

import { makeUserMongooseRepository } from '../../modules/user/infrastructure/repositories/user-mongoose.repository.js';
import { GetUserByEmail, makeGetUserByEmail } from '../../modules/user/application/use-cases/get-user.js';
import { RegisterUser, makeRegisterUser } from '../../modules/user/application/use-cases/register-user.js';
import { AuthenticateUser, makeAuthenticateUser } from '../../modules/user/application/use-cases/authenticate-user.js';
import { GetAllUsers, makeGetAllUsers } from '../../modules/user/application/use-cases/get-all-users.js';
import { UpdateUser, makeUpdateUser } from '../../modules/user/application/use-cases/update-user.js';
import { IUserRepository } from '../../modules/user/application/repositories/user.repository.js';

import { makeClientMongooseRepository } from '../../modules/client/infrastructure/repositories/client-mongoose.repository.js';
import { GetClient, makeGetClient } from '../../modules/client/application/use-cases/get-client.js';
import { GetAllClients, makeGetAllClients } from '../../modules/client/application/use-cases/get-all-clients.js';
import { TotalClients, makeTotalClients } from '../../modules/client/application/use-cases/total-clients.js';
import { CreateClient, makeCreateClient } from '../../modules/client/application/use-cases/create-client.js';
import { UpdateClient, makeUpdateClient } from '../../modules/client/application/use-cases/update-client.js';
import { DeleteClient, makeDeleteClient } from '../../modules/client/application/use-cases/delete-client.js';
import { RecalculateClientRating, makeRecalculateClientRating } from '../../modules/client/application/use-cases/recalculate-client-rating.js';
import { IClientRepository } from '../../modules/client/application/repositories/client.repository.js';

import { makeOrderMongooseRepository } from '../../modules/order/infrastructure/repositories/order-mongoose.repository.js';
import { GetOrder, makeGetOrder } from '../../modules/order/application/use-cases/get-order.js';
import { GetOrderClient, makeGetOrderClient } from '../../modules/order/application/use-cases/get-order-client.js';
import { GetAllOrders, makeGetAllOrders } from '../../modules/order/application/use-cases/get-all-orders.js';
import { TotalOrders, makeTotalOrders } from '../../modules/order/application/use-cases/total-orders.js';
import { CreateOrder, makeCreateOrder } from '../../modules/order/application/use-cases/create-order.js';
import { UpdateOrder, makeUpdateOrder } from '../../modules/order/application/use-cases/update-order.js';
import { DeleteOrder, makeDeleteOrder } from '../../modules/order/application/use-cases/delete-order.js';
import { IOrderRepository } from '../../modules/order/application/repositories/order.repository.js';

import { makeDashboardMongooseRepository } from '../../modules/dashboard/infrastructure/repositories/dashboard-mongoose.repository.js';
import { GetTopClients, makeGetTopClients } from '../../modules/dashboard/application/use-cases/get-top-clients.js';
import { GetTopSellers, makeGetTopSellers } from '../../modules/dashboard/application/use-cases/get-top-sellers.js';
import { IDashboardRepository } from '../../modules/dashboard/application/repositories/dashboard.repository.js';

import { makeContextMongooseRepository } from '../../modules/context/infrastructure/repositories/context-mongoose.repository.js';
import { CreateContext, makeCreateContext } from '../../modules/context/application/use-cases/create-context.js';
import { GetContext, makeGetContext } from '../../modules/context/application/use-cases/get-context.js';
import { GetAllContexts, makeGetAllContexts } from '../../modules/context/application/use-cases/get-all-contexts.js';
import { UpdateContext, makeUpdateContext } from '../../modules/context/application/use-cases/update-context.js';
import { DeleteContext, makeDeleteContext } from '../../modules/context/application/use-cases/delete-context.js';
import { GetContextMetrics, makeGetContextMetrics } from '../../modules/context/application/use-cases/get-context-metrics.js';
import { GeneratePdfReport, makeGeneratePdfReport } from '../../modules/context/application/use-cases/generate-pdf-report.js';
import { makePdfReportService } from '../../modules/context/infrastructure/services/pdfkit-report-service.js';
import { IContextRepository } from '../../modules/context/application/repositories/context.repository.js';
import { GetBusinessCostMetrics, makeGetBusinessCostMetrics } from '../../modules/context/application/use-cases/get-business-cost-metrics.js';
import { IFixedExpenseRepository } from '../../modules/expense/application/repositories/fixed-expense.repository.js';

import { makeDeliveryMongooseRepository } from '../../modules/delivery/infrastructure/repositories/delivery-mongoose.repository.js';
import { GetDelivery, makeGetDelivery } from '../../modules/delivery/application/use-cases/get-delivery.js';
import { ScheduleDelivery, makeScheduleDelivery } from '../../modules/delivery/application/use-cases/schedule-delivery.js';
import { UpdateDeliveryStatus, makeUpdateDeliveryStatus } from '../../modules/delivery/application/use-cases/update-delivery-status.js';
import { IDeliveryRepository } from '../../modules/delivery/application/repositories/delivery.repository.js';

import { makeRentalMongooseRepository } from '../../modules/rental/infrastructure/repositories/rental-mongoose.repository.js';
import { GetRental, makeGetRental } from '../../modules/rental/application/use-cases/get-rental.js';
import { CreateRentalReservation, makeCreateRentalReservation } from '../../modules/rental/application/use-cases/create-rental-reservation.js';
import { ReturnRental, makeReturnRental } from '../../modules/rental/application/use-cases/return-rental.js';
import { GetOverlappingReservations, makeGetOverlappingReservations } from '../../modules/rental/application/use-cases/get-overlapping-reservations.js';
import { IRentalRepository } from '../../modules/rental/application/repositories/rental.repository.js';

import { IAccountRepository, ITransactionRepository, IExchangeRateRepository, IFinancialDayRepository } from '../../modules/financial/application/repositories/financial.repository.js';
import { IAccountsPayableRepository } from '../../modules/financial/application/repositories/accounts-payable.repository.js';
import { makeAccountMongooseRepository, makeTransactionMongooseRepository, makeExchangeRateMongooseRepository, makeFinancialDayMongooseRepository } from '../../modules/financial/infrastructure/repositories/financial-mongoose.repository.js';
import { makeAccountsPayableMongooseRepository } from '../../modules/financial/infrastructure/repositories/accounts-payable-mongoose.repository.js';
import { CreateAccount, makeCreateAccount } from '../../modules/financial/application/use-cases/create-account.js';
import { CreateTransaction, makeCreateTransaction } from '../../modules/financial/application/use-cases/create-transaction.js';
import { DeleteTransaction, makeDeleteTransaction } from '../../modules/financial/application/use-cases/delete-transaction.js';
import { TransferFunds, makeTransferFunds } from '../../modules/financial/application/use-cases/transfer-funds.js';
import { UpdateExchangeRate, makeUpdateExchangeRate } from '../../modules/financial/application/use-cases/update-exchange-rate.js';
import { OpenFinancialDay, makeOpenFinancialDay } from '../../modules/financial/application/use-cases/open-financial-day.js';
import { CloseFinancialDay, makeCloseFinancialDay } from '../../modules/financial/application/use-cases/close-financial-day.js';
import { GetFinancialDayByDate, makeGetFinancialDayByDate } from '../../modules/financial/application/use-cases/get-financial-day.js';
import { PayAccountsPayable, makePayAccountsPayable } from '../../modules/financial/application/use-cases/pay-accounts-payable.js';
import { GetAccountsPayables, makeGetAccountsPayables } from '../../modules/financial/application/use-cases/get-accounts-payables.js';
import { IExpenseRepository } from '../../modules/expense/application/repositories/expense.repository.js';



export interface ProductSubContainer {
  getProduct: GetProduct;
  getAllProducts: GetAllProducts;
  totalProducts: TotalProducts;
  createProduct: CreateProduct;
  updateProduct: UpdateProduct;
  deleteProduct: DeleteProduct;
  createStockLot: CreateStockLot;
  getStockLots: GetStockLots;
  getStockLot: (id: string) => Promise<any>;
  stockLotRepository: IStockLotRepository;
}

export const buildProductModule = (deps: {
  productRepository?: IProductRepository;
  librarian?: LibrarianService;
  accountRepository?: IAccountRepository;
  transactionRepository?: ITransactionRepository;
  financialDayRepository?: IFinancialDayRepository;
  accountsPayableRepository?: IAccountsPayableRepository;
  expenseRepository?: IExpenseRepository;
}): ProductSubContainer => {
  const productRepository = deps.productRepository ?? makeProductMongooseRepository();
  const stockLotRepository = makeStockLotMongooseRepository();
  const accountsPayableRepository = deps.accountsPayableRepository ?? makeAccountsPayableMongooseRepository();
  
  // Create the actual createStockLot use case with all required dependencies
  const createStockLot = makeCreateStockLot({
    productRepository,
    stockLotRepository,
    accountRepository: deps.accountRepository!,
    transactionRepository: deps.transactionRepository!,
    financialDayRepository: deps.financialDayRepository!,
    accountsPayableRepository,
  });
  
  return {
    getProduct: makeGetProduct(productRepository),
    getAllProducts: makeGetAllProducts(productRepository),
    totalProducts: makeTotalProducts(productRepository),
    createProduct: makeCreateProduct({ productRepository, librarian: deps.librarian }),
    updateProduct: makeUpdateProduct(productRepository),
    deleteProduct: makeDeleteProduct(productRepository),
    createStockLot,
    stockLotRepository,
    getStockLots: makeGetStockLots({ stockLotRepository }),
    getStockLot: async (id: string) => {
      const result = await stockLotRepository.getById(id);
      return result.isFailure ? null : result.getValue();
    },
  };
};

export interface UserSubContainer {
  getUserByEmail: GetUserByEmail;
  registerUser: RegisterUser;
  authenticateUser: AuthenticateUser;
  getAllUsers: GetAllUsers;
  updateUser: UpdateUser;
}

export const buildUserModule = (deps: { userRepository?: IUserRepository }): UserSubContainer => {
  const userRepository = deps.userRepository ?? makeUserMongooseRepository();
  return {
    getUserByEmail: makeGetUserByEmail(userRepository),
    registerUser: makeRegisterUser(userRepository),
    authenticateUser: makeAuthenticateUser(userRepository),
    getAllUsers: makeGetAllUsers(userRepository),
    updateUser: makeUpdateUser(userRepository),
  };
};

export interface ClientSubContainer {
  getClient: GetClient;
  getAllClients: GetAllClients;
  totalClients: TotalClients;
  createClient: CreateClient;
  updateClient: UpdateClient;
  deleteClient: DeleteClient;
  recalculateClientRating: RecalculateClientRating;
}

export const buildClientModule = (deps: {
  clientRepository?: IClientRepository;
  orderRepository: IOrderRepository;
  recalculateClientRating?: RecalculateClientRating;
}): ClientSubContainer => {
  const clientRepository = deps.clientRepository ?? makeClientMongooseRepository();
  const recalculateClientRating =
    deps.recalculateClientRating ?? makeRecalculateClientRating(clientRepository, deps.orderRepository);
  return {
    getClient: makeGetClient(clientRepository),
    getAllClients: makeGetAllClients(clientRepository),
    totalClients: makeTotalClients(clientRepository),
    createClient: makeCreateClient(clientRepository),
    updateClient: makeUpdateClient(clientRepository),
    deleteClient: makeDeleteClient(clientRepository),
    recalculateClientRating,
  };
};

export interface OrderSubContainer {
  getOrder: GetOrder;
  getOrderClient: GetOrderClient;
  getAllOrders: GetAllOrders;
  totalOrders: TotalOrders;
  createOrder: CreateOrder;
  updateOrder: UpdateOrder;
  deleteOrder: DeleteOrder;
}

export const buildOrderModule = (deps: {
  orderRepository?: IOrderRepository;
  productRepository: IProductRepository;
  recalculateClientRating: RecalculateClientRating;
  clientRepository: IClientRepository;
  deliveryRepository: IDeliveryRepository;
}): OrderSubContainer => {
  const orderRepository = deps.orderRepository ?? makeOrderMongooseRepository();
  return {
    getOrder: makeGetOrder(orderRepository),
    getOrderClient: makeGetOrderClient(orderRepository),
    getAllOrders: makeGetAllOrders(orderRepository),
    totalOrders: makeTotalOrders(orderRepository),
    createOrder: makeCreateOrder(orderRepository, deps.productRepository, deps.recalculateClientRating, deps.clientRepository, deps.deliveryRepository),
    updateOrder: makeUpdateOrder(orderRepository, deps.productRepository, deps.recalculateClientRating),
    deleteOrder: makeDeleteOrder(orderRepository, deps.recalculateClientRating),
  };
};

export interface DashboardSubContainer {
  getTopClients: GetTopClients;
  getTopSellers: GetTopSellers;
}

export const buildDashboardModule = (deps: {
  dashboardRepository?: IDashboardRepository;
}): DashboardSubContainer => {
  const dashboardRepository = deps.dashboardRepository ?? makeDashboardMongooseRepository();
  return {
    getTopClients: makeGetTopClients(dashboardRepository),
    getTopSellers: makeGetTopSellers(dashboardRepository),
  };
};

export interface ContextSubContainer {
  createContext: CreateContext;
  getContext: GetContext;
  getAllContexts: GetAllContexts;
  updateContext: UpdateContext;
  deleteContext: DeleteContext;
  getContextMetrics: GetContextMetrics;
  generatePdfReport: GeneratePdfReport;
  getBusinessCostMetrics: GetBusinessCostMetrics;
}

export interface ContextModuleDependencies {
  productRepository: IProductRepository;
  orderRepository: IOrderRepository;
  expenseRepository: IExpenseRepository;
  accountRepository: IAccountRepository;
  contextRepository?: IContextRepository;
  clientRepository: IClientRepository;
  fixedExpenseRepository: IFixedExpenseRepository;
}

export const buildContextModule = (deps: ContextModuleDependencies): ContextSubContainer => {
  const contextRepository = deps.contextRepository ?? makeContextMongooseRepository();
  return {
    createContext: makeCreateContext(contextRepository),
    getContext: makeGetContext(contextRepository),
    getAllContexts: makeGetAllContexts(contextRepository),
    updateContext: makeUpdateContext(contextRepository, deps.productRepository),
    deleteContext: makeDeleteContext(contextRepository, deps.productRepository, deps.expenseRepository),
    getContextMetrics: makeGetContextMetrics(
      deps.productRepository,
      deps.orderRepository,
      contextRepository,
      deps.expenseRepository,
      deps.accountRepository,
    ),
    generatePdfReport: makeGeneratePdfReport(
      makeGetContextMetrics(
        deps.productRepository,
        deps.orderRepository,
        contextRepository,
        deps.expenseRepository,
        deps.accountRepository,
      ),
      makePdfReportService(),
    ),
    getBusinessCostMetrics: makeGetBusinessCostMetrics(
      deps.expenseRepository,
      deps.fixedExpenseRepository,
      deps.clientRepository,
    ),
  };
};

export interface DeliverySubContainer {
  getDelivery: GetDelivery;
  scheduleDelivery: ScheduleDelivery;
  updateDeliveryStatus: UpdateDeliveryStatus;
  deliveryRepository: IDeliveryRepository;
}

export const buildDeliveryModule = (deps: {
  deliveryRepository?: IDeliveryRepository;
  orderRepository: IOrderRepository;
}): DeliverySubContainer => {
  const deliveryRepository = deps.deliveryRepository ?? makeDeliveryMongooseRepository();
  return {
    getDelivery: makeGetDelivery(deliveryRepository),
    scheduleDelivery: makeScheduleDelivery(deliveryRepository),
    updateDeliveryStatus: makeUpdateDeliveryStatus(deliveryRepository, deps.orderRepository),
    deliveryRepository,
  };
};

export interface RentalSubContainer {
  getRental: GetRental;
  createRentalReservation: CreateRentalReservation;
  returnRentalEquipment: ReturnRental;
  getOverlappingReservations: GetOverlappingReservations;
  rentalRepository: IRentalRepository;
}

export const buildRentalModule = (deps: {
  rentalRepository?: IRentalRepository;
  productRepository: IProductRepository;
}): RentalSubContainer => {
  const rentalRepository = deps.rentalRepository ?? makeRentalMongooseRepository();
  return {
    getRental: makeGetRental(rentalRepository),
    createRentalReservation: makeCreateRentalReservation(rentalRepository, deps.productRepository),
    returnRentalEquipment: makeReturnRental(rentalRepository),
    getOverlappingReservations: makeGetOverlappingReservations(rentalRepository),
    rentalRepository,
  };
};

export interface FinancialSubContainer {
  createAccount: CreateAccount;
  createTransaction: CreateTransaction;
  deleteTransaction: DeleteTransaction;
  transferFunds: TransferFunds;
  updateExchangeRate: UpdateExchangeRate;
  openFinancialDay: OpenFinancialDay;
  closeFinancialDay: CloseFinancialDay;
  getFinancialDayByDate: GetFinancialDayByDate;
  payAccountsPayable: PayAccountsPayable;
  getAccountsPayables: GetAccountsPayables;
  getAccountsPayable: (id: string) => Promise<any>;
  accountRepository: IAccountRepository;
  transactionRepository: ITransactionRepository;
  exchangeRateRepository: IExchangeRateRepository;
  financialDayRepository: IFinancialDayRepository;
  accountsPayableRepository: IAccountsPayableRepository;
}

export interface FinancialModuleDependencies {
  accountRepository?: IAccountRepository;
  transactionRepository?: ITransactionRepository;
  exchangeRateRepository?: IExchangeRateRepository;
  financialDayRepository?: IFinancialDayRepository;
  deliveryRepository: IDeliveryRepository;
  expenseRepository: IExpenseRepository;
}

export const buildFinancialModule = (deps: FinancialModuleDependencies): FinancialSubContainer => {
  const accountRepository = deps.accountRepository ?? makeAccountMongooseRepository();
  const transactionRepository = deps.transactionRepository ?? makeTransactionMongooseRepository();
  const exchangeRateRepository = deps.exchangeRateRepository ?? makeExchangeRateMongooseRepository();
  const financialDayRepository = deps.financialDayRepository ?? makeFinancialDayMongooseRepository();
  const accountsPayableRepository = makeAccountsPayableMongooseRepository();

  return {
    createAccount: makeCreateAccount(accountRepository),
    createTransaction: makeCreateTransaction(transactionRepository, accountRepository, financialDayRepository),
    deleteTransaction: makeDeleteTransaction(
      transactionRepository,
      accountRepository,
      financialDayRepository,
      deps.deliveryRepository,
    ),
    transferFunds: makeTransferFunds(transactionRepository, accountRepository, financialDayRepository),
    updateExchangeRate: makeUpdateExchangeRate(exchangeRateRepository),
    openFinancialDay: makeOpenFinancialDay(financialDayRepository, accountRepository),
    closeFinancialDay: makeCloseFinancialDay(financialDayRepository, accountRepository),
    getFinancialDayByDate: makeGetFinancialDayByDate(financialDayRepository, exchangeRateRepository),
    payAccountsPayable: makePayAccountsPayable({
      accountsPayableRepository,
      accountRepository,
      transactionRepository,
      financialDayRepository,
      expenseRepository: deps.expenseRepository,
    }),
    getAccountsPayables: makeGetAccountsPayables({ accountsPayableRepository }),
    getAccountsPayable: async (id: string) => {
      const result = await accountsPayableRepository.getById(id);
      return result.isFailure ? null : result.getValue();
    },
    accountRepository,
    transactionRepository,
    exchangeRateRepository,
    financialDayRepository,
    accountsPayableRepository,
  };
};


