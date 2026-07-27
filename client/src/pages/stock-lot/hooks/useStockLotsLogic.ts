import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_STOCK_LOTS } from '../../../modules/product/infrastructure/graphql/stock-lot-queries';
import {
  CREATE_STOCK_LOT,
  COMPLETE_STOCK_LOT,
  UPDATE_STOCK_LOT,
} from '../../../modules/product/infrastructure/graphql/stock-lot-mutations';
import { PRODUCTS_QUERY } from '../../../modules/product/infrastructure/graphql/queries';
import { GET_ACCOUNTS } from '../../../modules/financial/infrastructure/graphql/queries';
import { GET_ALL_CONTEXTS } from '../../../modules/context/infrastructure/graphql/queries';
import { PAY_ACCOUNTS_PAYABLE } from '../../../modules/financial/infrastructure/graphql/accounts-payable-mutations';
import { getErrorMessage } from '@utils/error';
import { DateOnlyVO } from '@shared-domain/shared/value-objects/date-only.vo';
import { isInsufficientAccountBalance } from '@shared-domain/financial/account.entity';
import { PaymentMethod } from '@shared-domain/stock-lot/stock-lot.entity';
import type {
  StockLot,
  CreateStockLotInput,
  CreateStockLotPayload,
  UpdateStockLotInput,
} from '../../../modules/product/infrastructure/graphql/stock-lot-types';

interface ProductShape {
  id: string;
  name: string;
  costPrice: number;
  stock: number;
}

interface AccountShape {
  id: string;
  name: string;
  currency: string;
  balance: number;
}

interface ContextShape {
  _id: string;
  name: string;
}

interface CreateStockLotVariables {
  input: CreateStockLotInput;
}

const SUCCESS_MESSAGE_TIMEOUT_MS = 5000;

export const useStockLotsLogic = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('RECEIVED');
  const [supplierFilter, setSupplierFilter] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(() => DateOnlyVO.create().toString());

  const {
    data: stockLotsData,
    loading: loadingStockLots,
    refetch: refetchStockLots,
  } = useQuery(GET_STOCK_LOTS, {
    fetchPolicy: 'no-cache',
  });

  const stockLots: StockLot[] = stockLotsData?.stockLots || [];

  const { data: productsData } = useQuery(PRODUCTS_QUERY, {
    variables: { limit: 1000 },
  });
  const products: ProductShape[] = productsData?.getAllProducts || [];

  const { data: accountsData } = useQuery(GET_ACCOUNTS, {
    fetchPolicy: 'no-cache',
  });
  const accounts: AccountShape[] = accountsData?.getAccounts || [];

  const { data: contextsData } = useQuery(GET_ALL_CONTEXTS, {
    fetchPolicy: 'cache-first',
  });
  const contexts: ContextShape[] = contextsData?.getAllContexts || [];

  const [payAccountsPayableMutation] = useMutation(PAY_ACCOUNTS_PAYABLE);

  const [createStockLotMutation, { loading: creatingStockLot }] = useMutation<
    { createStockLot: CreateStockLotPayload },
    CreateStockLotVariables
  >(CREATE_STOCK_LOT, {
    onCompleted: (data) => {
      if (data.createStockLot && data.createStockLot.stockLot) {
        setSuccessMessage('Stock lot created successfully');
        refetchStockLots();
        setTimeout(() => setSuccessMessage(null), SUCCESS_MESSAGE_TIMEOUT_MS);
      }
    },
  });

  const [completeStockLotMutation, { loading: completingStockLot }] = useMutation(COMPLETE_STOCK_LOT, {
    onCompleted: (data) => {
      if (data.completeStockLot && data.completeStockLot.stockLot) {
        setSuccessMessage('Stock lot completed successfully');
        refetchStockLots();
        setTimeout(() => setSuccessMessage(null), SUCCESS_MESSAGE_TIMEOUT_MS);
      }
    },
    onError: (error) => {
      alert(getErrorMessage(error));
    },
  });

  const [updateStockLotMutation] = useMutation(UPDATE_STOCK_LOT, {
    onCompleted: (data) => {
      if (data.updateStockLot) {
        setSuccessMessage('Stock lot updated successfully');
        refetchStockLots();
        setTimeout(() => setSuccessMessage(null), SUCCESS_MESSAGE_TIMEOUT_MS);
      }
    },
  });

  const filteredStockLots = useMemo(() => {
    return stockLots.filter((lot) => {
      const matchesDate = lot.purchaseDate === selectedDate;
      const matchesStatus = statusFilter === 'ALL' || lot.status === statusFilter;
      const matchesSupplier = !supplierFilter || lot.supplier.toLowerCase().includes(supplierFilter.toLowerCase());
      return matchesDate && matchesStatus && matchesSupplier;
    });
  }, [stockLots, statusFilter, supplierFilter, selectedDate]);

  const { totalPurchaseValue, totalProjectedProfit } = useMemo(() => {
    return filteredStockLots.reduce(
      (acc, lot) => {
        let lotCost = 0;
        let lotProfit = 0;
        lot.items?.forEach((item) => {
          const cost = (item.unitCost || 0) * (item.quantity || 0);
          const selling = (item.confirmedSellingPrice || item.unitCost || 0) * (item.quantity || 0);
          lotCost += cost;
          lotProfit += selling - cost;
        });
        acc.totalPurchaseValue += lotCost;
        acc.totalProjectedProfit += lotProfit;
        return acc;
      },
      { totalPurchaseValue: 0, totalProjectedProfit: 0 },
    );
  }, [filteredStockLots]);

  const handleCreateStockLot = async (
    input: CreateStockLotInput & { id?: string },
    payments?: { accountId: string; amount: number }[],
  ) => {
    try {
      const isSplitPayment = payments && payments.length > 1;

      if (isSplitPayment && payments) {
        for (const payment of payments) {
          const acc = accounts.find((a) => a.id === payment.accountId);
          if (isInsufficientAccountBalance(acc, payment.amount)) {
            return { success: false, message: 'Insufficient account balance' };
          }
        }
      }

      const payloadInput = { ...input };
      if (isSplitPayment) {
        payloadInput.paymentMethod = PaymentMethod.CREDIT;
        delete payloadInput.accountId;
      }

      if (input.id) {
        const updatePayload: UpdateStockLotInput = {
          id: input.id,
          supplier: payloadInput.supplier,
          purchaseDate: payloadInput.purchaseDate,
          items: payloadInput.items,
          paymentMethod: payloadInput.paymentMethod,
          accountId: payloadInput.accountId,
          contextId: payloadInput.contextId,
        };

        const result = await updateStockLotMutation({ variables: { input: updatePayload } });
        const data = result.data?.updateStockLot;

        if (input.status === 'RECEIVED') {
          const completeResult = await completeStockLotMutation({
            variables: {
              stockLotId: input.id,
              accountId: payloadInput.accountId,
            },
          });

          const completedData = completeResult.data?.completeStockLot;

          if (
            completedData &&
            completedData.stockLot &&
            isSplitPayment &&
            completedData.accountsPayableId &&
            payments
          ) {
            for (const payment of payments) {
              await payAccountsPayableMutation({
                variables: {
                  accountsPayableId: completedData.accountsPayableId,
                  amount: payment.amount,
                  accountId: payment.accountId,
                },
              });
            }
          }
          refetchStockLots();
          if (input.purchaseDate) setSelectedDate(input.purchaseDate);
          return { stockLot: completedData?.stockLot || data };
        }

        refetchStockLots();
        if (input.purchaseDate) setSelectedDate(input.purchaseDate);
        return { stockLot: data };
      } else {
        delete payloadInput.id;
        const result = await createStockLotMutation({ variables: { input: payloadInput } });
        const data = result.data?.createStockLot;

        if (data && data.stockLot && isSplitPayment && data.accountsPayableId && payments) {
          for (const payment of payments) {
            await payAccountsPayableMutation({
              variables: {
                accountsPayableId: data.accountsPayableId,
                amount: payment.amount,
                accountId: payment.accountId,
              },
            });
          }
          refetchStockLots();
        }

        if (input.purchaseDate) setSelectedDate(input.purchaseDate);
        return data;
      }
    } catch (e) {
      return { success: false, message: getErrorMessage(e) };
    }
  };

  const handleCompleteDraft = async (stockLotId: string) => {
    try {
      const lot = stockLots.find((l) => l.id === stockLotId);
      if (!lot) return { success: false, message: 'Stock lot not found' };

      let accountId = undefined;
      if (lot.paymentMethod === PaymentMethod.CASH) {
        const accountSelection = window.prompt('Enter Account ID to pay from (CASH selected):', accounts[0]?.id || '');
        if (!accountSelection) return { success: false, message: 'Account ID is required to pay CASH' };
        accountId = accountSelection;

        const selectedAccount = accounts.find((a) => a.id === accountId);
        const lotTotalCost = lot.items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
        if (isInsufficientAccountBalance(selectedAccount, lotTotalCost)) {
          return { success: false, message: 'Insufficient account balance' };
        }
      }

      await completeStockLotMutation({
        variables: {
          stockLotId,
          accountId,
        },
      });
      return { success: true };
    } catch (e) {
      return { success: false, message: getErrorMessage(e) };
    }
  };

  return {
    stockLots,
    filteredStockLots,
    loadingStockLots,
    creatingStockLot,
    successMessage,
    statusFilter,
    setStatusFilter,
    supplierFilter,
    setSupplierFilter,
    selectedDate,
    setSelectedDate,
    handleCreateStockLot,
    handleCompleteDraft,
    refetchStockLots,
    totalPurchaseValue,
    totalProjectedProfit,
    products,
    accounts,
    contexts,
  };
};
