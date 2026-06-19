import jwt from "jsonwebtoken";
import { Request } from "express";
import { makeContainer, Container } from "./container.js";

// Import our Screaming Mongoose models directly
import Client from "../modules/client/infrastructure/client.model.js";
import Product from "../modules/product/infrastructure/product.model.js";
import Order from "../modules/order/infrastructure/order.model.js";
import User from "../modules/user/infrastructure/user.model.js";

const models = {
  Client,
  Product,
  Order,
  User,
};

export type ModelsType = typeof models;

const __secret = process.env.JWT_SECRET || "JWT_SECRET_DEFAULT";
const containerInstance = makeContainer();

export interface IContext {
  container: Container;
  models: ModelsType;
  token: () => Promise<unknown>;
}

export const context = async (
  { req }: { req: Request & { actualUser?: unknown } },
  containerOverride?: Container,
): Promise<IContext> => {
  const tokenStr = req.headers["authorization"] || "";

  return {
    container: containerOverride ?? containerInstance,
    models,
    token: async () => {
      if (tokenStr && tokenStr !== "null") {
        try {
          const actualUser = jwt.verify(tokenStr, __secret);
          req.actualUser = actualUser;
          return actualUser;
        } catch (err) {
          console.error(err);
          return null;
        }
      } else {
        return null;
      }
    },
  };
};
