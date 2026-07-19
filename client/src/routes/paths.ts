export const ROUTES = {
  FINANCE: '/finance',
  PRODUCTS: '/products',
  CLIENTS: '/clients',
  ORDERS: '/orders',
  CHAT: '/chat',
  USERS: '/users',
} as const;

export type ROUTES = typeof ROUTES[keyof typeof ROUTES];
