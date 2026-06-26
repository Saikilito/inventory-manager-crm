import { IProductRepository } from '../modules/product/application/repositories/product.repository.js';
import { makeProductMongooseRepository } from '../modules/product/infrastructure/repositories/product-mongoose.repository.js';
import { GetProduct, makeGetProduct } from '../modules/product/application/use-cases/get-product.js';
import { GetAllProducts, makeGetAllProducts } from '../modules/product/application/use-cases/get-all-products.js';
import { TotalProducts, makeTotalProducts } from '../modules/product/application/use-cases/total-products.js';
import { CreateProduct, makeCreateProduct } from '../modules/product/application/use-cases/create-product.js';
import { UpdateProduct, makeUpdateProduct } from '../modules/product/application/use-cases/update-product.js';
import { DeleteProduct, makeDeleteProduct } from '../modules/product/application/use-cases/delete-product.js';

import { IUserRepository } from '../modules/user/application/repositories/user.repository.js';
import { makeUserMongooseRepository } from '../modules/user/infrastructure/repositories/user-mongoose.repository.js';
import { GetUserByEmail, makeGetUserByEmail } from '../modules/user/application/use-cases/get-user.js';
import { RegisterUser, makeRegisterUser } from '../modules/user/application/use-cases/register-user.js';
import { AuthenticateUser, makeAuthenticateUser } from '../modules/user/application/use-cases/authenticate-user.js';
import { GetAllUsers, makeGetAllUsers } from '../modules/user/application/use-cases/get-all-users.js';
import { UpdateUser, makeUpdateUser } from '../modules/user/application/use-cases/update-user.js';

import { IClientRepository } from '../modules/client/application/repositories/client.repository.js';
import { makeClientMongooseRepository } from '../modules/client/infrastructure/repositories/client-mongoose.repository.js';
import { GetClient, makeGetClient } from '../modules/client/application/use-cases/get-client.js';
import { GetAllClients, makeGetAllClients } from '../modules/client/application/use-cases/get-all-clients.js';
import { TotalClients, makeTotalClients } from '../modules/client/application/use-cases/total-clients.js';
import { CreateClient, makeCreateClient } from '../modules/client/application/use-cases/create-client.js';
import { UpdateClient, makeUpdateClient } from '../modules/client/application/use-cases/update-client.js';
import { DeleteClient, makeDeleteClient } from '../modules/client/application/use-cases/delete-client.js';
import { RecalculateClientRating, makeRecalculateClientRating } from '../modules/client/application/use-cases/recalculate-client-rating.js';

import { IOrderRepository } from '../modules/order/application/repositories/order.repository.js';
import { makeOrderMongooseRepository } from '../modules/order/infrastructure/repositories/order-mongoose.repository.js';
import { GetOrder, makeGetOrder } from '../modules/order/application/use-cases/get-order.js';
import { GetOrderClient, makeGetOrderClient } from '../modules/order/application/use-cases/get-order-client.js';
import { GetAllOrders, makeGetAllOrders } from '../modules/order/application/use-cases/get-all-orders.js';
import { TotalOrders, makeTotalOrders } from '../modules/order/application/use-cases/total-orders.js';
import { CreateOrder, makeCreateOrder } from '../modules/order/application/use-cases/create-order.js';
import { UpdateOrder, makeUpdateOrder } from '../modules/order/application/use-cases/update-order.js';
import { DeleteOrder, makeDeleteOrder } from '../modules/order/application/use-cases/delete-order.js';

import { IDashboardRepository } from '../modules/dashboard/application/repositories/dashboard.repository.js';
import { makeDashboardMongooseRepository } from '../modules/dashboard/infrastructure/repositories/dashboard-mongoose.repository.js';
import { GetTopClients, makeGetTopClients } from '../modules/dashboard/application/use-cases/get-top-clients.js';
import { GetTopSellers, makeGetTopSellers } from '../modules/dashboard/application/use-cases/get-top-sellers.js';

export interface ContainerDependencies {
  productRepository?: IProductRepository;
  userRepository?: IUserRepository;
  clientRepository?: IClientRepository;
  orderRepository?: IOrderRepository;
  dashboardRepository?: IDashboardRepository;
}

export type Container = Readonly<{
  product: Readonly<{
    getProduct: GetProduct;
    getAllProducts: GetAllProducts;
    totalProducts: TotalProducts;
    createProduct: CreateProduct;
    updateProduct: UpdateProduct;
    deleteProduct: DeleteProduct;
  }>;

  user: Readonly<{
    getUserByEmail: GetUserByEmail;
    registerUser: RegisterUser;
    authenticateUser: AuthenticateUser;
    getAllUsers: GetAllUsers;
    updateUser: UpdateUser;
  }>;

  client: Readonly<{
    getClient: GetClient;
    getAllClients: GetAllClients;
    totalClients: TotalClients;
    createClient: CreateClient;
    updateClient: UpdateClient;
    deleteClient: DeleteClient;
    recalculateClientRating: RecalculateClientRating;
  }>;

  order: Readonly<{
    getOrder: GetOrder;
    getOrderClient: GetOrderClient;
    getAllOrders: GetAllOrders;
    totalOrders: TotalOrders;
    createOrder: CreateOrder;
    updateOrder: UpdateOrder;
    deleteOrder: DeleteOrder;
  }>;

  dashboard: Readonly<{
    getTopClients: GetTopClients;
    getTopSellers: GetTopSellers;
  }>;
}>;

export const makeContainer = (overrides: ContainerDependencies = {}): Container => {
  const productRepository = overrides.productRepository ?? makeProductMongooseRepository();
  const userRepository = overrides.userRepository ?? makeUserMongooseRepository();
  const clientRepository = overrides.clientRepository ?? makeClientMongooseRepository();
  const orderRepository = overrides.orderRepository ?? makeOrderMongooseRepository();
  const dashboardRepository = overrides.dashboardRepository ?? makeDashboardMongooseRepository();

  const recalculateClientRating = makeRecalculateClientRating(clientRepository, orderRepository);

  const container: Container = {
    product: {
      getProduct: makeGetProduct(productRepository),
      getAllProducts: makeGetAllProducts(productRepository),
      totalProducts: makeTotalProducts(productRepository),
      createProduct: makeCreateProduct(productRepository),
      updateProduct: makeUpdateProduct(productRepository),
      deleteProduct: makeDeleteProduct(productRepository),
    },

    user: {
      getUserByEmail: makeGetUserByEmail(userRepository),
      registerUser: makeRegisterUser(userRepository),
      authenticateUser: makeAuthenticateUser(userRepository),
      getAllUsers: makeGetAllUsers(userRepository),
      updateUser: makeUpdateUser(userRepository),
    },

    client: {
      getClient: makeGetClient(clientRepository),
      getAllClients: makeGetAllClients(clientRepository),
      totalClients: makeTotalClients(clientRepository),
      createClient: makeCreateClient(clientRepository),
      updateClient: makeUpdateClient(clientRepository),
      deleteClient: makeDeleteClient(clientRepository),
      recalculateClientRating,
    },

    order: {
      getOrder: makeGetOrder(orderRepository),
      getOrderClient: makeGetOrderClient(orderRepository),
      getAllOrders: makeGetAllOrders(orderRepository),
      totalOrders: makeTotalOrders(orderRepository),
      createOrder: makeCreateOrder(orderRepository, recalculateClientRating),
      updateOrder: makeUpdateOrder(orderRepository, productRepository, recalculateClientRating),
      deleteOrder: makeDeleteOrder(orderRepository, recalculateClientRating),
    },

    dashboard: {
      getTopClients: makeGetTopClients(dashboardRepository),
      getTopSellers: makeGetTopSellers(dashboardRepository),
    },
  };

  return Object.freeze(container);
};
