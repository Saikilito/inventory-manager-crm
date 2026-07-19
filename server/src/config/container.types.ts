import { IProductRepository } from '../modules/product/application/repositories/product.repository.js';
import { GetProduct } from '../modules/product/application/use-cases/get-product.js';
import { GetAllProducts } from '../modules/product/application/use-cases/get-all-products.js';
import { TotalProducts } from '../modules/product/application/use-cases/total-products.js';
import { CreateProduct } from '../modules/product/application/use-cases/create-product.js';
import { UpdateProduct } from '../modules/product/application/use-cases/update-product.js';
import { DeleteProduct } from '../modules/product/application/use-cases/delete-product.js';

import { IUserRepository } from '../modules/user/application/repositories/user.repository.js';
import { GetUserByEmail } from '../modules/user/application/use-cases/get-user.js';
import { RegisterUser } from '../modules/user/application/use-cases/register-user.js';
import { AuthenticateUser } from '../modules/user/application/use-cases/authenticate-user.js';
import { GetAllUsers } from '../modules/user/application/use-cases/get-all-users.js';
import { UpdateUser } from '../modules/user/application/use-cases/update-user.js';

import { IClientRepository } from '../modules/client/application/repositories/client.repository.js';
import { GetClient } from '../modules/client/application/use-cases/get-client.js';
import { GetAllClients } from '../modules/client/application/use-cases/get-all-clients.js';
import { TotalClients } from '../modules/client/application/use-cases/total-clients.js';
import { CreateClient } from '../modules/client/application/use-cases/create-client.js';
import { UpdateClient } from '../modules/client/application/use-cases/update-client.js';
import { DeleteClient } from '../modules/client/application/use-cases/delete-client.js';
import { RecalculateClientRating } from '../modules/client/application/use-cases/recalculate-client-rating.js';

import { IOrderRepository } from '../modules/order/application/repositories/order.repository.js';
import { GetOrder } from '../modules/order/application/use-cases/get-order.js';
import { GetOrderClient } from '../modules/order/application/use-cases/get-order-client.js';
import { GetAllOrders } from '../modules/order/application/use-cases/get-all-orders.js';
import { TotalOrders } from '../modules/order/application/use-cases/total-orders.js';
import { CreateOrder } from '../modules/order/application/use-cases/create-order.js';
import { UpdateOrder } from '../modules/order/application/use-cases/update-order.js';
import { DeleteOrder } from '../modules/order/application/use-cases/delete-order.js';

import { IDashboardRepository } from '../modules/dashboard/application/repositories/dashboard.repository.js';
import { GetTopClients } from '../modules/dashboard/application/use-cases/get-top-clients.js';
import { GetTopSellers } from '../modules/dashboard/application/use-cases/get-top-sellers.js';

import { IContextRepository } from '../modules/context/application/repositories/context.repository.js';
import { CreateContext } from '../modules/context/application/use-cases/create-context.js';
import { GetContext } from '../modules/context/application/use-cases/get-context.js';
import { GetAllContexts } from '../modules/context/application/use-cases/get-all-contexts.js';
import { UpdateContext } from '../modules/context/application/use-cases/update-context.js';
import { DeleteContext } from '../modules/context/application/use-cases/delete-context.js';
import { GetContextMetrics } from '../modules/context/application/use-cases/get-context-metrics.js';
import { GeneratePdfReport } from '../modules/context/application/use-cases/generate-pdf-report.js';

import { IDeliveryRepository } from '../modules/delivery/application/repositories/delivery.repository.js';
import { GetDelivery } from '../modules/delivery/application/use-cases/get-delivery.js';
import { ScheduleDelivery } from '../modules/delivery/application/use-cases/schedule-delivery.js';
import { UpdateDeliveryStatus } from '../modules/delivery/application/use-cases/update-delivery-status.js';

import { IRentalRepository } from '../modules/rental/application/repositories/rental.repository.js';
import { GetRental } from '../modules/rental/application/use-cases/get-rental.js';
import { CreateRentalReservation } from '../modules/rental/application/use-cases/create-rental-reservation.js';
import { ReturnRental } from '../modules/rental/application/use-cases/return-rental.js';
import { GetOverlappingReservations } from '../modules/rental/application/use-cases/get-overlapping-reservations.js';

import { IExpenseRepository } from '../modules/expense/application/repositories/expense.repository.js';
import { CreateExpense } from '../modules/expense/application/use-cases/create-expense.js';
import { GetExpense } from '../modules/expense/application/use-cases/get-expense.js';
import { GetAllExpenses } from '../modules/expense/application/use-cases/get-all-expenses.js';
import { UpdateExpense } from '../modules/expense/application/use-cases/update-expense.js';
import { DeleteExpense } from '../modules/expense/application/use-cases/delete-expense.js';

import { IFixedExpenseRepository, IFixedExpensePaymentRepository } from '../modules/expense/application/repositories/fixed-expense.repository.js';
import { CreateFixedExpense } from '../modules/expense/application/use-cases/create-fixed-expense.js';
import { UpdateFixedExpense } from '../modules/expense/application/use-cases/update-fixed-expense.js';
import { DeleteFixedExpense } from '../modules/expense/application/use-cases/delete-fixed-expense.js';
import { GetAllFixedExpenses } from '../modules/expense/application/use-cases/get-all-fixed-expenses.js';
import { PayFixedExpense } from '../modules/expense/application/use-cases/pay-fixed-expense.js';
import { UnpayFixedExpense } from '../modules/expense/application/use-cases/unpay-fixed-expense.js';
import { GetFixedExpensePayments } from '../modules/expense/application/use-cases/get-fixed-expense-payments.js';

import { IAccountRepository, ITransactionRepository, IExchangeRateRepository, IFinancialDayRepository } from '../modules/financial/application/repositories/financial.repository.js';
import { CreateAccount } from '../modules/financial/application/use-cases/create-account.js';
import { CreateTransaction } from '../modules/financial/application/use-cases/create-transaction.js';
import { TransferFunds } from '../modules/financial/application/use-cases/transfer-funds.js';
import { UpdateExchangeRate } from '../modules/financial/application/use-cases/update-exchange-rate.js';
import { OpenFinancialDay } from '../modules/financial/application/use-cases/open-financial-day.js';
import { CloseFinancialDay } from '../modules/financial/application/use-cases/close-financial-day.js';
import { GetFinancialDayByDate } from '../modules/financial/application/use-cases/get-financial-day.js';
import { DeleteTransaction } from '../modules/financial/application/use-cases/delete-transaction.js';

import { IChatSessionRepository } from '../modules/chat/application/repositories/chat-session.repository.js';
import { IChatMessageRepository } from '../modules/chat/application/repositories/chat-message.repository.js';
import { IAgentRepository } from '../modules/chat/application/repositories/agent.repository.js';
import { IUnsatisfiedDemandRepository } from '../modules/chat/application/repositories/unsatisfied-demand.repository.js';
import { IBaileysAuthRepository } from '../modules/chat/application/repositories/baileys-auth.repository.js';

import { CheckWorkingHours } from '../modules/chat/application/use-cases/check-working-hours.use-case.js';
import { CalculateDeliveryFee } from '../modules/chat/application/use-cases/calculate-delivery-fee.use-case.js';
import { HandoverToHuman } from '../modules/chat/application/use-cases/handover-to-human.use-case.js';
import { LogUnsatisfiedDemand } from '../modules/chat/application/use-cases/log-unsatisfied-demand.use-case.js';
import { ProcessIncomingMessage, ILlmAdapter } from '../modules/chat/application/use-cases/process-incoming-message.use-case.js';
import { InitializeWhatsApp } from '../modules/chat/application/use-cases/initialize-whatsapp.use-case.js';
import { CreateAgent } from '../modules/chat/application/use-cases/create-agent.use-case.js';
import { UpdateAgent } from '../modules/chat/application/use-cases/update-agent.use-case.js';
import { DeleteAgent } from '../modules/chat/application/use-cases/delete-agent.use-case.js';
import { GetAgents } from '../modules/chat/application/use-cases/get-agents.use-case.js';
import { GetAgent } from '../modules/chat/application/use-cases/get-agent.use-case.js';
import { AssignAgentToSession } from '../modules/chat/application/use-cases/assign-agent-to-session.use-case.js';
import { SendWhisperToAgent } from '../modules/chat/application/use-cases/send-whisper-to-agent.use-case.js';

import { IWhatsAppGateway } from '../modules/chat/infrastructure/services/baileys.gateway.js';

export interface ContainerDependencies {
  productRepository?: IProductRepository;
  userRepository?: IUserRepository;
  clientRepository?: IClientRepository;
  orderRepository?: IOrderRepository;
  dashboardRepository?: IDashboardRepository;
  contextRepository?: IContextRepository;
  deliveryRepository?: IDeliveryRepository;
  rentalRepository?: IRentalRepository;
  accountRepository?: IAccountRepository;
  transactionRepository?: ITransactionRepository;
  exchangeRateRepository?: IExchangeRateRepository;
  financialDayRepository?: IFinancialDayRepository;
  expenseRepository?: IExpenseRepository;
  fixedExpenseRepository?: IFixedExpenseRepository;
  fixedExpensePaymentRepository?: IFixedExpensePaymentRepository;
  chatSessionRepository?: IChatSessionRepository;
  chatMessageRepository?: IChatMessageRepository;
  agentRepository?: IAgentRepository;
  unsatisfiedDemandRepository?: IUnsatisfiedDemandRepository;
  baileysAuthRepository?: IBaileysAuthRepository;
  whatsAppGateway?: IWhatsAppGateway;
  llmAdapter?: ILlmAdapter;
}

export type Container = Readonly<{
  product: Readonly<{
    getProduct: GetProduct;
    getAllProducts: GetAllProducts;
    totalProducts: TotalProducts;
    createProduct: CreateProduct;
    updateProduct: UpdateProduct;
    deleteProduct: DeleteProduct;
  }>;

  user: Readonly<{
    getUserByEmail: GetUserByEmail;
    registerUser: RegisterUser;
    authenticateUser: AuthenticateUser;
    getAllUsers: GetAllUsers;
    updateUser: UpdateUser;
  }>;

  client: Readonly<{
    getClient: GetClient;
    getAllClients: GetAllClients;
    totalClients: TotalClients;
    createClient: CreateClient;
    updateClient: UpdateClient;
    deleteClient: DeleteClient;
    recalculateClientRating: RecalculateClientRating;
  }>;

  order: Readonly<{
    getOrder: GetOrder;
    getOrderClient: GetOrderClient;
    getAllOrders: GetAllOrders;
    totalOrders: TotalOrders;
    createOrder: CreateOrder;
    updateOrder: UpdateOrder;
    deleteOrder: DeleteOrder;
  }>;

  dashboard: Readonly<{
    getTopClients: GetTopClients;
    getTopSellers: GetTopSellers;
  }>;

  context: Readonly<{
    createContext: CreateContext;
    getContext: GetContext;
    getAllContexts: GetAllContexts;
    updateContext: UpdateContext;
    deleteContext: DeleteContext;
    getContextMetrics: GetContextMetrics;
    generatePdfReport: GeneratePdfReport;
  }>;

  delivery: Readonly<{
    getDelivery: GetDelivery;
    scheduleDelivery: ScheduleDelivery;
    updateDeliveryStatus: UpdateDeliveryStatus;
    deliveryRepository: IDeliveryRepository;
  }>;

  rental: Readonly<{
    getRental: GetRental;
    createRentalReservation: CreateRentalReservation;
    returnRentalEquipment: ReturnRental;
    getOverlappingReservations: GetOverlappingReservations;
    rentalRepository: IRentalRepository;
  }>;

  financial: Readonly<{
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
  }>;

  expense: Readonly<{
    createExpense: CreateExpense;
    getExpense: GetExpense;
    getAllExpenses: GetAllExpenses;
    updateExpense: UpdateExpense;
    deleteExpense: DeleteExpense;
    expenseRepository: IExpenseRepository;
    createFixedExpense: CreateFixedExpense;
    updateFixedExpense: UpdateFixedExpense;
    deleteFixedExpense: DeleteFixedExpense;
    getAllFixedExpenses: GetAllFixedExpenses;
    payFixedExpense: PayFixedExpense;
    unpayFixedExpense: UnpayFixedExpense;
    getFixedExpensePayments: GetFixedExpensePayments;
    fixedExpenseRepository: IFixedExpenseRepository;
    fixedExpensePaymentRepository: IFixedExpensePaymentRepository;
  }>;

  chat: Readonly<{
    checkWorkingHours: CheckWorkingHours;
    calculateDeliveryFee: CalculateDeliveryFee;
    handoverToHuman: HandoverToHuman;
    logUnsatisfiedDemand: LogUnsatisfiedDemand;
    processIncomingMessage: ProcessIncomingMessage;
    initializeWhatsApp: InitializeWhatsApp;
    createAgent: CreateAgent;
    updateAgent: UpdateAgent;
    deleteAgent: DeleteAgent;
    getAgents: GetAgents;
    getAgent: GetAgent;
    assignAgentToSession: AssignAgentToSession;
    sendWhisperToAgent: SendWhisperToAgent;
    chatSessionRepository: IChatSessionRepository;
    chatMessageRepository: IChatMessageRepository;
    agentRepository: IAgentRepository;
    unsatisfiedDemandRepository: IUnsatisfiedDemandRepository;
    baileysAuthRepository: IBaileysAuthRepository;
    whatsAppGateway: IWhatsAppGateway;
    llmAdapter: ILlmAdapter;
  }>;
}>;
