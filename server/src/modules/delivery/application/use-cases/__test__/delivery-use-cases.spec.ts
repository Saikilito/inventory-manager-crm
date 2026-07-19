import { describe, it, expect } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { IDelivery, makeDelivery, DeliveryStatus } from '../../../../../../../shared-domain/src/delivery/delivery.entity.js';
import { IDeliveryRepository } from '../../repositories/delivery.repository.js';
import { makeScheduleDelivery } from '../schedule-delivery.js';
import { makeUpdateDeliveryStatus } from '../update-delivery-status.js';
import { makeGetDelivery } from '../get-delivery.js';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { ValidationError } from '../../../../../../../shared-domain/src/shared/validation-error.js';

const VALID_ORDER_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_DELIVERY_UUID = '550e8400-e29b-41d4-a716-446655440001';

const makeMockDeliveryRepository = (): IDeliveryRepository => {
  const store = new Map<string, IDelivery>();

  return {
    create: async (deliveryOrDeliveries: IDelivery | IDelivery[], createdBy?: any) => {
      if (Array.isArray(deliveryOrDeliveries)) {
        const results = deliveryOrDeliveries.map(d => {
          const id = d.id || IdVO.generate();
          const saved = { ...d, id };
          store.set(id, saved);
          return saved;
        });
        return Result.ok(results) as any;
      } else {
        const id = deliveryOrDeliveries.id || IdVO.generate();
        const saved = { ...deliveryOrDeliveries, id };
        store.set(id, saved);
        return Result.ok(saved);
      }
    },
    getById: async (id) => {
      return Result.ok(store.get(id) || null) as any;
    },
    getOne: async (where) => {
      return Result.ok(null);
    },
    getAll: async (input) => {
      let items = Array.from(store.values());
      if (input?.where?.fields) {
        for (const f of input.where.fields) {
          const fieldNames = Array.isArray(f.field) ? f.field : [f.field];
          const val = f.value;
          const op = f.operator ?? '=';

          items = items.filter(item => {
            return fieldNames.some(name => {
              const itemVal = (item as any)[name];
              if (op === '=') {
                if (Array.isArray(val)) {
                  return val.includes(itemVal);
                }
                return itemVal === val;
              }
              if (op === '!=') {
                if (Array.isArray(val)) {
                  return !val.includes(itemVal);
                }
                return itemVal !== val;
              }
              if (op === 'ILIKE') {
                return String(itemVal).toLowerCase().includes(String(val).toLowerCase());
              }
              if (op === '<') {
                return val !== null && val !== undefined && itemVal < val;
              }
              if (op === '>') {
                return val !== null && val !== undefined && itemVal > val;
              }
              return true;
            });
          });
        }
      }
      return Result.ok({
        items,
        total: items.length,
        page: 1,
        limit: 10,
        pages: 1
      }) as any;
    },
    updateById: async (id, input, updatedBy) => {
      const existing = store.get(id);
      if (!existing) {
        throw new Error('Delivery not found');
      }
      const updated = { ...existing, ...input };
      store.set(id, updated);
      return Result.ok(void 0);
    },
    updateByIdIf: async (id, where, input, updatedBy) => {
      const existing = store.get(id);
      if (!existing) return Result.ok(false);
      const updated = { ...existing, ...input };
      store.set(id, updated);
      return Result.ok(true);
    },
    deleteByIds: async (ids, deletedBy) => {
      ids.forEach(id => store.delete(id));
      return Result.ok(void 0);
    }
  };
};

describe('Logistics & Delivery Use Cases', () => {
  it('should successfully schedule a delivery with a particular time', async () => {
    const repo = makeMockDeliveryRepository();
    const scheduleDelivery = makeScheduleDelivery(repo);

    const result = await scheduleDelivery({
      orderId: VALID_ORDER_UUID,
      scheduledDate: '2026-06-30T10:00:00.000-04:00',
      deliveryTime: '15:30',
      address: 'Altamira, Caracas',
      notes: 'Ring bell on arrival',
    });

    expect(result.isFailure).toBe(false);
    const delivery = result.getValue();
    expect(delivery.orderId).toBe(VALID_ORDER_UUID);
    expect(delivery.deliveryTime).toBe('15:30');
    expect(delivery.status).toBe(DeliveryStatus.PENDING);
    expect(delivery.notes).toBe('Ring bell on arrival');
  });

  it('should successfully update delivery status', async () => {
    const repo = makeMockDeliveryRepository();
    const scheduleDelivery = makeScheduleDelivery(repo);
    const mockOrderRepo = {
      getById: async () => Result.ok({ id: VALID_ORDER_UUID, deliveryStatus: 'PENDING', status: 'ACTIVE' } as any),
      updateById: async () => Result.ok(void 0)
    } as any;
    const updateDeliveryStatus = makeUpdateDeliveryStatus(repo, mockOrderRepo);
    const getDelivery = makeGetDelivery(repo);

    const scheduleResult = await scheduleDelivery({
      orderId: VALID_ORDER_UUID,
      scheduledDate: '2026-06-30T14:30:00.000-04:00',
      deliveryTime: '15:30',
      address: 'Prados del Este',
    });
    const deliveryId = scheduleResult.getValue().id!;

    const updateResult = await updateDeliveryStatus({
      id: deliveryId,
      status: 'DISPATCHED',
    });

    expect(updateResult.isFailure).toBe(false);
    expect(updateResult.getValue().status).toBe(DeliveryStatus.DISPATCHED);

    const getResult = await getDelivery(deliveryId);
    expect(getResult.isFailure).toBe(false);
    expect(getResult.getValue().status).toBe(DeliveryStatus.DISPATCHED);
  });

  it('should fail update status when status string is invalid', async () => {
    const repo = makeMockDeliveryRepository();
    const mockOrderRepo = {
      getById: async () => Result.ok(null)
    } as any;
    const updateDeliveryStatus = makeUpdateDeliveryStatus(repo, mockOrderRepo);

    const result = await updateDeliveryStatus({
      id: VALID_DELIVERY_UUID,
      status: 'NOT_A_REAL_STATUS',
    });

    expect(result.isFailure).toBe(true);
  });
});
