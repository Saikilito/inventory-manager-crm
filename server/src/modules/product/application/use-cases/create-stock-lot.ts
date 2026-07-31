import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, createDatabaseError, createValidationError, createNotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { DateOnlyVO } from '../../../../../../shared-domain/src/shared/value-objects/date-only.vo.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { IProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import { IStockLot, makeStockLot, makeStockLotItem } from '../../../../../../shared-domain/src/stock-lot/stock-lot.entity.js';
import { IProductRepository } from '../repositories/product.repository.js';
import { IStockLotRepository } from '../repositories/stock-lot.repository.js';
import { IAccountRepository, ITransactionRepository, IFinancialDayRepository } from '../../../financial/application/repositories/financial.repository.js';
import { IAccountsPayableRepository } from '../../../financial/application/repositories/accounts-payable.repository.js';
import { makeFindOrOpenFinancialDay } from '../../../financial/application/services/find-or-open-financial-day.js';
import { processStockLotItems, applyStockLotProductUpdates } from './atomic-stock-update.js';
import { executeCashPayment, executeCreditPayment } from './stock-lot-payment-helper.js';
import { z } from 'zod';

const StockLotItemInputSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, 'Product name is required'),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  unitCost: z.number().positive('Unit cost must be positive'),
  confirmedSellingPrice: z.number().positive('Selling price must be positive'),
});

const SplitPaymentInputSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  amount: z.number().positive('Amount must be positive'),
});

const CreateStockLotInputSchema = z.object({
  supplier: z.string().min(1, 'Supplier is required'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  items: z.array(StockLotItemInputSchema).min(1, 'At least one item is required'),
  paymentMethod: z.enum(['CASH', 'CREDIT']),
  accountId: z.string().optional(),
  payments: z.array(SplitPaymentInputSchema).optional(),
  notes: z.string().optional(),
  contextId: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  status: z.enum(['DRAFT', 'RECEIVED', 'PARTIAL', 'PAID']).optional().default('RECEIVED'),
});

export type CreateStockLotInput = z.infer<typeof CreateStockLotInputSchema>;

export interface CreateStockLotOutput {
  stockLot: IStockLot;
  accountsPayableId?: string;
  createdProducts: IProduct[];
  updatedProducts: IProduct[];
}

export type CreateStockLot = UseCase<CreateStockLotInput, CreateStockLotOutput, DomainError>;

export const makeCreateStockLot = (deps: {
  productRepository: IProductRepository;
  stockLotRepository: IStockLotRepository;
  accountRepository: IAccountRepository;
  transactionRepository: ITransactionRepository;
  financialDayRepository: IFinancialDayRepository;
  accountsPayableRepository: IAccountsPayableRepository;
}): CreateStockLot => {
  const {
    productRepository,
    stockLotRepository,
    accountRepository,
    transactionRepository,
    financialDayRepository,
    accountsPayableRepository,
  } = deps;

  const findOrOpenFinancialDay = makeFindOrOpenFinancialDay(financialDayRepository, accountRepository);

  return async (input: CreateStockLotInput) => {
    const validationResult = CreateStockLotInputSchema.safeParse(input);
    if (!validationResult.success) {
      return Result.fail(createValidationError(`Validation failed: ${validationResult.error.message}`));
    }

    const validatedInput = validationResult.data;

    if (validatedInput.paymentMethod === 'CASH' && !validatedInput.accountId) {
      return Result.fail(createDatabaseError('Account ID is required for CASH payment'));
    }

    if (validatedInput.status === 'DRAFT') {
      const stockLotItems = validatedInput.items.map((item) =>
        makeStockLotItem({
          productId: undefined,
          productName: item.productName,
          quantity: item.quantity,
          unitCost: item.unitCost,
          confirmedSellingPrice: item.confirmedSellingPrice,
          isNewProduct: false,
        }),
      );

      const stockLot = makeStockLot({
        supplier: validatedInput.supplier,
        purchaseDate: validatedInput.purchaseDate,
        items: stockLotItems,
        paymentMethod: validatedInput.paymentMethod,
        accountId: validatedInput.accountId,
        status: 'DRAFT',
        notes: validatedInput.notes,
        contextId: validatedInput.contextId,
      });

      const saveResult = await stockLotRepository.create(stockLot, IdVO.create(validatedInput.userId));
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      const saved = saveResult.getValue() as IStockLot;

      return Result.ok<CreateStockLotOutput, DomainError>({
        stockLot: saved,
        createdProducts: [],
        updatedProducts: [],
      });
    }

    const productsResult = await processStockLotItems(validatedInput.items, productRepository, validatedInput.contextId);
    if (productsResult.isFailure) {
      return Result.fail(productsResult.getError());
    }

    const products = productsResult.getValue();

    const stockLotItems = products.map((p) =>
      makeStockLotItem({
        productId: p.productId,
        productName: p.productName,
        quantity: p.quantity,
        unitCost: p.unitCost,
        confirmedSellingPrice: p.confirmedSellingPrice,
        isNewProduct: p.isNewProduct,
      }),
    );

    try {
      if (validatedInput.paymentMethod === 'CASH') {
        if (validatedInput.payments && validatedInput.payments.length > 0) {
          for (const payment of validatedInput.payments) {
            const accResult = await accountRepository.getById(IdVO.create(payment.accountId));
            if (accResult.isFailure || !accResult.getValue()) {
              return Result.fail(createNotFoundError('Account not found'));
            }
            const acc = accResult.getValue()!;
            const paymentAmount = PositiveNumberVO.create(payment.amount);
            if (!acc.canDebit(paymentAmount)) {
              return Result.fail(createValidationError('Insufficient account balance'));
            }
          }
        }

        const dateStr = DateOnlyVO.create(validatedInput.purchaseDate);
        const dayResult = await findOrOpenFinancialDay(dateStr.toString());
        if (dayResult.isFailure) {
          return Result.fail(dayResult.getError());
        }

        const financialDay = dayResult.getValue();
        const generatedStockLotId = IdVO.generate().toString();
        const generatedTransactionId = IdVO.generate().toString();

        const stockLot = makeStockLot({
          id: generatedStockLotId,
          supplier: validatedInput.supplier,
          purchaseDate: validatedInput.purchaseDate,
          items: stockLotItems,
          paymentMethod: 'CASH',
          accountId: validatedInput.accountId,
          transactionId: generatedTransactionId,
          notes: validatedInput.notes,
          contextId: validatedInput.contextId,
        });

        const cashResult = await executeCashPayment({
          supplier: validatedInput.supplier,
          purchaseDate: validatedInput.purchaseDate,
          totalCost: Number(stockLot.totalCost),
          accountId: validatedInput.accountId!,
          userId: validatedInput.userId,
          stockLotId: generatedStockLotId,
          financialDayId: financialDay.id!.toString(),
          transactionId: generatedTransactionId,
          accountRepository,
          transactionRepository,
        });

        if (cashResult.isFailure) {
          return Result.fail(cashResult.getError());
        }

        const saveResult = await stockLotRepository.create(stockLot, IdVO.create(validatedInput.userId));
        if (saveResult.isFailure) {
          return Result.fail(saveResult.getError());
        }

        const saved = saveResult.getValue() as IStockLot;

        const { createdProducts, updatedProducts } = await applyStockLotProductUpdates(
          products,
          validatedInput.userId,
          productRepository,
        );

        return Result.ok<CreateStockLotOutput, DomainError>({
          stockLot: saved,
          createdProducts,
          updatedProducts,
        });
      } else {
        const stockLot = makeStockLot({
          supplier: validatedInput.supplier,
          purchaseDate: validatedInput.purchaseDate,
          items: stockLotItems,
          paymentMethod: 'CREDIT',
          notes: validatedInput.notes,
          contextId: validatedInput.contextId,
        });

        const saveStockLotResult = await stockLotRepository.create(stockLot, IdVO.create(validatedInput.userId));
        if (saveStockLotResult.isFailure) {
          return Result.fail(saveStockLotResult.getError());
        }

        const savedStockLot = saveStockLotResult.getValue() as IStockLot;
        const stockLotId = savedStockLot.id!.toString();
        const totalAmount = stockLotItems.reduce((sum, item) => sum + Number(item.unitCost) * Number(item.quantity), 0);

        const creditResult = await executeCreditPayment({
          supplier: validatedInput.supplier,
          stockLotId,
          totalAmount,
          contextId: validatedInput.contextId,
          userId: validatedInput.userId,
          accountsPayableRepository,
        });

        if (creditResult.isFailure) {
          return Result.fail(creditResult.getError());
        }

        const { accountsPayableId } = creditResult.getValue();

        const updateStockLotResult = await stockLotRepository.updateById(
          IdVO.create(stockLotId),
          { accountsPayableId: IdVO.create(accountsPayableId) },
          IdVO.create(validatedInput.userId),
        );
        if (updateStockLotResult.isFailure) {
          return Result.fail(updateStockLotResult.getError());
        }

        const { createdProducts, updatedProducts } = await applyStockLotProductUpdates(
          products,
          validatedInput.userId,
          productRepository,
        );

        return Result.ok<CreateStockLotOutput, DomainError>({
          stockLot: savedStockLot,
          accountsPayableId,
          createdProducts,
          updatedProducts,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error during stock lot creation';
      return Result.fail(createDatabaseError(message));
    }
  };
};
