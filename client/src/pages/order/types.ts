import { OrderStatus, PaymentStatus, DeliveryStatus } from "@shared-domain/order/order.entity";
export { OrderStatus, PaymentStatus, DeliveryStatus };

export interface OrderItem {
  productId: string;
  quantity: number;
  sellingPriceAtSale?: number | null;
  purchasePriceAtSale?: number | null;
}

export interface Order {
  _id: string;
  clientId: string;
  createdAt: string | number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  items: OrderItem[];
  sellerId: string;
  deliveryCost?: number;
  customDeliveryAddress?: string;
}

export interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  address?: string;
}

export interface Product {
  _id: string;
  name: string;
}

export interface OrdersTableProps {
  orders: Order[];
  clients: Client[];
  onViewDetails: (order: Order) => void;
  onDelete: (id: string) => void;
}

export interface OrderDetailModalProps {
  order: Order;
  clients: Client[];
  products: Product[];
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

export interface GetAllOrdersData {
  getAllOrders: Order[];
  totalOrders: number;
}

export interface GetAllClientsData {
  getAllClients: Client[];
}

export interface GetAllProductsData {
  getAllProducts: Product[];
}

export interface OrdersPageProps {
  session: {
    _id: string;
    role: string;
    name: string;
  };
}
