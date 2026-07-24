import mongoose from "mongoose";
import { IContext } from "../../../config/apollo.js";
import { seedDatabase } from "../../../config/seeder.js";
import ClientModel from "../../client/infrastructure/client.model.js";
import ProductModel from "../../product/infrastructure/product.model.js";
import OrderModel from "../../order/infrastructure/order.model.js";
import UserModel from "../../user/infrastructure/user.model.js";
import { UserRole } from "../../../../../shared-domain/src/shared/value-objects/role.vo.js";
import SystemConfigModel from "./system-config.model.js";

const checkAdmin = async (token: () => Promise<unknown>, container: IContext['container']) => {
  const actualUserToken = (await token()) as { email: string } | null;
  if (!actualUserToken) {
    throw new Error("Not authenticated");
  }

  const currentUserRes = await container.user.getUserByEmail(actualUserToken.email);
  if (currentUserRes.isFailure || !currentUserRes.getValue()) {
    throw new Error("Not authenticated");
  }

  const currentUser = currentUserRes.getValue()!;
  if (currentUser.disabled === true) {
    throw new Error("Account is disabled");
  }

  if (String(currentUser.role) !== UserRole.ADMIN) {
    throw new Error("Unauthorized: Admin role required");
  }
};

export default {
  Query: {
    getDatabaseStatus: async (_parent: unknown, _args: unknown, { container, token }: IContext) => {
      await checkAdmin(token, container);

      const [
        clientsCount,
        testingClientsCount,
        productsCount,
        testingProductsCount,
        ordersCount,
        testingOrdersCount,
        usersCount,
        testingUsersCount,
      ] = await Promise.all([
        ClientModel.countDocuments(),
        ClientModel.countDocuments({ isTesting: true }),
        ProductModel.countDocuments(),
        ProductModel.countDocuments({ isTesting: true }),
        OrderModel.countDocuments(),
        OrderModel.countDocuments({ isTesting: true }),
        UserModel.countDocuments(),
        UserModel.countDocuments({ isTesting: true }),
      ]);

      return {
        clientsCount,
        testingClientsCount,
        productsCount,
        testingProductsCount,
        ordersCount,
        testingOrdersCount,
        usersCount,
        testingUsersCount,
      };
    },

    getSystemConfig: async (_parent: unknown, _args: unknown, _context: IContext) => {
      let config = await SystemConfigModel.findOne();
      
      // Create default config if doesn't exist
      if (!config) {
        config = await SystemConfigModel.create({
          rentalsEnabled: false,
        });
      }
      
      return {
        id: config._id.toString(),
        rentalsEnabled: config.rentalsEnabled,
      };
    },
  },

  Mutation: {
    seedDatabase: async (_parent: unknown, _args: unknown, { container, token }: IContext) => {
      await checkAdmin(token, container);
      await seedDatabase();
      return true;
    },

    wipeDatabase: async (_parent: unknown, _args: unknown, { container, token }: IContext) => {
      await checkAdmin(token, container);

      await Promise.all([
        ClientModel.deleteMany({ isTesting: true }),
        ProductModel.deleteMany({ isTesting: true }),
        OrderModel.deleteMany({ isTesting: true }),
        UserModel.deleteMany({ isTesting: true }),
      ]);

      return true;
    },

    updateSystemConfig: async (
      _parent: unknown,
      { rentalsEnabled }: { rentalsEnabled: boolean },
      { container, token }: IContext
    ) => {
      await checkAdmin(token, container);

      let config = await SystemConfigModel.findOne();
      
      if (!config) {
        config = await SystemConfigModel.create({
          rentalsEnabled,
        });
      } else {
        config.rentalsEnabled = rentalsEnabled;
        await config.save();
      }

      return {
        id: config._id.toString(),
        rentalsEnabled: config.rentalsEnabled,
      };
    },
  },
};
