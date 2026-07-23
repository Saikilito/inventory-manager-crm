/* eslint-disable @typescript-eslint/no-explicit-any -- Mock repositories require flexible typing for test isolation */
import { Result } from '../../../../../../../../shared-domain/src/shared/result.js';
import { DatabaseError } from '../../../../../../../../shared-domain/src/shared/errors.js';
import { IAccount } from '../../../../../../../../shared-domain/src/financial/account.entity.js';
import { ITransaction } from '../../../../../../../../shared-domain/src/financial/transaction.entity.js';
import { IExchangeRate } from '../../../../../../../../shared-domain/src/financial/exchange-rate.entity.js';
import { IFinancialDay, makeFinancialDay, FinancialDayStatus } from '../../../../../../../../shared-domain/src/financial/financial-day.entity.js';
import { IdVO } from '../../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { FinancialDayField } from '../../../repositories/financial-day.constants.js';

export const makeMockAccountRepository = () => {
  const store = new Map<string, IAccount>();
  return {
    getStore() { return store; },
    async getById(id: any) { return Result.ok(store.get(id.toString()) || null); },
    async create(account: any) {
      const id = account.id || IdVO.generate();
      const saved = { ...account, id };
      store.set(id.toString(), saved);
      return Result.ok(saved);
    },
    async getAll() { return Result.ok({ items: Array.from(store.values()), total: store.size }); },
    async updateById(id: any, account: any) {
      const existing = store.get(id.toString());
      if (!existing) return Result.fail(new DatabaseError('Account not found'));
      store.set(id.toString(), { ...existing, ...account });
      return Result.ok();
    }
  };
};

export const makeMockTransactionRepository = () => {
  const store = new Map<string, ITransaction>();
  return {
    getStore() { return store; },
    async getById(id: any) { return Result.ok(store.get(id.toString()) || null); },
    async create(tx: any) {
      const id = tx.id || IdVO.generate();
      const saved = { ...tx, id };
      store.set(id.toString(), saved);
      return Result.ok(saved);
    },
    async deleteByIds(ids: any[]) {
      for (const id of ids) {
        store.delete(id.toString());
      }
      return Result.ok();
    }
  };
};

export const makeMockExchangeRateRepository = () => {
  const store = new Map<string, IExchangeRate>();
  return {
    getStore() { return store; },
    async getOne(where: any) {
      const dateField = where.find((f: any) => f.field.toString() === FinancialDayField.Date);
      if (dateField) {
        return Result.ok(store.get(dateField.value) || null);
      }
      return Result.ok(null);
    },
    async create(rate: any) {
      const id = rate.id || IdVO.generate();
      const saved = { ...rate, id };
      store.set(rate.date.toString(), saved);
      return Result.ok(saved);
    },
    async updateById(id: any, rate: any) {
      const existing = Array.from(store.values()).find(r => r.id!.toString() === id.toString());
      if (!existing) return Result.fail(new DatabaseError('Rate not found'));
      store.set(existing.date.toString(), { ...existing, ...rate });
      return Result.ok();
    }
  };
};

export const makeMockFinancialDayRepository = () => {
  const store = new Map<string, IFinancialDay>();
  return {
    getStore() { return store; },
    async getById(id: any) {
      const found = Array.from(store.values()).find(d => d.id!.toString() === id.toString());
      return Result.ok(found || null);
    },
    async getOne(where: any) {
      const dateField = where.find((f: any) => f.field.toString() === FinancialDayField.Date);
      if (dateField) {
        return Result.ok(store.get(dateField.value) || null);
      }
      return Result.ok(null);
    },
    async create(day: any) {
      const id = day.id || IdVO.generate();
      const saved = { ...day, id };
      store.set(day.date.toString(), saved);
      return Result.ok(saved);
    },
    async updateById(id: any, day: any) {
      const existing = Array.from(store.values()).find(d => d.id!.toString() === id.toString());
      if (!existing) return Result.fail(new DatabaseError('Financial day not found'));
      store.set(existing.date.toString(), { ...existing, ...day });
      return Result.ok();
    },
    seedOpenDay(date: string) {
      const day = makeFinancialDay({
        id: IdVO.generate().toString(),
        date,
        status: FinancialDayStatus.OPEN,
        openedAt: new Date().toISOString(),
      });
      store.set(date, day);
      return day;
    },
    seedClosedDay(date: string) {
      const day = makeFinancialDay({
        id: IdVO.generate().toString(),
        date,
        status: FinancialDayStatus.CLOSED,
        openedAt: new Date().toISOString(),
        closedAt: new Date().toISOString(),
      });
      store.set(date, day);
      return day;
    }
  };
};

export const makeMockDeliveryRepository = () => {
  const store = new Map<string, any>();
  return {
    getStore() { return store; },
    async getById(id: any) { return Result.ok(store.get(id.toString()) || null); },
    async create(delivery: any) {
      const id = delivery.id || IdVO.generate();
      const saved = { ...delivery, id };
      store.set(id.toString(), saved);
      return Result.ok(saved);
    },
    async getAll(input?: any) {
      let items = Array.from(store.values());
      if (input?.where?.fields) {
        const orderIdField = input.where.fields.find((f: any) => f.field.toString() === 'orderId');
        if (orderIdField) {
          items = items.filter(item => item.orderId.toString() === orderIdField.value.toString());
        }
      }
      return Result.ok({ items, total: items.length });
    },
    async deleteByIds(ids: any[]) {
      for (const id of ids) {
        store.delete(id.toString());
      }
      return Result.ok();
    }
  };
};
