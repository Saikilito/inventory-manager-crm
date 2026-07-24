import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_ACCOUNTS_PAYABLES } from "../../../modules/financial/infrastructure/graphql/accounts-payable-queries";
import { PAY_ACCOUNTS_PAYABLE } from "../../../modules/financial/infrastructure/graphql/accounts-payable-mutations";
import { GET_ACCOUNTS } from "../../../modules/financial/infrastructure/graphql/queries";
import { getErrorMessage } from "@utils/error";
import type { AccountsPayable, PayAccountsPayablePayload } from "../../../modules/financial/infrastructure/graphql/accounts-payable-types";

interface AccountShape {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

interface PayAccountsPayableVariables {
  accountsPayableId: string;
  amount: number;
  accountId: string;
}

export const useAccountsPayablesLogic = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('');

  const {
    data: accountsPayablesData,
    loading: loadingAccountsPayables,
    refetch: refetchAccountsPayables,
  } = useQuery(GET_ACCOUNTS_PAYABLES, {
    fetchPolicy: "no-cache",
  });

  const accountsPayables: AccountsPayable[] = accountsPayablesData?.accountsPayables || [];

  const { data: accountsData } = useQuery(GET_ACCOUNTS, {
    fetchPolicy: "no-cache",
  });

  const accounts: AccountShape[] = accountsData?.getAccounts || [];

  const [payAccountsPayableMutation, { loading: payingAccountsPayable }] = useMutation<
    { payAccountsPayable: PayAccountsPayablePayload },
    PayAccountsPayableVariables
  >(PAY_ACCOUNTS_PAYABLE, {
    onCompleted: (data) => {
      if (data.payAccountsPayable.success) {
        setSuccessMessage(data.payAccountsPayable.message || "Payment recorded successfully");
        refetchAccountsPayables();
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    },
    onError: (error) => {
      setSuccessMessage(getErrorMessage(error));
      setTimeout(() => setSuccessMessage(null), 5000);
    },
  });

  const filteredAccountsPayables = useMemo(() => {
    return accountsPayables.filter((ap) => {
      const matchesStatus = statusFilter === 'ALL' || ap.status === statusFilter;
      const matchesSupplier = !supplierFilter || 
        ap.supplier.toLowerCase().includes(supplierFilter.toLowerCase());
      return matchesStatus && matchesSupplier;
    });
  }, [accountsPayables, statusFilter, supplierFilter]);

  const handlePayAccountsPayable = async (
    accountsPayableId: string,
    amount: number,
    accountId: string
  ) => {
    const result = await payAccountsPayableMutation({
      variables: { accountsPayableId, amount, accountId },
    });
    return result.data?.payAccountsPayable;
  };

  const totalOutstanding = useMemo(() => {
    return filteredAccountsPayables.reduce((sum, ap) => {
      return sum + ap.remainingBalance;
    }, 0);
  }, [filteredAccountsPayables]);

  const totalPaid = useMemo(() => {
    return filteredAccountsPayables.reduce((sum, ap) => {
      const paymentsSum = ap.payments.reduce((pSum, payment) => {
        return pSum + payment.amount;
      }, 0);
      return sum + paymentsSum;
    }, 0);
  }, [filteredAccountsPayables]);

  const getAccountNameById = (accountId: string): string => {
    const account = accounts.find((a) => a.id === accountId);
    return account?.name || 'Unknown Account';
  };

  return {
    accountsPayables,
    filteredAccountsPayables,
    loadingAccountsPayables,
    payingAccountsPayable,
    successMessage,
    statusFilter,
    setStatusFilter,
    supplierFilter,
    setSupplierFilter,
    handlePayAccountsPayable,
    refetchAccountsPayables,
    totalOutstanding,
    totalPaid,
    accounts,
    getAccountNameById,
  };
};
