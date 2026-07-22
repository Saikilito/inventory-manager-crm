import { pubSubInstance } from '../modules/chat/infrastructure/pubsub.js';
import config from './index.js';
import {
  buildChatModule,
  type ChatSubContainer,
} from './container/chat-module.js';
import {
  buildProductModule,
  buildUserModule,
  buildClientModule,
  buildOrderModule,
  buildDashboardModule,
  buildContextModule,
  buildDeliveryModule,
  buildRentalModule,
  buildFinancialModule,
  type ProductSubContainer,
  type UserSubContainer,
  type ClientSubContainer,
  type OrderSubContainer,
  type DashboardSubContainer,
  type ContextSubContainer,
  type DeliverySubContainer,
  type RentalSubContainer,
  type FinancialSubContainer,
} from './container/other-modules.js';
import {
  buildExpenseModule,
  type ExpenseSubContainer,
} from './container/expense-module.js';
import {
  buildKnowledgeModule,
  type KnowledgeSubContainer,
} from './container/knowledge-module.js';
import { makeProductMongooseRepository } from '../modules/product/infrastructure/repositories/product-mongoose.repository.js';
import { makeUserMongooseRepository } from '../modules/user/infrastructure/repositories/user-mongoose.repository.js';
import { makeClientMongooseRepository } from '../modules/client/infrastructure/repositories/client-mongoose.repository.js';
import { makeOrderMongooseRepository } from '../modules/order/infrastructure/repositories/order-mongoose.repository.js';
import { makeDashboardMongooseRepository } from '../modules/dashboard/infrastructure/repositories/dashboard-mongoose.repository.js';
import { makeContextMongooseRepository } from '../modules/context/infrastructure/repositories/context-mongoose.repository.js';
import { makeDeliveryMongooseRepository } from '../modules/delivery/infrastructure/repositories/delivery-mongoose.repository.js';
import { makeRentalMongooseRepository } from '../modules/rental/infrastructure/repositories/rental-mongoose.repository.js';
import {
  makeAccountMongooseRepository,
  makeTransactionMongooseRepository,
  makeExchangeRateMongooseRepository,
  makeFinancialDayMongooseRepository,
} from '../modules/financial/infrastructure/repositories/financial-mongoose.repository.js';
import { makeExpenseMongooseRepository } from '../modules/expense/infrastructure/repositories/expense-mongoose.repository.js';
import { makeFixedExpenseMongooseRepository, makeFixedExpensePaymentMongooseRepository } from '../modules/expense/infrastructure/repositories/fixed-expense-mongoose.repository.js';
import { IKnowledgeRepository } from '../modules/knowledge/application/repositories/knowledge.repository.js';
import { makeKnowledgeMongooseRepository } from '../modules/knowledge/infrastructure/repositories/knowledge-mongoose.repository.js';
import { IProductRepository } from '../modules/product/application/repositories/product.repository.js';
import { IUserRepository } from '../modules/user/application/repositories/user.repository.js';
import { IClientRepository } from '../modules/client/application/repositories/client.repository.js';
import { IOrderRepository } from '../modules/order/application/repositories/order.repository.js';
import { IDashboardRepository } from '../modules/dashboard/application/repositories/dashboard.repository.js';
import { IContextRepository } from '../modules/context/application/repositories/context.repository.js';
import { IDeliveryRepository } from '../modules/delivery/application/repositories/delivery.repository.js';
import { IRentalRepository } from '../modules/rental/application/repositories/rental.repository.js';
import {
  IAccountRepository,
  ITransactionRepository,
  IExchangeRateRepository,
  IFinancialDayRepository,
} from '../modules/financial/application/repositories/financial.repository.js';
import { IExpenseRepository } from '../modules/expense/application/repositories/expense.repository.js';
import { IFixedExpenseRepository, IFixedExpensePaymentRepository } from '../modules/expense/application/repositories/fixed-expense.repository.js';
import { IAgentRepository } from '../modules/chat/application/repositories/agent.repository.js';
import { IChatSessionRepository } from '../modules/chat/application/repositories/chat-session.repository.js';
import { IChatMessageRepository } from '../modules/chat/application/repositories/chat-message.repository.js';
import { IUnsatisfiedDemandRepository } from '../modules/chat/application/repositories/unsatisfied-demand.repository.js';
import { IBaileysAuthRepository } from '../modules/chat/application/repositories/baileys-auth.repository.js';
import { makeRecalculateClientRating } from '../modules/client/application/use-cases/recalculate-client-rating.js';

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
  knowledgeRepository?: IKnowledgeRepository;
  agentRepository?: IAgentRepository;
  chatSessionRepository?: IChatSessionRepository;
  chatMessageRepository?: IChatMessageRepository;
  unsatisfiedDemandRepository?: IUnsatisfiedDemandRepository;
  baileysAuthRepository?: IBaileysAuthRepository;
}

export type Container = Readonly<{
  product: ProductSubContainer;
  user: UserSubContainer;
  client: ClientSubContainer;
  order: OrderSubContainer;
  dashboard: DashboardSubContainer;
  context: ContextSubContainer;
  delivery: DeliverySubContainer;
  rental: RentalSubContainer;
  financial: FinancialSubContainer;
  expense: ExpenseSubContainer;
  knowledge: KnowledgeSubContainer;
  chat: ChatSubContainer;
}>;

export const makeContainer = (overrides: ContainerDependencies = {}): Container => {
  const productRepository = overrides.productRepository ?? makeProductMongooseRepository();
  const userRepository = overrides.userRepository ?? makeUserMongooseRepository();
  const clientRepository = overrides.clientRepository ?? makeClientMongooseRepository();
  const orderRepository = overrides.orderRepository ?? makeOrderMongooseRepository();
  const deliveryRepository = overrides.deliveryRepository ?? makeDeliveryMongooseRepository();

  const knowledge = buildKnowledgeModule({
    knowledgeRepository: overrides.knowledgeRepository,
    librarianEnabled: config.librarianEnabled,
  });

  const product = buildProductModule({ productRepository, librarian: knowledge.librarian });
  const user = buildUserModule({ userRepository });
  const recalculateClientRating = makeRecalculateClientRating(clientRepository, orderRepository);
  const client = buildClientModule({ clientRepository, orderRepository, recalculateClientRating });
  const order = buildOrderModule({
    orderRepository,
    productRepository,
    recalculateClientRating,
    clientRepository,
    deliveryRepository,
  });

  const dashboard = buildDashboardModule({
    dashboardRepository: overrides.dashboardRepository ?? makeDashboardMongooseRepository(),
  });

  const expense = buildExpenseModule({
    expenseRepository: overrides.expenseRepository ?? makeExpenseMongooseRepository(),
    fixedExpenseRepository: overrides.fixedExpenseRepository ?? makeFixedExpenseMongooseRepository(),
    fixedExpensePaymentRepository:
      overrides.fixedExpensePaymentRepository ?? makeFixedExpensePaymentMongooseRepository(),
  });

  const delivery = buildDeliveryModule({
    deliveryRepository,
    orderRepository,
  });

  const rental = buildRentalModule({
    rentalRepository: overrides.rentalRepository ?? makeRentalMongooseRepository(),
    productRepository,
  });

  const accountRepository = overrides.accountRepository ?? makeAccountMongooseRepository();
  const transactionRepository = overrides.transactionRepository ?? makeTransactionMongooseRepository();
  const exchangeRateRepository = overrides.exchangeRateRepository ?? makeExchangeRateMongooseRepository();
  const financialDayRepository = overrides.financialDayRepository ?? makeFinancialDayMongooseRepository();

  const financial = buildFinancialModule({
    accountRepository,
    transactionRepository,
    exchangeRateRepository,
    financialDayRepository,
    deliveryRepository,
  });

  const context = buildContextModule({
    productRepository,
    orderRepository,
    expenseRepository: overrides.expenseRepository ?? makeExpenseMongooseRepository(),
    accountRepository,
    contextRepository: overrides.contextRepository ?? makeContextMongooseRepository(),
  });

  const chat = buildChatModule({
    productRepository,
    clientRepository,
    pubSubInstance,
    knowledgeRepository: overrides.knowledgeRepository ?? makeKnowledgeMongooseRepository(),
    config: {
      knowledgeInjectionEnabled: config.knowledgeInjectionEnabled,
      knowledgeInjectionTopN: config.knowledgeInjectionTopN,
      knowledgeInjectionTokenBudget: config.knowledgeInjectionTokenBudget,
    },
  });

  return Object.freeze({
    product,
    user,
    client,
    order,
    dashboard,
    context,
    delivery,
    rental,
    financial,
    expense,
    knowledge,
    chat,
  });
};
