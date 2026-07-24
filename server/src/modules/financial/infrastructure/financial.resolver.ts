import { IContext } from '../../../config/apollo.js';
import { PositiveNumberVO } from '../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { NonEmptyStringVO } from '../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { IAccount } from '../../../../../shared-domain/src/financial/account.entity.js';
import { ITransaction } from '../../../../../shared-domain/src/financial/transaction.entity.js';
import { IFinancialDay, IFinancialDayBalance } from '../../../../../shared-domain/src/financial/financial-day.entity.js';
import { IAccountsPayable } from '../../../../../shared-domain/src/financial/accounts-payable.entity.js';
import { MongoQueryConstants } from '../../chat/infrastructure/services/gemini.constants.js';

const mapAccountToGql = (account: IAccount) => ({
  id: account.id!.toString(),
  name: account.name.toString(),
  currency: account.currency.toString(),
  balance: account.balance,
});

const mapTransactionToGql = (tx: ITransaction) => ({
  id: tx.id!.toString(),
  accountId: tx.accountId.toString(),
  type: tx.type,
  amount: tx.amount,
  currency: tx.currency.toString(),
  description: tx.description.toString(),
  date: tx.date.toString(),
  financialDayId: tx.financialDayId.toString(),
  referenceId: tx.referenceId ? tx.referenceId.toString() : null,
  createdAt: tx.createdAt.toString(),
});

const mapFinancialDayToGql = (fd: IFinancialDay) => ({
  id: fd.id!.toString(),
  date: fd.date.toString(),
  status: fd.status,
  openingBalances: fd.openingBalances.map((b: IFinancialDayBalance) => ({
    accountId: b.accountId.toString(),
    balance: b.balance,
  })),
  closingBalances: fd.closingBalances.map((b: IFinancialDayBalance) => ({
    accountId: b.accountId.toString(),
    balance: b.balance,
  })),
  openedAt: fd.openedAt.toString(),
  closedAt: fd.closedAt ? fd.closedAt.toString() : null,
});

const mapAccountsPayableToGql = (payable: IAccountsPayable) => ({
  id: payable.id!.toString(),
  stockLotId: payable.stockLotId.toString(),
  supplier: payable.supplier.toString(),
  totalAmount: Number(payable.totalAmount),
  remainingBalance: Number(payable.remainingBalance),
  payments: payable.payments.map((p) => ({
    id: p.id?.toString() || null,
    amount: Number(p.amount),
    accountId: p.accountId.toString(),
    transactionId: p.transactionId.toString(),
    expenseId: p.expenseId.toString(),
    paidAt: p.paidAt.toISOString(),
  })),
  status: payable.status,
  contextId: payable.contextId?.toString() || null,
  createdAt: payable.createdAt.toISOString(),
  updatedAt: payable.updatedAt.toISOString(),
});

export default {
  Query: {
    getFinancialDayByDate: async (
      _parent: unknown,
      { date }: { date?: string },
      { container }: IContext,
    ) => {
      const result = await container.financial.getFinancialDayByDate({ date });
      if (result.isFailure) {
        throw result.getError();
      }
      const val = result.getValue();
      return {
        financialDay: val.financialDay ? mapFinancialDayToGql(val.financialDay) : null,
        exchangeRate: val.exchangeRate,
      };
    },

    getAccounts: async (_parent: unknown, _args: unknown, { container }: IContext) => {
      const result = await container.financial.accountRepository.getAll({
        limit: PositiveNumberVO.create(MongoQueryConstants.DEFAULT_PAGE_LIMIT),
      });
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue().items.map(mapAccountToGql);
    },

    getTransactions: async (
      _parent: unknown,
      { accountId }: { accountId: string },
      { container }: IContext,
    ) => {
      const result = await container.financial.transactionRepository.getAll({
        where: {
          fields: [
            { field: NonEmptyStringVO.create('accountId'), value: accountId, operator: '=' }
          ]
        },
        limit: PositiveNumberVO.create(MongoQueryConstants.DEFAULT_PAGE_LIMIT),
      });
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue().items.map(mapTransactionToGql);
    },

    accountsPayables: async (
      _parent: unknown,
      { status, supplierName, contextId }: { status?: string; supplierName?: string; contextId?: string },
      { container }: IContext,
    ) => {
      const result = await container.financial.getAccountsPayables({ status, supplierName, contextId });
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue().map(mapAccountsPayableToGql);
    },

    accountsPayable: async (_parent: unknown, { id }: { id: string }, { container }: IContext) => {
      const result = await container.financial.getAccountsPayable(id);
      if (result.isFailure) {
        throw result.getError();
      }
      const payable = result.getValue();
      return payable ? mapAccountsPayableToGql(payable) : null;
    },
  },

  Mutation: {
    createAccount: async (
      _parent: unknown,
      { name, currency, balance }: { name: string; currency: string; balance?: number },
      { container }: IContext,
    ) => {
      const result = await container.financial.createAccount({ name, currency, balance });
      if (result.isFailure) {
        throw result.getError();
      }
      return mapAccountToGql(result.getValue());
    },

    createTransaction: async (
      _parent: unknown,
      { accountId, type, amount, description, date, referenceId }: {
        accountId: string;
        type: string;
        amount: number;
        description: string;
        date?: string;
        referenceId?: string;
      },
      { container }: IContext,
    ) => {
      const result = await container.financial.createTransaction({
        accountId,
        type,
        amount,
        description,
        date,
        referenceId,
      });
      if (result.isFailure) {
        throw result.getError();
      }
      return mapTransactionToGql(result.getValue());
    },

    deleteTransaction: async (
      _parent: unknown,
      { id }: { id: string },
      { container }: IContext,
    ) => {
      const result = await container.financial.deleteTransaction({ id });
      if (result.isFailure) {
        throw result.getError();
      }
      return result.getValue();
    },

    updateExchangeRate: async (
      _parent: unknown,
      { date, rate }: { date?: string; rate: number },
      { container }: IContext,
    ) => {
      const result = await container.financial.updateExchangeRate({ date, rate });
      if (result.isFailure) {
        throw result.getError();
      }
      const val = result.getValue();
      return {
        id: val.id!.toString(),
        date: val.date.toString(),
        rate: val.rate,
      };
    },

    openFinancialDay: async (
      _parent: unknown,
      { date }: { date?: string },
      { container }: IContext,
    ) => {
      const result = await container.financial.openFinancialDay({ date });
      if (result.isFailure) {
        throw result.getError();
      }
      return mapFinancialDayToGql(result.getValue());
    },

    closeFinancialDay: async (
      _parent: unknown,
      { date }: { date?: string },
      { container }: IContext,
    ) => {
      const result = await container.financial.closeFinancialDay({ date });
      if (result.isFailure) {
        throw result.getError();
      }
      return mapFinancialDayToGql(result.getValue());
    },

    transferFunds: async (
      _parent: unknown,
      {
        sourceAccountId,
        targetAccountId,
        amount,
        targetAmount,
        exchangeRate,
        description,
        date,
      }: {
        sourceAccountId: string;
        targetAccountId: string;
        amount: number;
        targetAmount?: number | null;
        exchangeRate?: number | null;
        description?: string | null;
        date?: string | null;
      },
      { container }: IContext,
    ) => {
      const result = await container.financial.transferFunds({
        sourceAccountId,
        targetAccountId,
        amount,
        targetAmount,
        exchangeRate,
        description,
        date,
      });
      if (result.isFailure) {
        throw result.getError();
      }
      return true;
    },

    payAccountsPayable: async (
      _parent: unknown,
      { accountsPayableId, amount, accountId }: {
        accountsPayableId: string;
        amount: number;
        accountId: string;
      },
      { container }: IContext,
    ) => {
      const result = await container.financial.payAccountsPayable({
        accountsPayableId,
        amount,
        accountId,
      });
      if (result.isFailure) {
        throw result.getError();
      }
      const output = result.getValue();
      return {
        accountsPayable: mapAccountsPayableToGql(output.accountsPayable),
        transactionId: output.transactionId,
        expenseId: output.expenseId,
      };
    },
  },
};
