import { ApolloServer } from '@apollo/server';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const typeDefs = mergeTypeDefs(
  loadFilesSync([
    path.join(__dirname, '../api/types/**/*.gql'),
    path.join(__dirname, '../modules/**/infrastructure/*.gql'),
  ])
);

const resolvers = mergeResolvers(
  loadFilesSync([
    path.join(__dirname, '../api/resolvers/**/*.js'),
    path.join(__dirname, '../modules/**/infrastructure/*.resolver.ts'),
    path.join(__dirname, '../modules/**/infrastructure/*.resolver.js'),
  ])
);

const server = new ApolloServer({ typeDefs, resolvers });

export default server;

// Re-export context and IContext to ensure zero-touch backward compatibility with existing resolvers
export { context } from './apollo-context.js';
export type { IContext, ModelsType } from './apollo-context.js';
