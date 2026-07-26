import { IdVO } from '../../../../shared-domain/src/shared/value-objects/id.vo.js';
import {
  IAccountRepository,
  ITransactionRepository,
  IExchangeRateRepository,
  IFinancialDayRepository,
} from '../../modules/financial/application/repositories/financial.repository.js';
import { IAccountsPayableRepository } from '../../modules/financial/application/repositories/accounts-payable.repository.js';
import {
  makeAccountMongooseRepository,
  makeTransactionMongooseRepository,
  makeExchangeRateMongooseRepository,
  makeFinancialDayMongooseRepository,
} from '../../modules/financial/infrastructure/repositories/financial-mongoose.repository.js';
import { makeAccountsPayableMongooseRepository } from '../../modules/financial/infrastructure/repositories/accounts-payable-mongoose.repository.js';
import { CreateAccount, makeCreateAccount } from '../../modules/financial/application/use-cases/create-account.js';
import { AdjustAccount, makeAdjustAccount } from '../../modules/financial/application/use-cases/adjust-account.js';
import { CreateTransaction, makeCreateTransaction } from '../../modules/financial/application/use-cases/create-transaction.js';
import { DeleteTransaction, makeDeleteTransaction } from '../../modules/financial/application/use-cases/delete-transaction.js';
import { TransferFunds, makeTransferFunds } from '../../modules/financial/application/use-cases/transfer-funds.js';
import { UpdateExchangeRate, makeUpdateExchangeRate } from '../../modules/financial/application/use-cases/update-exchange-rate.js';
import { OpenFinancialDay, makeOpenFinancialDay } from '../../modules/financial/application/use-cases/open-financial-day.js';
import { CloseFinancialDay, makeCloseFinancialDay } from '../../modules/financial/application/use-cases/close-financial-day.js';
import { GetFinancialDayByDate, makeGetFinancialDayByDate } from '../../modules/financial/application/use-cases/get-financial-day.js';
import { RecordDeliveryPaymentUseCase, makeRecordDeliveryPaymentUseCase } from '../../modules/financial/application/use-cases/record-delivery-payment.js';
import { RecordOrderPaymentUseCase, makeRecordOrderPaymentUseCase } from '../../modules/financial/application/use-cases/record-order-payment.js';
import { ReverseOrderPaymentUseCase, makeReverseOrderPaymentUseCase } from '../../modules/financial/application/use-cases/reverse-order-payment.js';
import { RecordExpenseUseCase, makeRecordExpenseUseCase } from '../../modules/financial/application/use-cases/record-expense.js';
import { ReverseExpenseUseCase, makeReverseExpenseUseCase } from '../../modules/financial/application/use-cases/reverse-expense.js';
import { makeFinancialTransactionService } from '../../modules/financial/application/services/financial-transaction.service.js';
import { PayAccountsPayable, makePayAccountsPayable } from '../../modules/financial/application/use-cases/pay-accounts-payable.js';
import { GetAccountsPayables, makeGetAccountsPayables } from '../../modules/financial/application/use-cases/get-accounts-payables.js';
import { ReconcileFinancialDayUseCase, makeReconcileFinancialDayUseCase } from '../../modules/financial/application/use-cases/reconcile-financial-day.js';
import { IDeliveryRepository } from '../../modules/delivery/application/repositories/delivery.repository.js';
import { IOrderRepository } from '../../modules/order/application/repositories/order.repository.js';
import { IExpenseRepository } from '../../modules/expense/application/repositories/expense.repository.js';

export interface FinancialSubContainer {
  createAccount: CreateAccount;
  adjustAccount: AdjustAccount;
  createTransaction: CreateTransaction;
  deleteTransaction: DeleteTransaction;
  transferFunds: TransferFunds;
  updateExchangeRate: UpdateExchangeRate;
  openFinancialDay: OpenFinancialDay;
  closeFinancialDay: CloseFinancialDay;
  getFinancialDayByDate: GetFinancialDayByDate;
  reconcileFinancialDay: ReconcileFinancialDayUseCase;
  recordDeliveryPayment: RecordDeliveryPaymentUseCase;
  recordOrderPayment: RecordOrderPaymentUseCase;
  reverseOrderPayment: ReverseOrderPaymentUseCase;
  recordExpense: RecordExpenseUseCase;
  reverseExpense: ReverseExpenseUseCase;
  payAccountsPayable: PayAccountsPayable;
  getAccountsPayables: GetAccountsPayables;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic accounts payable return type */
  getAccountsPayable: (id: string) => Promise<any>;
  accountRepository: IAccountRepository;
  transactionRepository: ITransactionRepository;
  exchangeRateRepository: IExchangeRateRepository;
  financialDayRepository: IFinancialDayRepository;
  accountsPayableRepository: IAccountsPayableRepository;
  financialTransactionService: ReturnType<typeof makeFinancialTransactionService>;
}

export interface FinancialModuleDependencies {
  accountRepository?: IAccountRepository;
  transactionRepository?: ITransactionRepository;
  exchangeRateRepository?: IExchangeRateRepository;
  financialDayRepository?: IFinancialDayRepository;
  deliveryRepository: IDeliveryRepository;
  orderRepository: IOrderRepository;
  expenseRepository: IExpenseRepository;
}

export const buildFinancialModule = (deps: FinancialModuleDependencies): FinancialSubContainer => {
  const accountRepository = deps.accountRepository ?? makeAccountMongooseRepository();
  const transactionRepository = deps.transactionRepository ?? makeTransactionMongooseRepository();
  const exchangeRateRepository = deps.exchangeRateRepository ?? makeExchangeRateMongooseRepository();
  const financialDayRepository = deps.financialDayRepository ?? makeFinancialDayMongooseRepository();
  const accountsPayableRepository = makeAccountsPayableMongooseRepository();

  const financialTransactionService = makeFinancialTransactionService(
    transactionRepository,
    accountRepository,
  );

  return {
    createAccount: makeCreateAccount(accountRepository),
    adjustAccount: makeAdjustAccount(accountRepository, transactionRepository, financialDayRepository),
    createTransaction: makeCreateTransaction(transactionRepository, accountRepository, financialDayRepository),
    deleteTransaction: makeDeleteTransaction(
      transactionRepository,
      accountRepository,
      financialDayRepository,
      deps.deliveryRepository,
      deps.expenseRepository,
    ),
    transferFunds: makeTransferFunds(transactionRepository, accountRepository, financialDayRepository),
    updateExchangeRate: makeUpdateExchangeRate(exchangeRateRepository),
    openFinancialDay: makeOpenFinancialDay(financialDayRepository, accountRepository),
    closeFinancialDay: makeCloseFinancialDay(
      financialDayRepository,
      accountRepository,
      transactionRepository,
      deps.orderRepository,
      deps.expenseRepository,
    ),
    getFinancialDayByDate: makeGetFinancialDayByDate(financialDayRepository, exchangeRateRepository),
    reconcileFinancialDay: makeReconcileFinancialDayUseCase(
      transactionRepository,
      financialDayRepository,
      deps.orderRepository,
      deps.expenseRepository,
    ),
    recordDeliveryPayment: makeRecordDeliveryPaymentUseCase(
      financialTransactionService,
      financialDayRepository,
      accountRepository,
      deps.orderRepository,
    ),
    recordOrderPayment: makeRecordOrderPaymentUseCase(
      financialTransactionService,
      financialDayRepository,
      accountRepository,
    ),
    reverseOrderPayment: makeReverseOrderPaymentUseCase(
      financialTransactionService,
      financialDayRepository,
      accountRepository,
    ),
    recordExpense: makeRecordExpenseUseCase(
      financialTransactionService,
      financialDayRepository,
      accountRepository,
    ),
    reverseExpense: makeReverseExpenseUseCase(
      financialTransactionService,
      financialDayRepository,
      accountRepository,
    ),
    payAccountsPayable: makePayAccountsPayable({
      accountsPayableRepository,
      accountRepository,
      transactionRepository,
      financialDayRepository,
      expenseRepository: deps.expenseRepository,
    }),
    getAccountsPayables: makeGetAccountsPayables({ accountsPayableRepository }),
    getAccountsPayable: async (id: string) => {
      const result = await accountsPayableRepository.getById(IdVO.create(id));
      return result.isFailure ? null : result.getValue();
    },
    accountRepository,
    transactionRepository,
    exchangeRateRepository,
    financialDayRepository,
    accountsPayableRepository,
    financialTransactionService,
  };
};
