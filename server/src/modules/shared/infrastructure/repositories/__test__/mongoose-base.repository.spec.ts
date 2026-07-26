import { describe, it, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError } from '../../../../../../../shared-domain/src/shared/errors.js';
import {
  mapWhereFieldsToMongooseQuery,
  makeMongooseBaseRepository,
} from '../mongoose-base.repository.js';
import { WhereField } from '../../../../../../../shared-domain/src/shared/repository.js';

describe('mongoose-base.repository', () => {
  describe('mapWhereFieldsToMongooseQuery', () => {
    it('should map empty fields to empty query', () => {
      expect(mapWhereFieldsToMongooseQuery()).toEqual({});
      expect(mapWhereFieldsToMongooseQuery([])).toEqual({});
    });

    it('should map basic equal condition', () => {
      const fields: WhereField[] = [
        { field: 'name' as any, value: 'John', operator: '=' },
      ];
      expect(mapWhereFieldsToMongooseQuery(fields)).toEqual({ name: 'John' });
    });

    it('should map array value in equal to $in', () => {
      const fields: WhereField[] = [
        { field: 'id' as any, value: ['id1', 'id2'], operator: '=' },
      ];
      expect(mapWhereFieldsToMongooseQuery(fields)).toEqual({ _id: { $in: ['id1', 'id2'] } });
    });

    it('should convert valid ObjectId strings to ObjectId for _id field', () => {
      const validObjectId = '507f1f77bcf86cd799439011';
      const fields: WhereField[] = [
        { field: 'id' as any, value: validObjectId, operator: '=' },
      ];
      const result = mapWhereFieldsToMongooseQuery(fields);
      expect(result._id).toBeInstanceOf(mongoose.Types.ObjectId);
    });

    it('should convert valid ObjectId strings to ObjectId for fields ending with Id', () => {
      const validObjectId = '507f1f77bcf86cd799439011';
      const fields: WhereField[] = [
        { field: 'clientId' as any, value: validObjectId, operator: '=' },
      ];
      const result = mapWhereFieldsToMongooseQuery(fields);
      const $or = (result.$and as any)[0].$or;
      expect($or[1].clientId).toBeInstanceOf(mongoose.Types.ObjectId);
    });

    it('should convert valid ObjectId strings to ObjectId for nested Id fields (e.g., items.productId)', () => {
      const validObjectId1 = '507f1f77bcf86cd799439011';
      const validObjectId2 = '507f1f77bcf86cd799439012';
      const fields: WhereField[] = [
        { field: 'items.productId' as any, value: [validObjectId1, validObjectId2], operator: '=' },
      ];
      const result = mapWhereFieldsToMongooseQuery(fields);
      const inValues = (result as any)['items.productId'].$in;
      expect(inValues[0]).toBeInstanceOf(mongoose.Types.ObjectId);
      expect(inValues[1]).toBeInstanceOf(mongoose.Types.ObjectId);
    });

    it('should NOT convert non-ObjectId-like strings', () => {
      const fields: WhereField[] = [
        { field: 'name' as any, value: 'John', operator: '=' },
      ];
      expect(mapWhereFieldsToMongooseQuery(fields)).toEqual({ name: 'John' });
    });

    it('should NOT convert invalid hex strings for Id fields', () => {
      const fields: WhereField[] = [
        { field: 'clientId' as any, value: 'not-a-valid-id', operator: '=' },
      ];
      expect(mapWhereFieldsToMongooseQuery(fields)).toEqual({ clientId: 'not-a-valid-id' });
    });

    it('should map ILIKE to regex with i option', () => {
      const fields: WhereField[] = [
        { field: 'name' as any, value: 'john', operator: 'ILIKE' },
      ];
      expect(mapWhereFieldsToMongooseQuery(fields)).toEqual({
        name: { $regex: 'john', $options: 'i' },
      });
    });

    it('should map IS NULL and IS NOT NULL', () => {
      const fieldsNull: WhereField[] = [
        { field: 'deletedAt' as any, value: null, operator: 'IS NULL' },
      ];
      expect(mapWhereFieldsToMongooseQuery(fieldsNull)).toEqual({ deletedAt: null });

      const fieldsNotNull: WhereField[] = [
        { field: 'verifiedAt' as any, value: null, operator: 'IS NOT NULL' },
      ];
      expect(mapWhereFieldsToMongooseQuery(fieldsNotNull)).toEqual({
        verifiedAt: { $ne: null },
      });
    });

    it('should map comparison operators', () => {
      const fields: WhereField[] = [
        { field: 'age' as any, value: 18, operator: '>=' },
      ];
      expect(mapWhereFieldsToMongooseQuery(fields)).toEqual({
        age: { $gte: 18 },
      });
    });

    it('should map multiple fields with $or when field is an array', () => {
      const fields: WhereField[] = [
        { field: ['firstName', 'lastName'] as any, value: 'John', operator: '=' },
      ];
      expect(mapWhereFieldsToMongooseQuery(fields)).toEqual({
        $and: [
          {
            $or: [
              { firstName: 'John' },
              { lastName: 'John' },
            ],
          },
        ],
      });
    });
  });

  describe('makeMongooseBaseRepository', () => {
    const mockModel: any = {
      create: vi.fn(),
      findOne: vi.fn(),
      findById: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      updateOne: vi.fn(),
      deleteMany: vi.fn(),
    };

    const mapToDomain = (doc: any) => ({ id: doc._id, name: doc.name });
    const mapToDocumentData = (domain: any) => ({ name: domain.name });

    const repository = makeMongooseBaseRepository<any, any>({
      model: mockModel,
      mapToDomain,
      mapToDocumentData,
    });

    it('should create an entity successfully', async () => {
      const mockDoc = { _id: '123', name: 'John' };
      mockModel.create.mockResolvedValueOnce([mockDoc]);

      const result = await repository.create({ name: 'John' } as any, 'creator-id' as any);
      expect(result.isFailure).toBe(false);
      expect(result.getValue()).toEqual({ id: '123', name: 'John' });
      expect(mockModel.create).toHaveBeenCalledWith([
        { name: 'John', createdBy: 'creator-id', updatedBy: 'creator-id' },
      ]);
    });

    it('should get an entity by id', async () => {
      const mockDoc = { _id: '123', name: 'John' };
      const mockQueryExec = { exec: vi.fn().mockResolvedValueOnce(mockDoc) };
      mockModel.findById.mockReturnValueOnce(mockQueryExec);

      const result = await repository.getById('123' as any);
      expect(result.isFailure).toBe(false);
      expect(result.getValue()).toEqual({ id: '123', name: 'John' });
      expect(mockModel.findById).toHaveBeenCalledWith('123');
    });

    it('should return null if entity not found by id', async () => {
      const mockQueryExec = { exec: vi.fn().mockResolvedValueOnce(null) };
      mockModel.findById.mockReturnValueOnce(mockQueryExec);

      const result = await repository.getById('999' as any);
      expect(result.isFailure).toBe(false);
      expect(result.getValue()).toBeNull();
    });

    it('should update an entity successfully', async () => {
      const mockDoc = { _id: '123', name: 'John' };
      const mockQueryExec = { exec: vi.fn().mockResolvedValueOnce(mockDoc) };
      mockModel.findByIdAndUpdate.mockReturnValueOnce(mockQueryExec);

      const result = await repository.updateById('123' as any, { name: 'John' } as any, 'updater-id' as any);
      expect(result.isFailure).toBe(false);
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith('123', { name: 'John', updatedBy: 'updater-id' }, { new: true });
    });

    it('should delete entities successfully', async () => {
      const mockQueryExec = { exec: vi.fn().mockResolvedValueOnce({ deletedCount: 1 }) };
      mockModel.deleteMany.mockReturnValueOnce(mockQueryExec);

      const result = await repository.deleteByIds(['123' as any], 'deleter-id' as any);
      expect(result.isFailure).toBe(false);
      expect(mockModel.deleteMany).toHaveBeenCalledWith({ _id: { $in: ['123'] } });
    });
  });
});
