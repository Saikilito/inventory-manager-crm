import { useState, useEffect, FormEvent } from 'react';
import { IAccount } from '@shared-domain/financial/account.entity.js';
import { SupportedCurrency } from '@shared-domain/shared/value-objects/currency.vo';

const DECIMAL_PRECISION_AMOUNT = 2;
const DECIMAL_PRECISION_EXCHANGE_RATE = 4;
const DEFAULT_EXCHANGE_RATE = 1;

const convertCurrency = (
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  exchangeRate: number
): number => {
  if (fromCurrency === SupportedCurrency.VES && toCurrency === SupportedCurrency.USD) {
    return amount / exchangeRate;
  }
  if (fromCurrency === SupportedCurrency.USD && toCurrency === SupportedCurrency.VES) {
    return amount * exchangeRate;
  }
  return amount;
};

const calculateExchangeRate = (
  sourceAmount: number,
  targetAmount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency
): number => {
  if (fromCurrency === SupportedCurrency.VES && toCurrency === SupportedCurrency.USD) {
    return sourceAmount / targetAmount;
  }
  if (fromCurrency === SupportedCurrency.USD && toCurrency === SupportedCurrency.VES) {
    return targetAmount / sourceAmount;
  }
  return 1;
};

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

  const convertAndSetTargetAmount = (
    amount: number,
    rate: number,
    src: IAccount | undefined,
    tgt: IAccount | undefined
  ) => {
    if (!src || !tgt) return;
    const srcCur = src.currency.toString().toUpperCase() as SupportedCurrency;
    const tgtCur = tgt.currency.toString().toUpperCase() as SupportedCurrency;
    const converted = convertCurrency(amount, srcCur, tgtCur, rate);
    setTargetAmount(converted.toFixed(DECIMAL_PRECISION_AMOUNT));
  };

  const updateCurrencyFields = (srcId: string, tgtId: string) => {
    const srcAcc = accounts.find((a) => a.id!.toString() === srcId);
    const tgtAcc = accounts.find((a) => a.id!.toString() === tgtId);
    if (!srcAcc || !tgtAcc) return;

    const srcCur = srcAcc.currency.toString().toUpperCase() as SupportedCurrency;
    const tgtCur = tgtAcc.currency.toString().toUpperCase() as SupportedCurrency;
    const isDiff = srcCur !== tgtCur;

    if (isDiff) {
      const initialRate = defaultExchangeRate || DEFAULT_EXCHANGE_RATE;
      setExchangeRate(Number(initialRate).toString());

      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount) && numAmount > 0) {
        const converted = convertCurrency(numAmount, srcCur, tgtCur, initialRate);
        setTargetAmount(converted.toFixed(DECIMAL_PRECISION_AMOUNT));
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
      convertAndSetTargetAmount(numAmount, numRate, sourceAccount, targetAccount);
    }
  };

  const handleExchangeRateChange = (val: string) => {
    setExchangeRate(val);
    const numAmount = parseFloat(amount);
    const numRate = parseFloat(val);
    if (!isNaN(numAmount) && !isNaN(numRate) && numAmount > 0 && numRate > 0) {
      convertAndSetTargetAmount(numAmount, numRate, sourceAccount, targetAccount);
    }
  };

  const handleTargetAmountChange = (val: string) => {
    setTargetAmount(val);
    const numAmount = parseFloat(amount);
    const numTarget = parseFloat(val);
    if (!isNaN(numAmount) && !isNaN(numTarget) && numAmount > 0 && numTarget > 0) {
      if (sourceAccount && targetAccount) {
        const srcCur = sourceAccount.currency.toString().toUpperCase() as SupportedCurrency;
        const tgtCur = targetAccount.currency.toString().toUpperCase() as SupportedCurrency;
        const rate = calculateExchangeRate(numAmount, numTarget, srcCur, tgtCur);
        setExchangeRate(rate.toFixed(DECIMAL_PRECISION_EXCHANGE_RATE));
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
