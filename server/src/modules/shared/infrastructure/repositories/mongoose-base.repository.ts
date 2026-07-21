import mongoose from 'mongoose';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError } from '../../../../../../shared-domain/src/shared/errors.js';
import { doTryResult } from '../../../../../../shared-domain/src/shared/do-try-result.js';
import {
  BaseRepository,
  CreateEntityInput,
  UpdateEntityInput,
  GetAllInput,
  WhereField,
  IShared,
} from '../../../../../../shared-domain/src/shared/repository.js';

export const mapWhereFieldsToMongooseQuery = (fields?: WhereField[]): Record<string, unknown> => {
  if (!fields || fields.length === 0) return {};
  const query: Record<string, unknown> = {};

  for (const f of fields) {
    const fieldNames = Array.isArray(f.field) ? f.field : [f.field];
    const op = f.operator ?? '=';
    const val = f.value;

    const conditions = fieldNames.map((name) => {
      const mongooseName = name === 'id' ? '_id' : name;

      switch (op) {
        case '=':
        case '':
          if (Array.isArray(val)) {
            return { [mongooseName]: { $in: val } };
          }
          return { [mongooseName]: val };
        case '!=':
          if (Array.isArray(val)) {
            return { [mongooseName]: { $nin: val } };
          }
          return { [mongooseName]: { $ne: val } };
        case 'NOT IN':
          return { [mongooseName]: { $nin: Array.isArray(val) ? val : [val] } };
        case 'ILIKE':
          return { [mongooseName]: { $regex: String(val), $options: 'i' } };
        case 'IS NULL':
          return { [mongooseName]: null };
        case 'IS NOT NULL':
          return { [mongooseName]: { $ne: null } };
        case '<':
          return { [mongooseName]: { $lt: val } };
        case '>':
          return { [mongooseName]: { $gt: val } };
        case '<=':
          return { [mongooseName]: { $lte: val } };
        case '>=':
          return { [mongooseName]: { $gte: val } };
        default:
          return { [mongooseName]: val };
      }
    });

    if (conditions.length === 1) {
      const condition = conditions[0];
      const key = Object.keys(condition)[0];
      
      if (
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
      if (!query.$or) {
        query.$or = [];
      }
      query.$or.push(...conditions);
    }
  }

  return query;
};

export interface MongooseBaseRepositoryProps<T, Doc extends mongoose.Document> {
  model: mongoose.Model<Doc>;
  mapToDomain: (doc: Doc) => T;
  mapToDocumentData: (domain: CreateEntityInput<T> | UpdateEntityInput<T>) => Partial<Doc>;
}

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
        (err) => new DatabaseError(err.message),
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
        (err) => new DatabaseError(err.message),
      );
    },

    async getById<R = T>(id: IShared.VO.Id, relations?: IShared.VO.NonEmptyString[]): Promise<Result<R | null, DatabaseError>> {
      return doTryResult(
        async () => {
          let query = model.findById(id);
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
        (err) => new DatabaseError(err.message),
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

          const [docs, total] = await Promise.all([
            query.exec(),
            model.countDocuments(filter).exec(),
          ]);

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
        (err) => new DatabaseError(err.message),
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
        (err) => new DatabaseError(err.message),
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
          const filter: Record<string, unknown> = { _id: id.toString() };
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
        (err) => new DatabaseError(err.message),
      );
    },

    async deleteByIds(ids: IShared.VO.Id[], _deletedBy: IShared.VO.Id): Promise<Result<void, DatabaseError>> {
      return doTryResult(
        async () => {
          await model.deleteMany({ _id: { $in: ids } }).exec();
        },
        (err) => new DatabaseError(err.message),
      );
    },
  };
};
