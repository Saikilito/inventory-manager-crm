import { makeProductMongooseRepository } from '../../modules/product/infrastructure/repositories/product-mongoose.repository.js';
import { GetProduct, makeGetProduct } from '../../modules/product/application/use-cases/get-product.js';
import { GetAllProducts, makeGetAllProducts } from '../../modules/product/application/use-cases/get-all-products.js';
import { TotalProducts, makeTotalProducts } from '../../modules/product/application/use-cases/total-products.js';
import { CreateProduct, makeCreateProduct } from '../../modules/product/application/use-cases/create-product.js';
import { UpdateProduct, makeUpdateProduct } from '../../modules/product/application/use-cases/update-product.js';
import { DeleteProduct, makeDeleteProduct } from '../../modules/product/application/use-cases/delete-product.js';
import { IProductRepository } from '../../modules/product/application/repositories/product.repository.js';

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
import { makeAccountMongooseRepository, makeTransactionMongooseRepository, makeExchangeRateMongooseRepository, makeFinancialDayMongooseRepository } from '../../modules/financial/infrastructure/repositories/financial-mongoose.repository.js';
import { CreateAccount, makeCreateAccount } from '../../modules/financial/application/use-cases/create-account.js';
import { CreateTransaction, makeCreateTransaction } from '../../modules/financial/application/use-cases/create-transaction.js';
import { DeleteTransaction, makeDeleteTransaction } from '../../modules/financial/application/use-cases/delete-transaction.js';
import { TransferFunds, makeTransferFunds } from '../../modules/financial/application/use-cases/transfer-funds.js';
import { UpdateExchangeRate, makeUpdateExchangeRate } from '../../modules/financial/application/use-cases/update-exchange-rate.js';
import { OpenFinancialDay, makeOpenFinancialDay } from '../../modules/financial/application/use-cases/open-financial-day.js';
import { CloseFinancialDay, makeCloseFinancialDay } from '../../modules/financial/application/use-cases/close-financial-day.js';
import { GetFinancialDayByDate, makeGetFinancialDayByDate } from '../../modules/financial/application/use-cases/get-financial-day.js';

import { makeExpenseMongooseRepository } from '../../modules/expense/infrastructure/repositories/expense-mongoose.repository.js';
import { makeFixedExpenseMongooseRepository, makeFixedExpensePaymentMongooseRepository } from '../../modules/expense/infrastructure/repositories/fixed-expense-mongoose.repository.js';
import { GetExpense, makeGetExpense } from '../../modules/expense/application/use-cases/get-expense.js';
import { GetAllExpenses, makeGetAllExpenses } from '../../modules/expense/application/use-cases/get-all-expenses.js';
import { CreateExpense, makeCreateExpense } from '../../modules/expense/application/use-cases/create-expense.js';
import { UpdateExpense, makeUpdateExpense } from '../../modules/expense/application/use-cases/update-expense.js';
import { DeleteExpense, makeDeleteExpense } from '../../modules/expense/application/use-cases/delete-expense.js';
import { IExpenseRepository } from '../../modules/expense/application/repositories/expense.repository.js';
import { IFixedExpenseRepository, IFixedExpensePaymentRepository } from '../../modules/expense/application/repositories/fixed-expense.repository.js';
import { makeKnowledgeMongooseRepository } from '../../modules/knowledge/infrastructure/repositories/knowledge-mongoose.repository.js';
import { IKnowledgeRepository } from '../../modules/knowledge/application/repositories/knowledge.repository.js';
import { makeCognitiveRouter } from '../../modules/knowledge/domain/services/cognitive-router.js';
import { CreateKnowledge, makeCreateKnowledge } from '../../modules/knowledge/application/use-cases/create-knowledge.js';
import { UpdateKnowledge, makeUpdateKnowledge } from '../../modules/knowledge/application/use-cases/update-knowledge.js';
import { DeleteKnowledge, makeDeleteKnowledge } from '../../modules/knowledge/application/use-cases/delete-knowledge.js';
import { GetKnowledge, makeGetKnowledge } from '../../modules/knowledge/application/use-cases/get-knowledge.js';
import { GetKnowledgeList, makeGetKnowledgeList } from '../../modules/knowledge/application/use-cases/get-knowledge-list.js';
import { SearchKnowledge, makeSearchKnowledge } from '../../modules/knowledge/application/use-cases/search-knowledge.js';
import { GetPendingKnowledge, makeGetPendingKnowledge } from '../../modules/knowledge/application/use-cases/get-pending-knowledge.js';
import { GetKnowledgeGraph, makeGetKnowledgeGraph } from '../../modules/knowledge/application/use-cases/get-knowledge-graph.js';
import { ApproveKnowledge, makeApproveKnowledge } from '../../modules/knowledge/application/use-cases/approve-knowledge.js';
import { RejectKnowledge, makeRejectKnowledge } from '../../modules/knowledge/application/use-cases/reject-knowledge.js';
import { EnrichKnowledge, makeEnrichKnowledge } from '../../modules/knowledge/application/use-cases/enrich-knowledge.js';
import { makeProductExtractor } from '../../modules/knowledge/application/services/product-extractor.js';
import { makeWebEnricher } from '../../modules/knowledge/application/services/web-enricher.js';
import { makeLibrarianService, LibrarianService, isLibrarianEnabled } from '../../modules/knowledge/application/services/librarian.service.js';
import { GetAllFixedExpenses, makeGetAllFixedExpenses } from '../../modules/expense/application/use-cases/get-all-fixed-expenses.js';
import { GetFixedExpensePayments, makeGetFixedExpensePayments } from '../../modules/expense/application/use-cases/get-fixed-expense-payments.js';
import { CreateFixedExpense, makeCreateFixedExpense } from '../../modules/expense/application/use-cases/create-fixed-expense.js';
import { UpdateFixedExpense, makeUpdateFixedExpense } from '../../modules/expense/application/use-cases/update-fixed-expense.js';
import { DeleteFixedExpense, makeDeleteFixedExpense } from '../../modules/expense/application/use-cases/delete-fixed-expense.js';
import { PayFixedExpense, makePayFixedExpense } from '../../modules/expense/application/use-cases/pay-fixed-expense.js';
import { UnpayFixedExpense, makeUnpayFixedExpense } from '../../modules/expense/application/use-cases/unpay-fixed-expense.js';

export interface ProductSubContainer {
  getProduct: GetProduct;
  getAllProducts: GetAllProducts;
  totalProducts: TotalProducts;
  createProduct: CreateProduct;
  updateProduct: UpdateProduct;
  deleteProduct: DeleteProduct;
}

export const buildProductModule = (deps: {
  productRepository?: IProductRepository;
  librarian?: LibrarianService;
}): ProductSubContainer => {
  const productRepository = deps.productRepository ?? makeProductMongooseRepository();
  return {
    getProduct: makeGetProduct(productRepository),
    getAllProducts: makeGetAllProducts(productRepository),
    totalProducts: makeTotalProducts(productRepository),
    createProduct: makeCreateProduct({ productRepository, librarian: deps.librarian }),
    updateProduct: makeUpdateProduct(productRepository),
    deleteProduct: makeDeleteProduct(productRepository),
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
}): OrderSubContainer => {
  const orderRepository = deps.orderRepository ?? makeOrderMongooseRepository();
  return {
    getOrder: makeGetOrder(orderRepository),
    getOrderClient: makeGetOrderClient(orderRepository),
    getAllOrders: makeGetAllOrders(orderRepository),
    totalOrders: makeTotalOrders(orderRepository),
    createOrder: makeCreateOrder(orderRepository, deps.productRepository, deps.recalculateClientRating),
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
}

export interface ContextModuleDependencies {
  productRepository: IProductRepository;
  orderRepository: IOrderRepository;
  expenseRepository: IExpenseRepository;
  accountRepository: IAccountRepository;
  contextRepository?: IContextRepository;
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
  accountRepository: IAccountRepository;
  transactionRepository: ITransactionRepository;
  exchangeRateRepository: IExchangeRateRepository;
  financialDayRepository: IFinancialDayRepository;
}

export interface FinancialModuleDependencies {
  accountRepository?: IAccountRepository;
  transactionRepository?: ITransactionRepository;
  exchangeRateRepository?: IExchangeRateRepository;
  financialDayRepository?: IFinancialDayRepository;
  deliveryRepository: IDeliveryRepository;
}

export const buildFinancialModule = (deps: FinancialModuleDependencies): FinancialSubContainer => {
  const accountRepository = deps.accountRepository ?? makeAccountMongooseRepository();
  const transactionRepository = deps.transactionRepository ?? makeTransactionMongooseRepository();
  const exchangeRateRepository = deps.exchangeRateRepository ?? makeExchangeRateMongooseRepository();
  const financialDayRepository = deps.financialDayRepository ?? makeFinancialDayMongooseRepository();

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
    accountRepository,
    transactionRepository,
    exchangeRateRepository,
    financialDayRepository,
  };
};

export interface ExpenseSubContainer {
  getExpense: GetExpense;
  getAllExpenses: GetAllExpenses;
  createExpense: CreateExpense;
  updateExpense: UpdateExpense;
  deleteExpense: DeleteExpense;
  getAllFixedExpenses: GetAllFixedExpenses;
  getFixedExpensePayments: GetFixedExpensePayments;
  createFixedExpense: CreateFixedExpense;
  updateFixedExpense: UpdateFixedExpense;
  deleteFixedExpense: DeleteFixedExpense;
  payFixedExpense: PayFixedExpense;
  unpayFixedExpense: UnpayFixedExpense;
}

export const buildExpenseModule = (deps: {
  expenseRepository?: IExpenseRepository;
  fixedExpenseRepository?: IFixedExpenseRepository;
  fixedExpensePaymentRepository?: IFixedExpensePaymentRepository;
}): ExpenseSubContainer => {
  const expenseRepository = deps.expenseRepository ?? makeExpenseMongooseRepository();
  const fixedExpenseRepository = deps.fixedExpenseRepository ?? makeFixedExpenseMongooseRepository();
  const fixedExpensePaymentRepository =
    deps.fixedExpensePaymentRepository ?? makeFixedExpensePaymentMongooseRepository();

  return {
    getExpense: makeGetExpense(expenseRepository),
    getAllExpenses: makeGetAllExpenses(expenseRepository),
    createExpense: makeCreateExpense(expenseRepository),
    updateExpense: makeUpdateExpense(expenseRepository),
    deleteExpense: makeDeleteExpense(expenseRepository),
    getAllFixedExpenses: makeGetAllFixedExpenses(fixedExpenseRepository),
    getFixedExpensePayments: makeGetFixedExpensePayments(fixedExpenseRepository, fixedExpensePaymentRepository),
    createFixedExpense: makeCreateFixedExpense(fixedExpenseRepository),
    updateFixedExpense: makeUpdateFixedExpense(fixedExpenseRepository),
    deleteFixedExpense: makeDeleteFixedExpense(fixedExpenseRepository),
    payFixedExpense: makePayFixedExpense(fixedExpenseRepository, fixedExpensePaymentRepository, expenseRepository),
    unpayFixedExpense: makeUnpayFixedExpense(fixedExpensePaymentRepository, expenseRepository),
  };
};

export interface KnowledgeSubContainer {
  createKnowledge: CreateKnowledge;
  updateKnowledge: UpdateKnowledge;
  deleteKnowledge: DeleteKnowledge;
  getKnowledge: GetKnowledge;
  getKnowledgeList: GetKnowledgeList;
  searchKnowledge: SearchKnowledge;
  getPendingKnowledge: GetPendingKnowledge;
  getKnowledgeGraph: GetKnowledgeGraph;
  approveKnowledge: ApproveKnowledge;
  rejectKnowledge: RejectKnowledge;
  enrichKnowledge: EnrichKnowledge;
  librarian: LibrarianService;
  knowledgeRepository: IKnowledgeRepository;
}

export const buildKnowledgeModule = (deps: {
  knowledgeRepository?: IKnowledgeRepository;
  librarianEnabled?: boolean;
}): KnowledgeSubContainer => {
  const knowledgeRepository = deps.knowledgeRepository ?? makeKnowledgeMongooseRepository();
  const cognitiveRouter = makeCognitiveRouter({
    textSearch: (query, category) => knowledgeRepository.textSearch(query, category),
  });

  const productExtractor = makeProductExtractor();
  const webEnricher = makeWebEnricher();
  const librarian = makeLibrarianService({
    knowledgeRepository,
    productExtractor,
    enabled: deps.librarianEnabled ?? isLibrarianEnabled(process.env.LIBRARIAN_ENABLED),
  });

  return {
    createKnowledge: makeCreateKnowledge(knowledgeRepository),
    updateKnowledge: makeUpdateKnowledge(knowledgeRepository),
    deleteKnowledge: makeDeleteKnowledge(knowledgeRepository),
    getKnowledge: makeGetKnowledge(knowledgeRepository),
    getKnowledgeList: makeGetKnowledgeList(knowledgeRepository),
    searchKnowledge: makeSearchKnowledge({ knowledgeRepository, cognitiveRouter }),
    getPendingKnowledge: makeGetPendingKnowledge(knowledgeRepository),
    getKnowledgeGraph: makeGetKnowledgeGraph(knowledgeRepository),
    approveKnowledge: makeApproveKnowledge(knowledgeRepository),
    rejectKnowledge: makeRejectKnowledge(knowledgeRepository),
    enrichKnowledge: makeEnrichKnowledge({ knowledgeRepository, webEnricher }),
    librarian,
    knowledgeRepository,
  };
};
