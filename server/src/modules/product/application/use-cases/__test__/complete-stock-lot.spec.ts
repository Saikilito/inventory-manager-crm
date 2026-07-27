import { describe, it, expect, vi } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import { ValidationError } from '../../../../../../../shared-domain/src/shared/errors.js';
import { SupportedCurrency } from '../../../../../../../shared-domain/src/shared/value-objects/currency.vo.js';
import { FinancialDayStatus } from '../../../../../../../shared-domain/src/financial/financial-day.entity.js';
import { makeAccount } from '../../../../../../../shared-domain/src/financial/account.entity.js';
import { ProductModel } from '../../../infrastructure/product.model.js';
import { makeStockLot, makeStockLotItem, IStockLot } from '../../../../../../../shared-domain/src/stock-lot/stock-lot.entity.js';
import { makeCompleteStockLot } from '../complete-stock-lot.js';
import type { IProduct } from '../../../../../../../shared-domain/src/product/product.entity.js';
import type { IProductRepository } from '../../repositories/product.repository.js';
import type { IStockLotRepository } from '../../repositories/stock-lot.repository.js';
import type { IAccountRepository, ITransactionRepository, IFinancialDayRepository } from '../../../../financial/application/repositories/financial.repository.js';
import type { IAccountsPayableRepository } from '../../../../financial/application/repositories/accounts-payable.repository.js';

vi.spyOn(ProductModel, 'updateOne').mockImplementation(() => ({
  exec: async () => ({ modifiedCount: 1 }),
} as unknown as ReturnType<typeof ProductModel.updateOne>));

const VALID_LOT_1 = '507f1f77bcf86cd799439011';
const VALID_ACC_1 = '507f1f77bcf86cd799439012';
const VALID_USER_1 = '507f1f77bcf86cd799439013';
const VALID_DAY_1 = '507f1f77bcf86cd799439014';
const VALID_PROD_1 = '507f1f77bcf86cd799439015';

const mockAccountRepo = (balance: number) => {
  const account = makeAccount({
    id: VALID_ACC_1,
    name: 'Petty Cash',
    currency: SupportedCurrency.USD,
    balance,
  });

  return {
    getById: async () => Result.ok(account),
    updateById: async () => Result.ok(),
  };
};

const mockStockLotRepo = (draftLot: IStockLot) => ({
  getById: async () => Result.ok(draftLot),
  updateById: async (_id: unknown, data: Partial<IStockLot>) => Result.ok(data),
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
  create: async () => Result.ok({ id: '507f1f77bcf86cd799439088' }),
});

const mockFinancialDayRepo = () => ({
  getOne: async () => Result.ok({
    id: VALID_DAY_1,
    date: '2026-07-26',
    status: FinancialDayStatus.OPEN,
  }),
});

const mockPayableRepo = () => ({
  create: async <T>(p: T) => Result.ok(p),
});

describe('completeStockLot - Cash Balance Validation', () => {
  const createDraftLot = () =>
    makeStockLot({
      id: VALID_LOT_1,
      supplier: 'Draft Supplier',
      purchaseDate: '2026-07-26',
      paymentMethod: 'CASH',
      status: 'DRAFT',
      items: [
        makeStockLotItem({
          productId: VALID_PROD_1,
          productName: 'Coffee',
          quantity: 10,
          unitCost: 30, // Total cost = $300
          confirmedSellingPrice: 40,
        }),
      ],
    });

  it('should fail with ValidationError when cash account balance is less than required payment', async () => {
    const draftLot = createDraftLot();
    const accountRepo = mockAccountRepo(200); // Balance $200 < $300 cost
    const stockLotRepo = mockStockLotRepo(draftLot);

    const completeStockLot = makeCompleteStockLot({
      productRepository: mockProductRepo() as unknown as IProductRepository,
      stockLotRepository: stockLotRepo as unknown as IStockLotRepository,
      accountRepository: accountRepo as unknown as IAccountRepository,
      transactionRepository: mockTxRepo() as unknown as ITransactionRepository,
      financialDayRepository: mockFinancialDayRepo() as unknown as IFinancialDayRepository,
      accountsPayableRepository: mockPayableRepo() as unknown as IAccountsPayableRepository,
    });

    const result = await completeStockLot({
      stockLotId: VALID_LOT_1,
      accountId: VALID_ACC_1,
      userId: VALID_USER_1,
    });

    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationError);
    expect(result.getError().message).toBe('Insufficient account balance');
  });

  it('should succeed when cash account balance is equal or greater than required payment', async () => {
    const draftLot = createDraftLot();
    const accountRepo = mockAccountRepo(400); // Balance $400 >= $300 cost
    const stockLotRepo = mockStockLotRepo(draftLot);

    const completeStockLot = makeCompleteStockLot({
      productRepository: mockProductRepo() as unknown as IProductRepository,
      stockLotRepository: stockLotRepo as unknown as IStockLotRepository,
      accountRepository: accountRepo as unknown as IAccountRepository,
      transactionRepository: mockTxRepo() as unknown as ITransactionRepository,
      financialDayRepository: mockFinancialDayRepo() as unknown as IFinancialDayRepository,
      accountsPayableRepository: mockPayableRepo() as unknown as IAccountsPayableRepository,
    });

    const result = await completeStockLot({
      stockLotId: VALID_LOT_1,
      accountId: VALID_ACC_1,
      userId: VALID_USER_1,
    });

    expect(result.isFailure).toBe(false);
  });
});
