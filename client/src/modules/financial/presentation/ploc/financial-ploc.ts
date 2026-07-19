import { makePloc, Ploc } from '@modules/shared/presentation/ploc/ploc';
import { financialInitialState, FinancialState, FinancialStateKind } from './financial-state';
import { FinancialRepository } from '../../domain/financial.repository';

export interface FinancialPloc extends Ploc<FinancialState> {
  load(date?: string): Promise<void>;
  changeDate(date: string): Promise<void>;
  selectAccount(accountId: string | null): Promise<void>;
  createAccount(name: string, currency: string, balance?: number): Promise<void>;
  createTransaction(input: {
    accountId: string;
    type: string;
    amount: number;
    description: string;
    date?: string;
    referenceId?: string;
  }): Promise<void>;
  updateExchangeRate(date: string, rate: number): Promise<void>;
  openDay(date: string): Promise<void>;
  closeDay(date: string): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  transferFunds(input: {
    sourceAccountId: string;
    targetAccountId: string;
    amount: number;
    targetAmount?: number | null;
    exchangeRate?: number | null;
    description?: string | null;
    date?: string | null;
  }): Promise<void>;
}

export function makeFinancialPloc(repository: FinancialRepository): FinancialPloc {
  const ploc = makePloc<FinancialState>(financialInitialState);

  const load = async (date?: string) => {
    const currentState = ploc.state();
    const targetDate = date ?? currentState.selectedDate;

    ploc.changeState({
      ...currentState,
      kind: FinancialStateKind.LOADING,
      selectedDate: targetDate,
    });

    const [dayResult, accountsResult] = await Promise.all([
      repository.getFinancialDayByDate(targetDate),
      repository.getAccounts(),
    ]);

    if (dayResult.isFailure) {
      ploc.changeState({
        ...ploc.state(),
        kind: FinancialStateKind.ERROR,
        errorMessage: dayResult.getError().message || 'Error loading financial day',
      });
      return;
    }

    if (accountsResult.isFailure) {
      ploc.changeState({
        ...ploc.state(),
        kind: FinancialStateKind.ERROR,
        errorMessage: accountsResult.getError().message || 'Error loading accounts',
      });
      return;
    }

    const { day, rate } = dayResult.getValue();
    const accounts = accountsResult.getValue();

    const currentSelId = ploc.state().selectedAccountId;
    let transactions = { ...ploc.state().transactions };

    if (currentSelId) {
      const txResult = await repository.getTransactions(currentSelId);
      if (!txResult.isFailure) {
        transactions[currentSelId] = txResult.getValue();
      }
    }

    ploc.changeState({
      kind: FinancialStateKind.LOADED,
      accounts,
      transactions,
      activeDay: day,
      activeRate: rate,
      selectedAccountId: currentSelId,
      selectedDate: targetDate,
    });
  };

  const changeDate = async (date: string) => {
    await load(date);
  };

  const selectAccount = async (accountId: string | null) => {
    const currentState = ploc.state();
    
    ploc.changeState({
      ...currentState,
      selectedAccountId: accountId,
    });

    if (accountId) {
      const txResult = await repository.getTransactions(accountId);
      if (txResult.isFailure) {
        ploc.changeState({
          ...ploc.state(),
          kind: FinancialStateKind.ERROR,
          errorMessage: txResult.getError().message || 'Error loading transactions',
        });
      } else {
        const transactions = {
          ...ploc.state().transactions,
          [accountId]: txResult.getValue(),
        };
        ploc.changeState({
          ...ploc.state(),
          kind: FinancialStateKind.LOADED,
          transactions,
        });
      }
    }
  };

  const createAccount = async (name: string, currency: string, balance?: number) => {
    const currentState = ploc.state();
    const result = await repository.createAccount(name, currency, balance);

    if (result.isFailure) {
      ploc.changeState({
        ...ploc.state(),
        kind: FinancialStateKind.ERROR,
        errorMessage: result.getError().message || 'Error creating account',
      });
    } else {
      await load(currentState.selectedDate);
    }
  };

  const createTransaction = async (input: {
    accountId: string;
    type: string;
    amount: number;
    description: string;
    date?: string;
    referenceId?: string;
  }) => {
    const currentState = ploc.state();
    const result = await repository.createTransaction({
      ...input,
      date: input.date || currentState.selectedDate,
    });

    if (result.isFailure) {
      ploc.changeState({
        ...ploc.state(),
        kind: FinancialStateKind.ERROR,
        errorMessage: result.getError().message || 'Error creating transaction',
      });
    } else {
      await load(currentState.selectedDate);
    }
  };

  const updateExchangeRate = async (date: string, rate: number) => {
    const currentState = ploc.state();
    const result = await repository.updateExchangeRate(date, rate);

    if (result.isFailure) {
      ploc.changeState({
        ...ploc.state(),
        kind: FinancialStateKind.ERROR,
        errorMessage: result.getError().message || 'Error updating exchange rate',
      });
    } else {
      await load(currentState.selectedDate);
    }
  };

  const openDay = async (date: string) => {
    const currentState = ploc.state();
    const result = await repository.openFinancialDay(date);

    if (result.isFailure) {
      ploc.changeState({
        ...ploc.state(),
        kind: FinancialStateKind.ERROR,
        errorMessage: result.getError().message || 'Error opening financial day',
      });
    } else {
      await load(currentState.selectedDate);
    }
  };

  const closeDay = async (date: string) => {
    const currentState = ploc.state();
    const result = await repository.closeFinancialDay(date);

    if (result.isFailure) {
      ploc.changeState({
        ...ploc.state(),
        kind: FinancialStateKind.ERROR,
        errorMessage: result.getError().message || 'Error closing financial day',
      });
    } else {
      await load(currentState.selectedDate);
    }
  };

  const transferFunds = async (input: {
    sourceAccountId: string;
    targetAccountId: string;
    amount: number;
    targetAmount?: number | null;
    exchangeRate?: number | null;
    description?: string | null;
    date?: string | null;
  }) => {
    const currentState = ploc.state();
    const result = await repository.transferFunds({
      ...input,
      date: input.date || currentState.selectedDate,
    });

    if (result.isFailure) {
      ploc.changeState({
        ...ploc.state(),
        kind: FinancialStateKind.ERROR,
        errorMessage: result.getError().message || 'Error transferring funds',
      });
    } else {
      await load(currentState.selectedDate);
    }
  };

  const deleteTransaction = async (id: string) => {
    const currentState = ploc.state();
    const result = await repository.deleteTransaction(id);

    if (result.isFailure) {
      ploc.changeState({
        ...ploc.state(),
        kind: FinancialStateKind.ERROR,
        errorMessage: result.getError().message || 'Error deleting transaction',
      });
    } else {
      await load(currentState.selectedDate);
    }
  };

  return {
    ...ploc,
    load,
    changeDate,
    selectAccount,
    createAccount,
    createTransaction,
    updateExchangeRate,
    openDay,
    closeDay,
    deleteTransaction,
    transferFunds,
  };
}
