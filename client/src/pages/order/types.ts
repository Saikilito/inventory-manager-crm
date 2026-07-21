import { OrderStatus, PaymentStatus, DeliveryStatus } from '@shared-domain/order/order.entity';
import type { GQLOrder, GQLOrderItem } from '@modules/order/infrastructure/graphql/types';
import type { GQLClient } from '@modules/client/infrastructure/graphql/types';
import type { GQLProduct } from '@modules/product/infrastructure/graphql/types';

export { OrderStatus, PaymentStatus, DeliveryStatus };
export type { GQLOrder, GQLOrderItem, GQLClient, GQLProduct };

// Backward compatibility aliases
export type Order = GQLOrder;
export type OrderItem = GQLOrderItem;
export type Client = GQLClient;
export type Product = GQLProduct;

export interface OrdersTableProps {
  orders: GQLOrder[];
  clients: GQLClient[];
  onViewDetails: (order: GQLOrder) => void;
  onDelete: (id: string) => void;
}

export interface OrderDetailModalProps {
  order: GQLOrder;
  clients: GQLClient[];
  products: GQLProduct[];
  isOpen: boolean;
  isUpdating: boolean;
  updateError: string | null;
  onClose: () => void;
  onStatusChange: (
    newStatus?: OrderStatus,
    newPaymentStatus?: PaymentStatus,
    newDeliveryStatus?: DeliveryStatus,
    payments?: Array<{ accountId: string; amount: number; exchangeRate: number }>
  ) => Promise<void>;
}

export interface OrdersPageProps {
  session: {
    _id: string;
    role: string;
    name: string;
  };
}
