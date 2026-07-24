import { Result } from '@shared-domain/shared/result.js';
import { DomainError } from '@shared-domain/shared/errors.js';
import { IAccount } from '@shared-domain/financial/account.entity.js';
import { ITransaction } from '@shared-domain/financial/transaction.entity.js';
import { IFinancialDay } from '@shared-domain/financial/financial-day.entity.js';
import { IExchangeRate } from '@shared-domain/financial/exchange-rate.entity.js';

export interface FinancialRepository {
  getFinancialDayByDate(date: string): Promise<Result<{ day: IFinancialDay | null; rate: number | null }, DomainError>>;
  getAccounts(): Promise<Result<IAccount[], DomainError>>;
  getTransactions(accountId: string): Promise<Result<ITransaction[], DomainError>>;
  createAccount(name: string, currency: string, balance?: number): Promise<Result<IAccount, DomainError>>;
  createTransaction(input: {
    accountId: string;
    type: string;
    amount: number;
    description: string;
    date?: string;
    source?: string;
    sourceReferenceId?: string;
  }): Promise<Result<ITransaction, DomainError>>;
  updateExchangeRate(date: string, rate: number): Promise<Result<IExchangeRate, DomainError>>;
  openFinancialDay(date: string): Promise<Result<IFinancialDay, DomainError>>;
  closeFinancialDay(date: string): Promise<Result<IFinancialDay, DomainError>>;
  deleteTransaction(id: string): Promise<Result<boolean, DomainError>>;
  transferFunds(input: {
    sourceAccountId: string;
    targetAccountId: string;
    amount: number;
    targetAmount?: number | null;
    exchangeRate?: number | null;
    description?: string | null;
    date?: string | null;
  }): Promise<Result<boolean, DomainError>>;
}
