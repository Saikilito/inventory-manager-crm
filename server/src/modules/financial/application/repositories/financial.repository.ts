import { BaseRepository } from '../../../../../../shared-domain/src/shared/repository.js';
import { IAccount } from '../../../../../../shared-domain/src/financial/account.entity.js';
import { ITransaction } from '../../../../../../shared-domain/src/financial/transaction.entity.js';
import { IExchangeRate } from '../../../../../../shared-domain/src/financial/exchange-rate.entity.js';
import { IFinancialDay } from '../../../../../../shared-domain/src/financial/financial-day.entity.js';

export interface IAccountRepository extends BaseRepository<IAccount> {}
export interface ITransactionRepository extends BaseRepository<ITransaction> {}
export interface IExchangeRateRepository extends BaseRepository<IExchangeRate> {}
export interface IFinancialDayRepository extends BaseRepository<IFinancialDay> {}
