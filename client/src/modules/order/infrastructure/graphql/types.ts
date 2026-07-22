import { OrderStatus, PaymentStatus, DeliveryStatus } from '@shared-domain/order/order.entity';

export { OrderStatus, PaymentStatus, DeliveryStatus };

export interface GQLOrderItem {
  productId: string;
  quantity: number;
  sellingPriceAtSale?: number | null;
  purchasePriceAtSale?: number | null;
}

export interface GQLOrderPayment {
  accountId: string;
  amount: number;
  exchangeRate: number;
}

export interface GQLOrder {
  _id: string;
  clientId: string;
  sellerId: string;
  createdAt: string | number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  contextId?: string;
  deliveryId?: string;
  total: number;
  items: GQLOrderItem[];
  deliveryCost?: number;
  customDeliveryAddress?: string;
  payments?: GQLOrderPayment[];
}

export interface GQLGetAllOrdersResponse {
  getAllOrders: GQLOrder[];
}

export interface GQLGetOrderClientResponse {
  getOrderClient: GQLOrder[];
}

export interface GQLOrderInput {
  _id?: string;
  clientId: string;
  sellerId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  deliveryStatus?: DeliveryStatus;
  contextId?: string;
  deliveryCost?: number;
  customDeliveryAddress?: string;
}
