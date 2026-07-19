import { describe, it, expect } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { makeContext } from '../../../../../../../shared-domain/src/context/context.entity.js';
import { makeUpdateContext } from '../update-context.js';
import { makeDeleteContext } from '../delete-context.js';
import { SchemaIntegrityError, ContextInUseError } from '../../../../../../../shared-domain/src/shared/errors.js';
import {
  CONTEXT_ID,
  PRODUCT_1_ID,
  createMockContext,
  mockExpenseRepository,
} from './context-test-helpers.js';

describe('UpdateContext and DeleteContext Use Cases (Manage Contexts Feature Verification)', () => {
  it('should successfully update an unlinked context without any restriction', async () => {
    let updatedContextResult: any;
    const contextRepo = {
      getById: async () => Result.ok(createMockContext(CONTEXT_ID)),
      updateById: async (id: any, entity: any) => {
        updatedContextResult = entity;
        return Result.ok(void 0);
      }
    } as any;

    const productRepo = {
      getOne: async () => Result.ok(null) // No product linked
    } as any;

    const updateContext = makeUpdateContext(contextRepo, productRepo);
    const result = await updateContext({
      _id: CONTEXT_ID,
      name: 'New Name',
      attributes: [
        { name: 'liters', label: 'Liters New Label', type: 'STRING', required: true }
      ]
    });

    expect(result.isFailure).toBe(false);
    expect(result.getValue().name).toBe('New Name');
    expect(result.getValue().attributes).toEqual([
      { name: 'liters', label: 'Liters New Label', type: 'STRING', required: true }
    ]);
    expect(updatedContextResult.name).toBe('New Name');
  });

  it('should block updating technical name of an attribute even if unlinked', async () => {
    const contextRepo = {
      getById: async () => Result.ok(createMockContext(CONTEXT_ID)) // original attributes: [{ name: 'liters', type: 'NUMBER', required: true }]
    } as any;

    const productRepo = {
      getOne: async () => Result.ok(null) // Unlinked!
    } as any;

    const updateContext = makeUpdateContext(contextRepo, productRepo);
    const result = await updateContext({
      _id: CONTEXT_ID,
      name: 'New Name',
      attributes: [
        { name: 'milliliters', type: 'NUMBER', required: true } // changed name 'liters' -> 'milliliters'
      ]
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(SchemaIntegrityError);
    expect(result.getError().message).toContain('Cannot change technical name');
  });

  it('should successfully update a linked context if change is safe (adding optional attribute)', async () => {
    let updatedContextResult: any;
    const contextRepo = {
      getById: async () => Result.ok(createMockContext(CONTEXT_ID)), // original has attributes: [{ name: 'liters', type: 'NUMBER', required: true }]
      updateById: async (id: any, entity: any) => {
        updatedContextResult = entity;
        return Result.ok(void 0);
      }
    } as any;

    const productRepo = {
      getOne: async () => Result.ok({ id: PRODUCT_1_ID }) // Product linked!
    } as any;

    const updateContext = makeUpdateContext(contextRepo, productRepo);
    const result = await updateContext({
      _id: CONTEXT_ID,
      name: 'Safe Update Name',
      attributes: [
        { name: 'liters', type: 'NUMBER', required: true }, // preserved
        { name: 'brand', type: 'STRING', required: false } // safe addition: optional
      ]
    });

    expect(result.isFailure).toBe(false);
    expect(result.getValue().name).toBe('Safe Update Name');
    expect(result.getValue().attributes.length).toBe(2);
    expect(updatedContextResult.attributes[1]).toEqual({ name: 'brand', label: 'brand', type: 'STRING', required: false });
  });

  it('should block updating a linked context if attribute is deleted', async () => {
    const contextRepo = {
      getById: async () => Result.ok(createMockContext(CONTEXT_ID))
    } as any;

    const productRepo = {
      getOne: async () => Result.ok({ id: PRODUCT_1_ID }) // Product linked!
    } as any;

    const updateContext = makeUpdateContext(contextRepo, productRepo);
    const result = await updateContext({
      _id: CONTEXT_ID,
      name: 'Name',
      attributes: [] // deleted liters attribute
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(SchemaIntegrityError);
    expect(result.getError().message).toContain('Cannot delete attribute');
  });

  it('should block updating a linked context if attribute type changes', async () => {
    const contextRepo = {
      getById: async () => Result.ok(createMockContext(CONTEXT_ID))
    } as any;

    const productRepo = {
      getOne: async () => Result.ok({ id: PRODUCT_1_ID }) // Product linked!
    } as any;

    const updateContext = makeUpdateContext(contextRepo, productRepo);
    const result = await updateContext({
      _id: CONTEXT_ID,
      name: 'Name',
      attributes: [
        { name: 'liters', type: 'STRING', required: true } // type changed NUMBER -> STRING
      ]
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(SchemaIntegrityError);
    expect(result.getError().message).toContain('Cannot change type');
  });

  it('should block updating a linked context if optional is changed to required', async () => {
    // Mock an existing context with an optional attribute
    const optionalContext = makeContext({
      id: CONTEXT_ID,
      name: 'OptionalCtx',
      attributes: [{ name: 'liters', type: 'NUMBER', required: false }]
    });

    const contextRepo = {
      getById: async () => Result.ok(optionalContext)
    } as any;

    const productRepo = {
      getOne: async () => Result.ok({ id: PRODUCT_1_ID }) // Product linked!
    } as any;

    const updateContext = makeUpdateContext(contextRepo, productRepo);
    const result = await updateContext({
      _id: CONTEXT_ID,
      name: 'Name',
      attributes: [
        { name: 'liters', type: 'NUMBER', required: true } // optional -> required
      ]
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(SchemaIntegrityError);
    expect(result.getError().message).toContain('optional to required');
  });

  it('should block updating a linked context if a new attribute is required', async () => {
    const contextRepo = {
      getById: async () => Result.ok(createMockContext(CONTEXT_ID))
    } as any;

    const productRepo = {
      getOne: async () => Result.ok({ id: PRODUCT_1_ID }) // Product linked!
    } as any;

    const updateContext = makeUpdateContext(contextRepo, productRepo);
    const result = await updateContext({
      _id: CONTEXT_ID,
      name: 'Name',
      attributes: [
        { name: 'liters', type: 'NUMBER', required: true },
        { name: 'brand', type: 'STRING', required: true } // brand is new and required
      ]
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(SchemaIntegrityError);
    expect(result.getError().message).toContain('must be optional');
  });

  it('should successfully delete an unlinked context', async () => {
    let deletedIds: any;
    const contextRepo = {
      deleteByIds: async (ids: any) => {
        deletedIds = ids;
        return Result.ok(void 0);
      }
    } as any;

    const productRepo = {
      getOne: async () => Result.ok(null) // No product linked
    } as any;

    const deleteContext = makeDeleteContext(contextRepo, productRepo, mockExpenseRepository);
    const result = await deleteContext(CONTEXT_ID);

    expect(result.isFailure).toBe(false);
    expect(deletedIds[0]).toBe(CONTEXT_ID);
  });

  it('should block deleting a linked context', async () => {
    const contextRepo = {
      deleteByIds: async () => Result.ok(void 0)
    } as any;

    const productRepo = {
      getOne: async () => Result.ok({ id: PRODUCT_1_ID }) // Product linked!
    } as any;

    const deleteContext = makeDeleteContext(contextRepo, productRepo, mockExpenseRepository);
    const result = await deleteContext(CONTEXT_ID);

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ContextInUseError);
    expect(result.getError().message).toContain('Products are assigned');
  });
});
