import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlocState } from '@hooks/use-ploc-state';
import { useFinancialPloc } from '@contexts/financial-context';
import { FinancialStateKind } from '@modules/financial/presentation/ploc/financial-state';
import { IAccount } from '@shared-domain/financial/account.entity.js';
import { SupportedCurrency } from '@shared-domain/shared/value-objects/currency.vo';

const DEFAULT_EXCHANGE_RATE = 1;

export function useFinancialDashboardLogic() {
  const ploc = useFinancialPloc();
  const state = usePlocState(ploc);
  const navigate = useNavigate();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isTxDrawerOpen, setIsTxDrawerOpen] = useState(false);
  const [txDrawerAccount, setTxDrawerAccount] = useState<IAccount | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const [txSearchQuery, setTxSearchQuery] = useState('');

  useEffect(() => {
    ploc.load();
  }, [ploc]);

  useEffect(() => {
    if (
      state.kind === FinancialStateKind.LOADED &&
      !state.selectedAccountId &&
      state.accounts.length > 0
    ) {
      ploc.selectAccount(state.accounts[0].id?.toString() || null);
    }
  }, [state.kind, state.selectedAccountId, state.accounts, ploc]);

  // Adjust date safely using UTC boundaries to prevent timezone offsets
  const adjustDate = (days: number) => {
    const parts = state.selectedDate.split('-');
    const date = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
    date.setUTCDate(date.getUTCDate() + days);

    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const formatted = `${y}-${m}-${d}`;
    ploc.changeDate(formatted);
  };

  const handleSelectAccount = (accountId: string) => {
    if (state.selectedAccountId === accountId) {
      ploc.selectAccount(null);
    } else {
      ploc.selectAccount(accountId);
    }
  };

  const handleOpenTxDrawer = (acc: IAccount, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Avoid selecting account if clicking transaction button
    }
    setTxDrawerAccount(acc);
    setIsTxDrawerOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction? This will revert the account balance and delete associated delivery records.')) {
      ploc.deleteTransaction(id);
    }
  };

  const activeRate = state.activeRate || DEFAULT_EXCHANGE_RATE;
  
  const totalUSD = state.accounts
    .filter(a => a.currency.toString() === SupportedCurrency.USD)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalVESInUSD = state.accounts
    .filter(a => a.currency.toString() === SupportedCurrency.VES)
    .reduce((sum, a) => sum + (a.balance / activeRate), 0);

  const totalVES = state.accounts
    .filter(a => a.currency.toString() === SupportedCurrency.VES)
    .reduce((sum, a) => sum + a.balance, 0);

  const combinedBalanceUSD = totalUSD + totalVESInUSD;

  const isDayOpened = !!state.activeDay;
  const isDayClosed = state.activeDay?.status === 'CLOSED';

  return {
    state,
    ploc,
    navigate,
    modals: {
      isAccountModalOpen,
      setIsAccountModalOpen,
      isRateModalOpen,
      setIsRateModalOpen,
      isTxDrawerOpen,
      setIsTxDrawerOpen,
      isTransferOpen,
      setIsTransferOpen,
      txDrawerAccount,
    },
    search: {
      txSearchQuery,
      setTxSearchQuery,
    },
    computed: {
      activeRate,
      totalUSD,
      totalVESInUSD,
      totalVES,
      combinedBalanceUSD,
      isDayOpened,
      isDayClosed,
    },
    handlers: {
      adjustDate,
      handleSelectAccount,
      handleOpenTxDrawer,
      handleDeleteTransaction,
    }
  };
}
