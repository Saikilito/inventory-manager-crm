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
import { IProductRepository } from '../../modules/product/application/repositories/product.repository.js';
import { IOrderRepository } from '../../modules/order/application/repositories/order.repository.js';
import { IExpenseRepository } from '../../modules/expense/application/repositories/expense.repository.js';
import { IAccountRepository } from '../../modules/financial/application/repositories/financial.repository.js';
import { IClientRepository } from '../../modules/client/application/repositories/client.repository.js';
import { IFixedExpenseRepository } from '../../modules/expense/application/repositories/fixed-expense.repository.js';

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
    ),
  };
};
