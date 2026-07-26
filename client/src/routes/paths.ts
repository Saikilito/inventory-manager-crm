export const ROUTES = {
  FINANCE: '/finance',
  PRODUCTS: '/products',
  CLIENTS: '/clients',
  ORDERS: '/orders',
  CHAT: '/chat',
  USERS: '/users',
  STOCK_LOTS: '/stock-lots',
  ACCOUNTS_PAYABLE: '/accounts-payable',
} as const;

export type ROUTES = typeof ROUTES[keyof typeof ROUTES];
