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
      return await executeAggregateQuery(model, collectionName, args.aggregate as string);
    }
    return await executeFindQuery(model, collectionName, args.query as string | undefined);
  } catch (err: unknown) {
    return { error: `Database execution error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

function resolveModel(collectionName: string) {
  const normalized = normalizeCollectionName(collectionName);

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
  return modelName ? mongoose.model<Record<string, unknown>>(modelName) : null;
}

function replaceKeysRecursive(val: unknown, fieldMap: Record<string, string>): unknown {
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) {
    return val.map((item) => replaceKeysRecursive(item, fieldMap));
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(val as Record<string, unknown>)) {
    const newKey = fieldMap[key] || key;
    result[newKey] = replaceKeysRecursive(value, fieldMap);
  }
  return result;
}

function normalizeQueryForCollection(collectionName: string, query: unknown): unknown {
  const normalized = normalizeCollectionName(collectionName);
  if (normalized === 'product' || normalized === 'products') {
    return replaceKeysRecursive(query, { productName: 'name' });
  }
  if (normalized === 'client' || normalized === 'clients') {
    return replaceKeysRecursive(query, { phone: 'whatsapp' });
  }
  return query;
}

function normalizeCollectionName(collectionName: string): string {
  return collectionName.toLowerCase().replace(/[-_]/g, '').replace(/s$/, '');
}

async function executeAggregateQuery(
  model: mongoose.Model<Record<string, unknown>>,
  collectionName: string,
  aggregateJson: string,
): Promise<Record<string, unknown>> {
  let pipeline: unknown = JSON.parse(aggregateJson);
  pipeline = normalizeQueryForCollection(collectionName, pipeline);
  const allowedFields = resolveAllowedFieldsForCollection(collectionName);
  if (!allowedFields) {
    return { error: `No allowlist configured for collection ${collectionName}.` };
  }
  const aggregateError = validateAggregateAgainstAllowlist(pipeline, allowedFields);

  if (aggregateError) {
    return { error: `Query rejected: ${aggregateError}` };
  }

  const validatedPipeline = pipeline as Array<Record<string, unknown>>;
  const hasDerivedOutput = validatedPipeline.some((stage) => '$group' in stage || '$count' in stage);
  const safePipeline = hasDerivedOutput
    ? validatedPipeline
    : [...validatedPipeline, { $project: buildFieldProjection(allowedFields) }];
  const results = await model.aggregate(safePipeline).exec();
  return { results: results.slice(0, MongoQueryConstants.QUERY_TOOL_RESULT_LIMIT) };
}

async function executeFindQuery(
  model: mongoose.Model<Record<string, unknown>>,
  collectionName: string,
  queryJson?: string,
): Promise<Record<string, unknown>> {
  const parsedQuery = queryJson ? JSON.parse(queryJson) : {};
  const normalizedQuery = normalizeQueryForCollection(collectionName, parsedQuery) as Record<string, unknown>;
  const allowedFields = resolveAllowedFieldsForCollection(collectionName);

  if (!allowedFields) {
    return { error: `No allowlist configured for collection ${collectionName}.` };
  }

  const queryError = validateQueryAgainstAllowlist(normalizedQuery, allowedFields);
  if (queryError) {
    return { error: `Query rejected: ${queryError}` };
  }

  const results = await model
    .find(normalizedQuery)
    .select(buildFieldProjection(allowedFields))
    .limit(MongoQueryConstants.QUERY_TOOL_RESULT_LIMIT)
    .lean()
    .exec();
  return { results };
}

function buildFieldProjection(allowedFields: ReadonlyArray<string>): Record<string, 0 | 1> {
  return Object.fromEntries(allowedFields.map((field) => [field, 1]));
}
