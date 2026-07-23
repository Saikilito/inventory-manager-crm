import React from 'react';
import { CheckCircle2, CreditCard, Coins } from 'lucide-react';
import { GQLOrderPayment } from '@modules/order/infrastructure/graphql/types';

interface PaymentAccount {
  id: string;
  name: string;
  currency: string;
}

interface PaymentSummaryCardProps {
  payments: GQLOrderPayment[];
  accounts: PaymentAccount[];
  totalUSD: number;
}

export const PaymentSummaryCard: React.FC<PaymentSummaryCardProps> = ({
  payments,
  accounts,
  totalUSD,
}) => {
  if (!payments || payments.length === 0) return null;

  const isMixedPayment = payments.length > 1;

  const getAccountInfo = (accountId: string): PaymentAccount | undefined => {
    return accounts.find((acc) => acc.id === accountId);
  };

  const calculateUSDEquivalent = (amount: number, exchangeRate: number): number => {
    return exchangeRate > 0 ? amount / exchangeRate : 0;
  };

  return (
    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 p-4 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
            Payment Completed
          </h4>
        </div>
        {isMixedPayment && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/30">
            <Coins className="w-3 h-3 mr-1" />
            Mixed Payment
          </span>
        )}
      </div>

      <div className="space-y-2">
        {payments.map((payment, index) => {
          const account = getAccountInfo(payment.accountId);
          const usdEquivalent = calculateUSDEquivalent(payment.amount, payment.exchangeRate);
          const isUSD = account?.currency === 'USD';

          return (
            <div
              key={`${payment.accountId}-${index}`}
              className="flex items-center justify-between bg-white dark:bg-stone-950/40 p-3 rounded-lg border border-emerald-100/50 dark:border-emerald-900/20"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {account?.name || 'Unknown Account'}
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                    {account?.currency || 'USD'}
                    {!isUSD && ` • Rate: ${payment.exchangeRate} bs`}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-bold font-mono text-stone-900 dark:text-stone-100">
                  {isUSD ? '' : 'Bs '}{payment.amount.toFixed(2)}
                </p>
                {!isUSD && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                    ${usdEquivalent.toFixed(2)} USD
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isMixedPayment && (
        <div className="pt-2 border-t border-emerald-200/50 dark:border-emerald-900/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-600 dark:text-stone-400">Total Paid:</span>
            <span className="font-bold font-mono text-emerald-700 dark:text-emerald-300">
              ${totalUSD.toFixed(2)} USD
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
