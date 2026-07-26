import { useState } from 'react';
import { FixedExpenseChecklistItem } from '@modules/expense/domain/fixed-expense.repository';
import { FixedExpensePloc } from '@modules/expense/presentation/ploc/fixed-expense-ploc';
import { ExpensePloc } from '@modules/expense/presentation/ploc/expense-ploc';
import { ExpenseState } from '@modules/expense/presentation/ploc/expense-state';

export const useChecklistPayment = (
  fixedPloc: FixedExpensePloc,
  ploc: ExpensePloc,
  state: ExpenseState,
  selectedContextId: string,
  selectedCategory: string,
) => {
  const [pendingToggleItem, setPendingToggleItem] = useState<FixedExpenseChecklistItem | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const toggleChecklistPayment = (item: FixedExpenseChecklistItem) => {
    setPendingToggleItem(item);
  };

  const confirmToggleChecklistPayment = async (accountId?: string) => {
    if (!pendingToggleItem) return;

    setIsProcessingPayment(true);
    try {
      if (pendingToggleItem.payment?.isPaid) {
        await fixedPloc.unpayFixedExpense(pendingToggleItem.fixedExpense.id as string);
      } else {
        await fixedPloc.payFixedExpense(
          pendingToggleItem.fixedExpense.id as string,
          Number(pendingToggleItem.fixedExpense.amount),
          accountId,
        );
      }

      ploc.load(state.currentPage, state.limit, selectedContextId, selectedCategory);
      setPendingToggleItem(null);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const cancelToggleChecklistPayment = () => {
    setPendingToggleItem(null);
  };

  return {
    pendingToggleItem,
    isProcessingPayment,
    toggleChecklistPayment,
    confirmToggleChecklistPayment,
    cancelToggleChecklistPayment,
  };
};
