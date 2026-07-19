import { useState, useEffect, FormEvent } from 'react';
import { IAccount } from '@shared-domain/financial/account.entity.js';

export interface UseTransferFundsLogicProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: {
    sourceAccountId: string;
    targetAccountId: string;
    amount: number;
    targetAmount?: number | null;
    exchangeRate?: number | null;
    description?: string | null;
    date?: string | null;
  }) => void;
  accounts: IAccount[];
  isDayClosed: boolean;
  defaultExchangeRate?: number | null;
}

export const useTransferFundsLogic = ({
  isOpen,
  onClose,
  onSubmit,
  accounts,
  isDayClosed,
  defaultExchangeRate,
}: UseTransferFundsLogicProps) => {
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [targetAccountId, setTargetAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Automatically clear inputs when the drawer opens or closes
  useEffect(() => {
    if (isOpen) {
      setSourceAccountId('');
      setTargetAccountId('');
      setAmount('');
      setExchangeRate('');
      setTargetAmount('');
      setDescription('');
      setError(null);
    }
  }, [isOpen]);

  const sourceAccount = accounts.find((a) => a.id!.toString() === sourceAccountId);
  const targetAccount = accounts.find((a) => a.id!.toString() === targetAccountId);
  const showConversionFields = Boolean(
    sourceAccount &&
    targetAccount &&
    sourceAccount.currency.toString() !== targetAccount.currency.toString()
  );

  const updateCurrencyFields = (srcId: string, tgtId: string) => {
    const srcAcc = accounts.find((a) => a.id!.toString() === srcId);
    const tgtAcc = accounts.find((a) => a.id!.toString() === tgtId);
    if (!srcAcc || !tgtAcc) return;

    const srcCur = srcAcc.currency.toString().toUpperCase();
    const tgtCur = tgtAcc.currency.toString().toUpperCase();
    const isDiff = srcCur !== tgtCur;

    if (isDiff) {
      const initialRate = defaultExchangeRate || 1;
      setExchangeRate(Number(initialRate).toString());

      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount) && numAmount > 0) {
        if (srcCur === 'VES' && tgtCur === 'USD') {
          setTargetAmount((numAmount / initialRate).toFixed(2));
        } else if (srcCur === 'USD' && tgtCur === 'VES') {
          setTargetAmount((numAmount * initialRate).toFixed(2));
        }
      }
    } else {
      setExchangeRate('');
      setTargetAmount('');
    }
  };

  const handleSourceAccountChange = (id: string) => {
    setSourceAccountId(id);
    if (id === targetAccountId) {
      setTargetAccountId('');
    }
    // Update rate and target amount if different currency
    updateCurrencyFields(id, targetAccountId);
  };

  const handleTargetAccountChange = (id: string) => {
    setTargetAccountId(id);
    updateCurrencyFields(sourceAccountId, id);
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    const numAmount = parseFloat(val);
    const numRate = parseFloat(exchangeRate);
    if (!isNaN(numAmount) && !isNaN(numRate) && numAmount > 0 && numRate > 0) {
      if (sourceAccount && targetAccount) {
        const srcCur = sourceAccount.currency.toString().toUpperCase();
        const tgtCur = targetAccount.currency.toString().toUpperCase();
        if (srcCur === 'VES' && tgtCur === 'USD') {
          setTargetAmount((numAmount / numRate).toFixed(2));
        } else if (srcCur === 'USD' && tgtCur === 'VES') {
          setTargetAmount((numAmount * numRate).toFixed(2));
        }
      }
    }
  };

  const handleExchangeRateChange = (val: string) => {
    setExchangeRate(val);
    const numAmount = parseFloat(amount);
    const numRate = parseFloat(val);
    if (!isNaN(numAmount) && !isNaN(numRate) && numAmount > 0 && numRate > 0) {
      if (sourceAccount && targetAccount) {
        const srcCur = sourceAccount.currency.toString().toUpperCase();
        const tgtCur = targetAccount.currency.toString().toUpperCase();
        if (srcCur === 'VES' && tgtCur === 'USD') {
          setTargetAmount((numAmount / numRate).toFixed(2));
        } else if (srcCur === 'USD' && tgtCur === 'VES') {
          setTargetAmount((numAmount * numRate).toFixed(2));
        }
      }
    }
  };

  const handleTargetAmountChange = (val: string) => {
    setTargetAmount(val);
    const numAmount = parseFloat(amount);
    const numTarget = parseFloat(val);
    if (!isNaN(numAmount) && !isNaN(numTarget) && numAmount > 0 && numTarget > 0) {
      if (sourceAccount && targetAccount) {
        const srcCur = sourceAccount.currency.toString().toUpperCase();
        const tgtCur = targetAccount.currency.toString().toUpperCase();
        if (srcCur === 'VES' && tgtCur === 'USD') {
          setExchangeRate((numAmount / numTarget).toFixed(4));
        } else if (srcCur === 'USD' && tgtCur === 'VES') {
          setExchangeRate((numTarget / numAmount).toFixed(4));
        }
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isDayClosed) {
      setError('Cannot perform transfer because this financial day is closed / locked.');
      return;
    }

    if (!sourceAccountId || !targetAccountId) {
      setError('Please select both source and target accounts');
      return;
    }

    const amountVal = parseFloat(amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setError('Transfer amount must be a positive number greater than 0');
      return;
    }

    if (sourceAccount && sourceAccount.balance < amountVal) {
      setError('Insufficient funds in source account for this transfer');
      return;
    }

    let parsedTargetAmount: number | undefined;
    let parsedExchangeRate: number | undefined;

    if (showConversionFields) {
      parsedTargetAmount = parseFloat(targetAmount);
      // The backend expects a direct multiplier: creditAmount = amount * exchangeRate.
      // By sending parsedTargetAmount / amountVal, we provide the exact mathematical multiplier,
      // avoiding any rounding discrepancies.
      parsedExchangeRate = parsedTargetAmount / amountVal;

      if (isNaN(parsedTargetAmount) || parsedTargetAmount <= 0) {
        setError('Target amount must be a positive number greater than 0');
        return;
      }
    }

    onSubmit({
      sourceAccountId,
      targetAccountId,
      amount: amountVal,
      targetAmount: parsedTargetAmount,
      exchangeRate: parsedExchangeRate,
      description: description.trim() || null,
    });

    onClose();
  };

  const targetOptions = accounts.filter((a) => a.id!.toString() !== sourceAccountId);

  return {
    state: {
      sourceAccountId,
      targetAccountId,
      amount,
      exchangeRate,
      targetAmount,
      description,
      error,
      showConversionFields,
      sourceAccount,
      targetAccount,
      targetOptions,
    },
    handlers: {
      handleSourceAccountChange,
      handleTargetAccountChange,
      handleAmountChange,
      handleExchangeRateChange,
      handleTargetAmountChange,
      setDescription,
      handleSubmit,
    },
  };
};
