import mongoose from 'mongoose';
import {
  validateAggregateAgainstAllowlist,
  validateQueryAgainstAllowlist,
  resolveAllowedFieldsForCollection,
} from '../mongo-query-allowlist.js';
import { MongoCollectionNames, MongoQueryConstants } from '../gemini.constants.js';
import type { ToolDispatcherDependencies } from '../types.js';

export async function handleQueryMongoDB(
  args: Record<string, unknown>,
  _from: string,
  _dependencies: ToolDispatcherDependencies,
  options?: { isFromCrm?: boolean },
): Promise<Record<string, unknown>> {
  if (!options?.isFromCrm) {
    return { error: 'queryMongoDB is only available from CRM context.' };
  }

  const collectionName = (args.collection as string) || '';
  const model = resolveModel(collectionName);

  if (!model) {
    return { error: `Model for collection ${collectionName} was not found or is unregistered.` };
  }

  try {
    if (args.aggregate) {
      return await executeAggregateQuery(model, args.aggregate as string);
    }
    return await executeFindQuery(model, collectionName, args.query as string | undefined);
  } catch (err: unknown) {
    return { error: `Database execution error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

function resolveModel(collectionName: string) {
  const normalized = collectionName.toLowerCase().replace(/[-_s]/g, '');

  const collectionMap: Record<string, string> = {
    product: MongoCollectionNames.Products,
    products: MongoCollectionNames.Products,
    client: MongoCollectionNames.Clients,
    clients: MongoCollectionNames.Clients,
    order: MongoCollectionNames.Orders,
    orders: MongoCollectionNames.Orders,
    expense: MongoCollectionNames.Expenses,
    expenses: MongoCollectionNames.Expenses,
    financialday: MongoCollectionNames.FinancialDays,
    financialdays: MongoCollectionNames.FinancialDays,
    chatsession: MongoCollectionNames.ChatSessions,
    chatsessions: MongoCollectionNames.ChatSessions,
    unsatisfieddemand: MongoCollectionNames.UnsatisfiedDemands,
    unsatisfieddemands: MongoCollectionNames.UnsatisfiedDemands,
    knowledge: 'Knowledge',
    context: MongoCollectionNames.Contexts,
    contexts: MongoCollectionNames.Contexts,
  };

  const modelName = collectionMap[normalized];
  return modelName ? mongoose.model(modelName) : null;
}

async function executeAggregateQuery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: mongoose.Model<any>,
  aggregateJson: string,
): Promise<Record<string, unknown>> {
  const pipeline = JSON.parse(aggregateJson);
  const aggregateError = validateAggregateAgainstAllowlist(pipeline);

  if (aggregateError) {
    return { error: `Query rejected: ${aggregateError}` };
  }

  const results = await model.aggregate(pipeline).exec();
  return { results: results.slice(0, MongoQueryConstants.QUERY_TOOL_RESULT_LIMIT) };
}

async function executeFindQuery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: mongoose.Model<any>,
  collectionName: string,
  queryJson?: string,
): Promise<Record<string, unknown>> {
  const parsedQuery = queryJson ? JSON.parse(queryJson) : {};
  const allowedFields = resolveAllowedFieldsForCollection(collectionName);

  if (!allowedFields) {
    return { error: `No allowlist configured for collection ${collectionName}.` };
  }

  const queryError = validateQueryAgainstAllowlist(parsedQuery, allowedFields);
  if (queryError) {
    return { error: `Query rejected: ${queryError}` };
  }

  const results = await model.find(parsedQuery).limit(MongoQueryConstants.QUERY_TOOL_RESULT_LIMIT).exec();
  return { results };
}
