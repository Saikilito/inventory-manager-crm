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

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length === 0) {
    throw new Error(
      "JWT_SECRET environment variable is required. Refusing to start with an insecure default.",
    );
  }
  return secret;
}

const __secret = resolveJwtSecret();
export const containerInstance = makeContainer();

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
      if (!tokenStr || tokenStr === "null") {
        return null;
      }
      try {
        const actualUser = jwt.verify(tokenStr, __secret);
        req.actualUser = actualUser;
        return actualUser;
      } catch (err) {
        // Differentiate between expected expiry (recoverable: client may refresh)
        // and unexpected failures (malformed token, signature mismatch, clock skew)
        // so we can surface real auth incidents without burying them in a generic log.
        if (err instanceof jwt.TokenExpiredError) {
          console.warn(
            "[apollo-context] JWT expired; treating request as unauthenticated.",
            { expiredAt: err.expiredAt?.toISOString() ?? null },
          );
          return null;
        }

        if (err instanceof jwt.NotBeforeError) {
          console.warn(
            "[apollo-context] JWT not yet valid; treating request as unauthenticated.",
            { notBefore: err.date?.toISOString() ?? null },
          );
          return null;
        }

        if (err instanceof jwt.JsonWebTokenError) {
          // Signature mismatch, malformed token, wrong algorithm, etc.
          // This is a SECURITY-RELEVANT signal: a forged or tampered token.
          console.error(
            "[apollo-context] JWT verification rejected; possible tampering or misconfiguration.",
            { reason: err.message, name: err.name },
          );
          return null;
        }

        // Unknown error: log loudly with full context, do not swallow.
        console.error(
          "[apollo-context] Unexpected error during JWT verification; treating request as unauthenticated.",
          { reason: err instanceof Error ? err.message : String(err) },
        );
        return null;
      }
    },
  };
};
