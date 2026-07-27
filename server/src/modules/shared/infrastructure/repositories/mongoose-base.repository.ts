import mongoose from 'mongoose';
import { match } from 'ts-pattern';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { createDatabaseError, DatabaseError } from '../../../../../../shared-domain/src/shared/errors.js';
import { doTryResult } from '../../../../../../shared-domain/src/shared/do-try-result.js';
import {
  IShared,
  WhereField,
  GetAllInput,
  BaseRepository,
  CreateEntityInput,
  UpdateEntityInput,
} from '../../../../../../shared-domain/src/shared/repository.js';

const isLikelyObjectIdField = (fieldName: string): boolean => {
  const normalizedField = fieldName === 'id' ? '_id' : fieldName;
  return (
    normalizedField === '_id' || normalizedField.endsWith('Id') || /Id$/.test(normalizedField.split('.').pop() || '')
  );
};

export const toObjectIdIfValid = (val: string): mongoose.Types.ObjectId | string => {
  if (typeof val === 'string' && /^[a-fA-F0-9]{24}$/.test(val)) {
    try {
      return new mongoose.Types.ObjectId(val);
    } catch {
      return val;
    }
  }
  return val;
};

const convertToObjectIdIfNeeded = (fieldName: string, val: unknown): unknown => {
  if (!isLikelyObjectIdField(fieldName)) {
    return val;
  }

  if (Array.isArray(val)) {
    return val.map((v) => (typeof v === 'string' ? toObjectIdIfValid(v) : v));
  }

  if (typeof val === 'string') {
    return toObjectIdIfValid(val);
  }

  return val;
};

const createFlexibleIdCondition = (
  fieldName: string,
  val: string | mongoose.Types.ObjectId,
  operator: string,
): Record<string, unknown> | null => {
  if (operator !== '=' && operator !== '' && operator !== '!=') {
    return null;
  }

  if (!fieldName.endsWith('Id') || fieldName.includes('.')) {
    return null;
  }

  if (typeof val !== 'string' || !/^[a-fA-F0-9]{24}$/.test(val)) {
    return null;
  }

  const objectId = toObjectIdIfValid(val);
  if (objectId === val) {
    return null;
  }

  if (operator === '!=') {
    return {
      $and: [{ [fieldName]: { $ne: val } }, { [fieldName]: { $ne: objectId } }],
    };
  }

  return {
    $or: [{ [fieldName]: val }, { [fieldName]: objectId }],
  };
};

export const mapWhereFieldsToMongooseQuery = (fields?: WhereField[]): Record<string, unknown> => {
  if (!fields || fields.length === 0) return {};
  const query: Record<string, unknown> = {};

  for (const f of fields) {
    const fieldNames = Array.isArray(f.field) ? f.field : [f.field];
    const op = f.operator ?? '=';
    const val = f.value;

    const conditions = fieldNames.map((name) => {
      const mongooseName = name === 'id' ? '_id' : name;
      const convertedVal = convertToObjectIdIfNeeded(mongooseName, val);

      if (typeof val === 'string' && isLikelyObjectIdField(mongooseName) && !mongooseName.includes('.')) {
        const flexibleCondition = createFlexibleIdCondition(mongooseName, val, op);
        if (flexibleCondition) {
          return flexibleCondition;
        }
      }

      return match(op)
        .with('=', '', () => {
          if (Array.isArray(convertedVal)) {
            return { [mongooseName]: { $in: convertedVal } };
          }
          return { [mongooseName]: convertedVal };
        })
        .with('!=', () => {
          if (Array.isArray(convertedVal)) {
            return { [mongooseName]: { $nin: convertedVal } };
          }
          return { [mongooseName]: { $ne: convertedVal } };
        })
        .with('NOT IN', () => ({
          [mongooseName]: { $nin: Array.isArray(convertedVal) ? convertedVal : [convertedVal] },
        }))
        .with('ILIKE', () => ({ [mongooseName]: { $regex: String(convertedVal), $options: 'i' } }))
        .with('IS NULL', () => ({ [mongooseName]: null }))
        .with('IS NOT NULL', () => ({ [mongooseName]: { $ne: null } }))
        .with('<', () => ({ [mongooseName]: { $lt: convertedVal } }))
        .with('>', () => ({ [mongooseName]: { $gt: convertedVal } }))
        .with('<=', () => ({ [mongooseName]: { $lte: convertedVal } }))
        .with('>=', () => ({ [mongooseName]: { $gte: convertedVal } }))
        .otherwise(() => ({ [mongooseName]: convertedVal }));
    });

    if (conditions.length === 1) {
      const condition = conditions[0];
      const key = Object.keys(condition)[0];

      if (key === '$or' || key === '$and') {
        if (!query.$and) {
          query.$and = [];
        }
        query.$and.push(condition);
      } else if (
        query[key] !== undefined &&
        typeof query[key] === 'object' &&
        typeof condition[key] === 'object' &&
        !Array.isArray(query[key]) &&
        !Array.isArray(condition[key])
      ) {
        query[key] = { ...(query[key] as Record<string, unknown>), ...condition[key] };
      } else {
        Object.assign(query, condition);
      }
    } else if (conditions.length > 1) {
      if (!query.$and) {
        query.$and = [];
      }
      query.$and.push({ $or: conditions });
    }
  }

  return query;
};

export interface MongooseBaseRepositoryProps<T, Doc extends mongoose.Document> {
  model: mongoose.Model<Doc>;
  mapToDomain: (doc: Doc) => T;
  mapToDocumentData: (domain: CreateEntityInput<T> | UpdateEntityInput<T>) => Partial<Doc>;
}

const mapToDatabaseError = (err: Error): DatabaseError => createDatabaseError(err.message);

export const makeMongooseBaseRepository = <T, Doc extends mongoose.Document>({
  model,
  mapToDomain,
  mapToDocumentData,
}: MongooseBaseRepositoryProps<T, Doc>): BaseRepository<T> => {
  return {
    async create(
      input: CreateEntityInput<T> | CreateEntityInput<T>[],
      createdBy: IShared.VO.Id,
    ): Promise<Result<T | T[], DatabaseError>> {
      return doTryResult(
        async () => {
          const inputs = Array.isArray(input) ? input : [input];
          const docsData = inputs.map((item) => {
            const docData = mapToDocumentData(item);
            return {
              ...docData,
              createdBy: createdBy,
              updatedBy: createdBy,
            };
          });

          const createdDocs = await model.create(docsData);
          const domainEntities = createdDocs.map((doc) => mapToDomain(doc));

          if (Array.isArray(input)) {
            return domainEntities;
          } else {
            return domainEntities[0];
          }
        },
        mapToDatabaseError,
      );
    },

    async getOne<R = T>(where: WhereField[]): Promise<Result<R | null, DatabaseError>> {
      return doTryResult(
        async () => {
          const query = mapWhereFieldsToMongooseQuery(where);
          const doc = await model.findOne(query).exec();
          if (!doc) {
            return null;
          }
          return mapToDomain(doc) as unknown as R;
        },
        mapToDatabaseError,
      );
    },

    async getById<R = T>(
      id: IShared.VO.Id,
      relations?: IShared.VO.NonEmptyString[],
    ): Promise<Result<R | null, DatabaseError>> {
      return doTryResult(
        async () => {
          const objectId = toObjectIdIfValid(id.toString());
          let query = model.findById(objectId);
          if (relations && relations.length > 0) {
            for (const rel of relations) {
              query = query.populate(rel.toString()) as unknown as typeof query;
            }
          }
          const doc = await query.exec();
          if (!doc) {
            return null;
          }
          return mapToDomain(doc) as unknown as R;
        },
        mapToDatabaseError,
      );
    },

    async getAll<R = T>(input?: GetAllInput): Promise<Result<IShared.PaginatedResult<R>, DatabaseError>> {
      return doTryResult(
        async () => {
          const page = input?.page ? Number(input.page) : 1;
          const limit = input?.limit ? Number(input.limit) : 10;
          const skip = (page - 1) * limit;

          const filter = mapWhereFieldsToMongooseQuery(input?.where?.fields);

          let query = model.find(filter);

          if (input?.relations && input.relations.length > 0) {
            for (const rel of input.relations) {
              query = query.populate(rel.toString()) as unknown as typeof query;
            }
          }

          if (input?.sort) {
            const sortDirection = input.sort.direction === 'DESC' ? -1 : 1;
            const sortField = input.sort.field === 'id' ? '_id' : input.sort.field;
            query = query.sort({ [sortField]: sortDirection });
          }

          query = query.skip(skip).limit(limit);

          const [docs, total] = await Promise.all([query.exec(), model.countDocuments(filter).exec()]);

          const items = docs.map((doc) => mapToDomain(doc) as unknown as R);
          const pages = Math.ceil(total / limit);

          return {
            items,
            total,
            page,
            limit,
            pages,
          };
        },
        mapToDatabaseError,
      );
    },

    async updateById(
      id: IShared.VO.Id,
      input: UpdateEntityInput<T>,
      updatedBy: IShared.VO.Id,
    ): Promise<Result<void, DatabaseError>> {
      return doTryResult(
        async () => {
          const docData = mapToDocumentData(input);
          const updateData = {
            ...docData,
            updatedBy,
          };

          const doc = await model.findByIdAndUpdate(id, updateData, { new: true }).exec();
          if (!doc) {
            throw new Error('Document not found for update');
          }
        },
        mapToDatabaseError,
      );
    },

    async updateByIdIf(
      id: IShared.VO.Id,
      where: Partial<Record<keyof T, unknown>>,
      input: UpdateEntityInput<T>,
      updatedBy: IShared.VO.Id,
    ): Promise<Result<boolean, DatabaseError>> {
      return doTryResult(
        async () => {
          const filter: Record<string, unknown> = { _id: toObjectIdIfValid(id.toString()) };
          for (const [key, value] of Object.entries(where)) {
            const docKey = key === 'id' ? '_id' : key;
            filter[docKey] = value;
          }

          const docData = mapToDocumentData(input);
          const updateData = {
            ...docData,
            updatedBy,
          };

          const res = await model.updateOne(filter, { $set: updateData }).exec();
          return res.modifiedCount > 0;
        },
        mapToDatabaseError,
      );
    },

    async deleteByIds(ids: IShared.VO.Id[], _deletedBy: IShared.VO.Id): Promise<Result<void, DatabaseError>> {
      return doTryResult(
        async () => {
          const objectIds = ids.map((id) => toObjectIdIfValid(id.toString()));
          await model.deleteMany({ _id: { $in: objectIds } }).exec();
        },
        mapToDatabaseError,
      );
    },
  };
};
