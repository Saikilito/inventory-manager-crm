import { DeliveryStatus } from '@shared-domain/delivery/delivery.entity';

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  [DeliveryStatus.PENDING]: 'Pending',
  [DeliveryStatus.SENT]: 'Sent',
  [DeliveryStatus.DELIVERED]: 'Delivered',
  [DeliveryStatus.CANCELLED]: 'Cancelled',
};

// Disambiguates from the order-status "Pending" badge when both render in the same row (e.g. OrdersTable).
export const DELIVERY_STATUS_TABLE_LABEL: Record<DeliveryStatus, string> = {
  ...DELIVERY_STATUS_LABEL,
  [DeliveryStatus.PENDING]: 'Pending Deliv.',
};

export const DELIVERY_STATUS_BADGE_CLASSES: Record<DeliveryStatus, string> = {
  [DeliveryStatus.PENDING]:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
  [DeliveryStatus.SENT]:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
  [DeliveryStatus.DELIVERED]:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
  [DeliveryStatus.CANCELLED]:
    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
};

export const DELIVERY_STATUS_SELECT_CLASSES: Record<DeliveryStatus, string> = {
  [DeliveryStatus.PENDING]:
    'bg-stone-50 dark:bg-stone-900/20 text-stone-700 dark:text-stone-400 border-stone-200 dark:border-stone-800/30 focus:ring-stone-500',
  [DeliveryStatus.SENT]:
    'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30 focus:ring-blue-500',
  [DeliveryStatus.DELIVERED]:
    'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30 focus:ring-emerald-500',
  [DeliveryStatus.CANCELLED]:
    'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30 focus:ring-red-500',
};

export const NO_DELIVERY_LABEL = 'In-store pickup';

export const NO_DELIVERY_BADGE_CLASSES =
  'bg-stone-50 dark:bg-stone-900/40 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-800';
