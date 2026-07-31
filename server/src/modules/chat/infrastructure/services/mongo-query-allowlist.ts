import { MongoQueryToolAllowlist } from "./gemini.constants.js";

const COLLECTION_FIELD_ALLOWLIST: Record<string, ReadonlyArray<string>> = {
  [Object.keys(MongoQueryToolAllowlist).find((k) => k === "Products") ?? "Products"]:
    MongoQueryToolAllowlist.Products,
  [Object.keys(MongoQueryToolAllowlist).find((k) => k === "Clients") ?? "Clients"]:
    MongoQueryToolAllowlist.Clients,
  [Object.keys(MongoQueryToolAllowlist).find((k) => k === "Orders") ?? "Orders"]:
    MongoQueryToolAllowlist.Orders,
  [Object.keys(MongoQueryToolAllowlist).find((k) => k === "Expenses") ?? "Expenses"]:
    MongoQueryToolAllowlist.Expenses,
  [Object.keys(MongoQueryToolAllowlist).find((k) => k === "FinancialDays") ?? "FinancialDays"]:
    MongoQueryToolAllowlist.FinancialDays,
  [Object.keys(MongoQueryToolAllowlist).find((k) => k === "ChatSessions") ?? "ChatSessions"]:
    MongoQueryToolAllowlist.ChatSessions,
  [Object.keys(MongoQueryToolAllowlist).find((k) => k === "UnsatisfiedDemands") ?? "UnsatisfiedDemands"]:
    MongoQueryToolAllowlist.UnsatisfiedDemands,
  [Object.keys(MongoQueryToolAllowlist).find((k) => k === "Knowledge") ?? "Knowledge"]:
    MongoQueryToolAllowlist.Knowledge,
  [Object.keys(MongoQueryToolAllowlist).find((k) => k === "Contexts") ?? "Contexts"]:
    MongoQueryToolAllowlist.Contexts,
};

const MAX_AUDIT_TRAVERSAL_DEPTH = 8;
const ALLOWED_OPERATORS = new Set([
  "$eq", "$ne", "$gt", "$gte", "$lt", "$lte",
  "$in", "$nin", "$exists", "$regex", "$options",
  "$and", "$or", "$not", "$nor",
]);
const ALLOWED_AGGREGATE_STAGES = new Set<string>(MongoQueryToolAllowlist.AllowedAggregateStages);
const ALLOWED_AGGREGATE_EXPRESSIONS = new Set([
  "$sum", "$avg", "$min", "$max", "$first", "$last", "$cond", "$ifNull",
  "$eq", "$ne", "$gt", "$gte", "$lt", "$lte", "$in", "$and", "$or", "$not",
]);

const isOperatorKey = (key: string): boolean => key.startsWith("$");

const extractFieldKeys = (value: unknown, depth = 0, acc: Set<string> = new Set()): Set<string> => {
  if (depth > MAX_AUDIT_TRAVERSAL_DEPTH) return acc;
  if (value === null || value === undefined) return acc;
  if (Array.isArray(value)) {
    for (const item of value) extractFieldKeys(item, depth + 1, acc);
    return acc;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (!isOperatorKey(key)) acc.add(key);
      extractFieldKeys(child, depth + 1, acc);
    }
  }
  return acc;
};

const auditOperators = (value: unknown, depth = 0): string | null => {
  if (depth > MAX_AUDIT_TRAVERSAL_DEPTH) return "exceeded max traversal depth";
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const err = auditOperators(item, depth + 1);
      if (err) return err;
    }
    return null;
  }
  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (isOperatorKey(key) && !ALLOWED_OPERATORS.has(key)) {
        return `disallowed operator: ${key}`;
      }
      const err = auditOperators(child, depth + 1);
      if (err) return err;
    }
  }
  return null;
};

export const validateQueryAgainstAllowlist = (
  query: unknown,
  allowedFields: ReadonlyArray<string>,
): string | null => {
  const fields = extractFieldKeys(query);
  for (const field of fields) {
    if (!allowedFields.includes(field)) {
      return `disallowed field: ${field}`;
    }
  }
  return auditOperators(query);
};

const auditAggregateValue = (
  value: unknown,
  allowedFields: ReadonlyArray<string>,
  depth = 0,
): string | null => {
  if (depth > MAX_AUDIT_TRAVERSAL_DEPTH) return "exceeded max traversal depth";
  if (typeof value === "string" && value.startsWith("$") && !value.startsWith("$$")) {
    const field = value.slice(1);
    return allowedFields.includes(field) ? null : `disallowed field reference: ${field}`;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const error = auditAggregateValue(item, allowedFields, depth + 1);
      if (error) return error;
    }
    return null;
  }
  if (value === null || typeof value !== "object") return null;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (key.startsWith("$") && !ALLOWED_AGGREGATE_EXPRESSIONS.has(key)) {
      return `disallowed aggregate expression: ${key}`;
    }
    const error = auditAggregateValue(child, allowedFields, depth + 1);
    if (error) return error;
  }
  return null;
};

export const validateAggregateAgainstAllowlist = (
  pipeline: unknown,
  allowedFields: ReadonlyArray<string>,
): string | null => {
  if (!Array.isArray(pipeline)) return "aggregate pipeline must be an array";
  for (const stage of pipeline) {
    if (stage === null || typeof stage !== "object" || Array.isArray(stage)) {
      return "each aggregate stage must be an object";
    }
    for (const stageKey of Object.keys(stage as Record<string, unknown>)) {
      if (!ALLOWED_AGGREGATE_STAGES.has(stageKey)) {
        return `disallowed aggregate stage: ${stageKey}`;
      }
    }
    const stageRecord = stage as Record<string, unknown>;
    if (stageRecord.$match) {
      const matchError = validateQueryAgainstAllowlist(stageRecord.$match, allowedFields);
      if (matchError) return matchError;
    }
    if (stageRecord.$project && typeof stageRecord.$project === "object") {
      for (const [field, inclusion] of Object.entries(stageRecord.$project as Record<string, unknown>)) {
        if (inclusion === 1 && field !== "_id" && !allowedFields.includes(field)) {
          return `disallowed projected field: ${field}`;
        }
      }
    }
    if (stageRecord.$sort && typeof stageRecord.$sort === "object") {
      for (const field of Object.keys(stageRecord.$sort as Record<string, unknown>)) {
        if (!allowedFields.includes(field)) return `disallowed sort field: ${field}`;
      }
    }
    const stagePayload = Object.entries(stageRecord).find(([key]) => key !== "$match")?.[1];
    const aggregateError = auditAggregateValue(stagePayload, allowedFields);
    if (aggregateError) return aggregateError;
  }
  return null;
};

export const resolveAllowedFieldsForCollection = (collectionName: string): ReadonlyArray<string> | null => {
  const key = Object.keys(COLLECTION_FIELD_ALLOWLIST).find(
    (k) => k.toLowerCase() === collectionName.toLowerCase(),
  );
  const fields = key ? COLLECTION_FIELD_ALLOWLIST[key] : undefined;
  return fields ? ['_id', ...fields] : null;
};
