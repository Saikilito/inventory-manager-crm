import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { ContextRepository } from "@modules/context/domain/context.repository";
import { IContext, makeContext } from "@shared-domain/context/context.entity";
import { doTryResult } from "@shared-domain/shared/do-try-result";
import { DatabaseError } from "@shared-domain/shared/errors";
import { GET_ALL_CONTEXTS, GET_CONTEXT } from "../graphql/queries";
import { CREATE_CONTEXT, UPDATE_CONTEXT, DELETE_CONTEXT } from "../graphql/mutations";

interface GQLContext {
  _id: string;
  name: string;
  attributes: Array<{
    name: string;
    label?: string;
    type: 'STRING' | 'NUMBER' | 'BOOLEAN';
    required: boolean;
  }>;
}

interface GetAllContextsData {
  getAllContexts: GQLContext[];
}

interface GetContextData {
  getContext: GQLContext;
}

export function makeApolloContextRepository(
  apolloClient: ApolloClient<NormalizedCacheObject>,
): ContextRepository {
  const mapGQLToDomain = (gqlCtx: GQLContext): IContext => {
    return makeContext({
      id: gqlCtx._id,
      name: gqlCtx.name,
      attributes: gqlCtx.attributes.map(attr => ({
        name: attr.name,
        label: attr.label,
        type: attr.type,
        required: attr.required,
      })),
    });
  };

  return {
    getAll: async () => {
      return doTryResult(
        async (): Promise<IContext[]> => {
          const { data } = await apolloClient.query<GetAllContextsData>({
            query: GET_ALL_CONTEXTS,
            fetchPolicy: "no-cache",
          });
          return (data.getAllContexts || []).map(mapGQLToDomain);
        },
        (err) => new DatabaseError(err.message),
      );
    },

    getById: async (id) => {
      return doTryResult(
        async (): Promise<IContext | null> => {
          const { data } = await apolloClient.query<GetContextData>({
            query: GET_CONTEXT,
            variables: { _id: String(id) },
            fetchPolicy: "no-cache",
          });
          if (!data || !data.getContext) return null;
          return mapGQLToDomain(data.getContext);
        },
        (err) => new DatabaseError(err.message),
      );
    },

    create: async (context) => {
      return doTryResult(
        async (): Promise<IContext> => {
          const { data } = await apolloClient.mutate<{ createContext: GQLContext }>({
            mutation: CREATE_CONTEXT,
            variables: {
              input: {
                name: String(context.name),
                attributes: context.attributes.map(attr => ({
                  name: attr.name.toString(),
                  label: attr.label.toString(),
                  type: attr.type,
                  required: attr.required,
                })),
              },
            },
            refetchQueries: [{ query: GET_ALL_CONTEXTS }],
          });
          if (!data || !data.createContext) {
            throw new Error("Failed to create context: empty response");
          }
          return mapGQLToDomain(data.createContext);
        },
        (err) => new DatabaseError(err.message),
      );
    },

    update: async (context) => {
      return doTryResult(
        async (): Promise<IContext> => {
          const { data } = await apolloClient.mutate<{ updateContext: GQLContext }>({
            mutation: UPDATE_CONTEXT,
            variables: {
              input: {
                _id: String(context.id),
                name: String(context.name),
                attributes: context.attributes.map(attr => ({
                  name: attr.name.toString(),
                  label: attr.label.toString(),
                  type: attr.type,
                  required: attr.required,
                })),
              },
            },
            refetchQueries: [{ query: GET_ALL_CONTEXTS }],
          });
          if (!data || !data.updateContext) {
            throw new Error("Failed to update context: empty response");
          }
          return mapGQLToDomain(data.updateContext);
        },
        (err) => new DatabaseError(err.message),
      );
    },

    delete: async (id) => {
      return doTryResult(
        async (): Promise<boolean> => {
          const { data } = await apolloClient.mutate<{ deleteContext: boolean }>({
            mutation: DELETE_CONTEXT,
            variables: { _id: String(id) },
            refetchQueries: [{ query: GET_ALL_CONTEXTS }],
          });
          return data?.deleteContext ?? true;
        },
        (err) => new DatabaseError(err.message),
      );
    },
  };
}
