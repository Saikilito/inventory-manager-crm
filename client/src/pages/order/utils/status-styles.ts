import { match } from 'ts-pattern';
import { OrderStatus, PaymentStatus, DeliveryStatus } from '@shared-domain/order/order.entity';

export const getStatusClasses = (status: OrderStatus): string => {
  return match(status)
    .with(
      OrderStatus.PENDING,
      () => 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30 focus:ring-amber-500'
    )
    .with(
      OrderStatus.COMPLETED,
      () => 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 focus:ring-emerald-500'
    )
    .with(
      OrderStatus.ACTIVE,
      () => 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30 focus:ring-blue-500'
    )
    .with(
      OrderStatus.CANCELLED,
      () => 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30 focus:ring-red-500'
    )
    .exhaustive();
};

export const getPaymentClasses = (status: PaymentStatus): string => {
  return match(status)
    .with(
      PaymentStatus.PENDING,
      () =>
        'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30 focus:ring-amber-500',
    )
    .with(
      PaymentStatus.PAID,
      () =>
        'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 focus:ring-emerald-500',
    )
    .with(
      PaymentStatus.REFUNDED,
      () =>
        'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/30 focus:ring-purple-500',
    )
    .exhaustive();
};

export const getDeliveryClasses = (status: DeliveryStatus): string => {
  return match(status)
    .with(
      DeliveryStatus.PENDING,
      () =>
        'bg-stone-50 dark:bg-stone-900/20 text-stone-700 dark:text-stone-400 border-stone-200 dark:border-stone-800/30 focus:ring-stone-500',
    )
    .with(
      DeliveryStatus.SENT,
      () =>
        'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30 focus:ring-blue-500',
    )
    .with(
      DeliveryStatus.COMPLETE,
      () =>
        'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 focus:ring-emerald-500',
    )
    .exhaustive();
};
