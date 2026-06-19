import { ApolloServer } from "@apollo/server";
import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge";
import path from "path";
import { fileURLToPath } from "url";
import models from "../models/index.js";
import jwt from "jsonwebtoken";

const __secret = process.env.SECRET || "MISAIKILITOSECRET";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const typeDefs = mergeTypeDefs(
  loadFilesSync(path.join(__dirname, "../api/types")),
);
const resolvers = mergeResolvers(
  loadFilesSync(path.join(__dirname, "../api/resolvers")),
);

const server = new ApolloServer({ typeDefs, resolvers });

export default server;

export const context = async ({ req }) => {
  const tokenStr = req.headers["authorization"] || "";

  return {
    models,
    token: async () => {
      if (tokenStr && tokenStr !== "null") {
        try {
          const actualUser = await jwt.verify(tokenStr, __secret);
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
