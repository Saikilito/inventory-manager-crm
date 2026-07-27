import { describe, it, expect, vi } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { ValidationError } from '../../../../../../../shared-domain/src/shared/errors.js';
import { SupportedCurrency } from '../../../../../../../shared-domain/src/shared/value-objects/currency.vo.js';
import { FinancialDayStatus } from '../../../../../../../shared-domain/src/financial/financial-day.entity.js';
import { makeAccount, IAccount } from '../../../../../../../shared-domain/src/financial/account.entity.js';
import { ProductModel } from '../../../infrastructure/product.model.js';
import { makeCreateStockLot } from '../create-stock-lot.js';
import type { IStockLot } from '../../../../../../../shared-domain/src/stock-lot/stock-lot.entity.js';
import type { IProduct } from '../../../../../../../shared-domain/src/product/product.entity.js';
import type { IProductRepository } from '../../repositories/product.repository.js';
import type { IStockLotRepository } from '../../repositories/stock-lot.repository.js';
import type { IAccountRepository, ITransactionRepository, IFinancialDayRepository } from '../../../../financial/application/repositories/financial.repository.js';
import type { IAccountsPayableRepository } from '../../../../financial/application/repositories/accounts-payable.repository.js';

vi.spyOn(ProductModel, 'updateOne').mockImplementation(() => ({
  exec: async () => ({ modifiedCount: 1 }),
} as unknown as ReturnType<typeof ProductModel.updateOne>));

const VALID_ACC_1 = '507f1f77bcf86cd799439011';
const VALID_ACC_2 = '507f1f77bcf86cd799439012';
const VALID_USER_1 = '507f1f77bcf86cd799439013';
const VALID_DAY_1 = '507f1f77bcf86cd799439014';

const mockAccountRepo = (initialBalance: number = 100) => {
  const store = new Map<string, IAccount>();
  store.set(
    VALID_ACC_1,
    makeAccount({
      id: VALID_ACC_1,
      name: 'Main Cash',
      currency: SupportedCurrency.USD,
      balance: initialBalance,
    }),
  );
  store.set(
    VALID_ACC_2,
    makeAccount({
      id: VALID_ACC_2,
      name: 'Petty Cash',
      currency: SupportedCurrency.USD,
      balance: 50,
    }),
  );

  return {
    getById: async (id: { toString(): string } | string) => {
      const idStr = typeof id === 'string' ? id : id.toString();
      const acc = store.get(idStr);
      if (!acc) return Result.ok(null);
      return Result.ok(acc);
    },
    updateById: async (id: { toString(): string } | string, acc: IAccount) => {
      const idStr = typeof id === 'string' ? id : id.toString();
      store.set(idStr, acc);
      return Result.ok();
    },
  };
};

const mockStockLotRepo = () => ({
  create: async (lot: Partial<IStockLot>) => Result.ok({ ...lot, id: '507f1f77bcf86cd799439088' } as IStockLot),
  updateById: async () => Result.ok(),
});

const mockProductRepo = () => {
  const store = new Map<string, Partial<IProduct>>();
  return {
    getById: async (id: { toString(): string } | string) => {
      const idStr = typeof id === 'string' ? id : id.toString();
      let p = store.get(idStr);
      if (!p) {
        p = { id: idStr, name: 'Coffee', stock: 10, purchasePrice: 15, sellingPrice: 25 };
        store.set(idStr, p);
      }
      return Result.ok(p as IProduct);
    },
    getAll: async () => Result.ok({ items: [], total: 0, page: 1, limit: 10, pages: 0 }),
    create: async (p: Partial<IProduct>) => {
      const idStr = p.id ? p.id.toString() : '507f1f77bcf86cd799439099';
      const created = { ...p, id: idStr };
      store.set(idStr, created);
      return Result.ok(created as IProduct);
    },
  };
};

const mockTxRepo = () => ({
  create: async <T>(tx: T) => Result.ok(tx),
});

const mockFinancialDayRepo = () => ({
  getOne: async () => Result.ok({
    id: VALID_DAY_1,
    date: '2026-07-26',
    status: FinancialDayStatus.OPEN,
  }),
});

const mockPayableRepo = () => ({
  create: async () => Result.ok({ id: '507f1f77bcf86cd799439077' }),
});

describe('createStockLot - Cash Balance Validation', () => {
  it('should succeed when single CASH payment balance is sufficient', async () => {
    const accountRepo = mockAccountRepo(500);
    const useCase = makeCreateStockLot({
      productRepository: mockProductRepo() as unknown as IProductRepository,
      stockLotRepository: mockStockLotRepo() as unknown as IStockLotRepository,
      accountRepository: accountRepo as unknown as IAccountRepository,
      transactionRepository: mockTxRepo() as unknown as ITransactionRepository,
      financialDayRepository: mockFinancialDayRepo() as unknown as IFinancialDayRepository,
      accountsPayableRepository: mockPayableRepo() as unknown as IAccountsPayableRepository,
    });

    const result = await useCase({
      supplier: 'Test Supplier',
      purchaseDate: '2026-07-26',
      paymentMethod: 'CASH',
      accountId: VALID_ACC_1,
      userId: VALID_USER_1,
      items: [
        {
          productName: 'Coffee',
          quantity: 10,
          unitCost: 15,
          confirmedSellingPrice: 25,
        },
      ],
    });

    expect(result.isFailure).toBe(false);
  });

  it('should return ValidationError when single CASH payment exceeds account balance', async () => {
    const accountRepo = mockAccountRepo(100); // Balance $100
    const useCase = makeCreateStockLot({
      productRepository: mockProductRepo() as unknown as IProductRepository,
      stockLotRepository: mockStockLotRepo() as unknown as IStockLotRepository,
      accountRepository: accountRepo as unknown as IAccountRepository,
      transactionRepository: mockTxRepo() as unknown as ITransactionRepository,
      financialDayRepository: mockFinancialDayRepo() as unknown as IFinancialDayRepository,
      accountsPayableRepository: mockPayableRepo() as unknown as IAccountsPayableRepository,
    });

    // Total cost = 10 * 15 = $150 > $100 balance
    const result = await useCase({
      supplier: 'Test Supplier',
      purchaseDate: '2026-07-26',
      paymentMethod: 'CASH',
      accountId: VALID_ACC_1,
      userId: VALID_USER_1,
      items: [
        {
          productName: 'Coffee',
          quantity: 10,
          unitCost: 15,
          confirmedSellingPrice: 25,
        },
      ],
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationError);
    expect(result.getError().message).toBe('Insufficient account balance');
  });

  it('should return ValidationError when split CASH payment exceeds account balance', async () => {
    const accountRepo = mockAccountRepo(100); // acc-1 balance: 100, acc-2 balance: 50
    const useCase = makeCreateStockLot({
      productRepository: mockProductRepo() as unknown as IProductRepository,
      stockLotRepository: mockStockLotRepo() as unknown as IStockLotRepository,
      accountRepository: accountRepo as unknown as IAccountRepository,
      transactionRepository: mockTxRepo() as unknown as ITransactionRepository,
      financialDayRepository: mockFinancialDayRepo() as unknown as IFinancialDayRepository,
      accountsPayableRepository: mockPayableRepo() as unknown as IAccountsPayableRepository,
    });

    // Payment 1 requests $150 from acc-1 ($100 available)
    const result = await useCase({
      supplier: 'Test Supplier',
      purchaseDate: '2026-07-26',
      paymentMethod: 'CASH',
      accountId: VALID_ACC_1,
      payments: [
        { accountId: VALID_ACC_1, amount: 150 },
        { accountId: VALID_ACC_2, amount: 30 },
      ],
      userId: VALID_USER_1,
      items: [
        {
          productName: 'Coffee',
          quantity: 10,
          unitCost: 18,
          confirmedSellingPrice: 25,
        },
      ],
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationError);
    expect(result.getError().message).toBe('Insufficient account balance');
  });

  it('should allow CREDIT purchases regardless of cash balance', async () => {
    const accountRepo = mockAccountRepo(10); // Low balance $10
    const useCase = makeCreateStockLot({
      productRepository: mockProductRepo() as unknown as IProductRepository,
      stockLotRepository: mockStockLotRepo() as unknown as IStockLotRepository,
      accountRepository: accountRepo as unknown as IAccountRepository,
      transactionRepository: mockTxRepo() as unknown as ITransactionRepository,
      financialDayRepository: mockFinancialDayRepo() as unknown as IFinancialDayRepository,
      accountsPayableRepository: mockPayableRepo() as unknown as IAccountsPayableRepository,
    });

    const result = await useCase({
      supplier: 'Test Supplier',
      purchaseDate: '2026-07-26',
      paymentMethod: 'CREDIT',
      userId: VALID_USER_1,
      items: [
        {
          productName: 'Coffee',
          quantity: 10,
          unitCost: 15,
          confirmedSellingPrice: 25,
        },
      ],
    });

    expect(result.isFailure).toBe(false);
  });
});
