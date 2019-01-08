import { ApolloServer } from 'apollo-server-express';

//Mezclando types y resolvers
import path from 'path';
import { fileLoader, mergeTypes, mergeResolvers } from 'merge-graphql-schemas';
const typeDefs = mergeTypes(fileLoader(path.join(__dirname, '../api/types')));
const resolvers = mergeResolvers(fileLoader(path.join(__dirname, '../api/resolvers')));

const server = new ApolloServer({typeDefs, resolvers});

export default server
    