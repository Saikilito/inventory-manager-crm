import mongoose from 'mongoose';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import {
  createDatabaseError,
  createValidationError,
  createNotFoundError,
} from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { DateOnlyVO } from '../../../../../../shared-domain/src/shared/value-objects/date-only.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { IProduct, makeProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import {
  IStockLot,
  makeStockLot,
  makeStockLotItem,
} from '../../../../../../shared-domain/src/stock-lot/stock-lot.entity.js';
import {
  IAccountsPayable,
  makeAccountsPayable,
} from '../../../../../../shared-domain/src/financial/accounts-payable.entity.js';
import {
  makeTransactionResult,
  ITransaction,
} from '../../../../../../shared-domain/src/financial/transaction.entity.js';
import { IProductRepository } from '../repositories/product.repository.js';
import { IStockLotRepository } from '../repositories/stock-lot.repository.js';
import {
  IAccountRepository,
  ITransactionRepository,
  IFinancialDayRepository,
} from '../../../financial/application/repositories/financial.repository.js';
import { IAccountsPayableRepository } from '../../../financial/application/repositories/accounts-payable.repository.js';
import { makeFindOrOpenFinancialDay } from '../../../financial/application/services/find-or-open-financial-day.js';
import { AccountModel } from '../../../financial/infrastructure/financial.model.js';
import { applyStockLotProductUpdates } from './atomic-stock-update.js';
import { z } from 'zod';

const StockLotItemInputSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, 'Product name is required'),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  unitCost: z.number().positive('Unit cost must be positive'),
  confirmedSellingPrice: z.number().positive('Selling price must be positive'),
});

const CreateStockLotInputSchema = z.object({
  supplier: z.string().min(1, 'Supplier is required'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  items: z.array(StockLotItemInputSchema).min(1, 'At least one item is required'),
  paymentMethod: z.enum(['CASH', 'CREDIT']),
  accountId: z.string().optional(),
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

interface ProductProcessingResult {
  productId?: string;
  productName: string;
  quantity: number;
  unitCost: number;
  confirmedSellingPrice: number;
  isNewProduct: boolean;
  entity?: IProduct;
}

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

  const processItems = async (
    items: z.infer<typeof StockLotItemInputSchema>[],
    userId: string,
    contextId?: string,
  ): Promise<Result<ProductProcessingResult[], DomainError>> => {
    const results: ProductProcessingResult[] = [];

    for (const item of items) {
      let existingProduct: IProduct | undefined;

      if (item.productId) {
        const productResult = await productRepository.getById(IdVO.create(item.productId));
        if (!productResult.isFailure && productResult.getValue()) {
          existingProduct = productResult.getValue()!;
        }
      }

      if (!existingProduct) {
        const allProductsResult = await productRepository.getAll({
          where: {
            fields: contextId
              ? [
                  {
                    field: NonEmptyStringVO.create('contextId'),
                    operator: '=' as const,
                    value: contextId,
                  },
                ]
              : [],
          },
        });

        if (allProductsResult.isFailure) {
          return Result.fail(allProductsResult.getError());
        }

        const allProducts = allProductsResult.getValue().items;
        const normalizedName = item.productName.trim().toLowerCase();
        existingProduct = allProducts.find((p: IProduct) => p.name.toString().trim().toLowerCase() === normalizedName);
      }

      if (existingProduct) {
        results.push({
          productId: existingProduct.id!.toString(),
          productName: item.productName,
          quantity: item.quantity,
          unitCost: item.unitCost,
          confirmedSellingPrice: item.confirmedSellingPrice,
          isNewProduct: false,
          entity: existingProduct,
        });
      } else {
        // Create new product
        const newProduct = makeProduct({
          name: item.productName,
          purchasePrice: item.unitCost,
          sellingPrice: item.confirmedSellingPrice,
          stock: 0, // IMPORTANT: Set stock to 0 initially. Will be incremented later inside the transaction.
          contextId,
        });

        results.push({
          productId: new mongoose.Types.ObjectId().toHexString(), // Pre-generate ID for the transaction
          productName: item.productName,
          quantity: item.quantity,
          unitCost: item.unitCost,
          confirmedSellingPrice: item.confirmedSellingPrice,
          isNewProduct: true,
          entity: newProduct,
        });
      }
    }

    return Result.ok(results);
  };

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

    const productsResult = await processItems(validatedInput.items, validatedInput.userId, validatedInput.contextId);
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
        const accountResult = await accountRepository.getById(IdVO.create(validatedInput.accountId!));
        if (accountResult.isFailure || !accountResult.getValue()) {
          return Result.fail(createNotFoundError('Account not found'));
        }

        const account = accountResult.getValue()!;
        const dateStr = DateOnlyVO.create(validatedInput.purchaseDate);

        const dayResult = await findOrOpenFinancialDay(dateStr.toString());
        if (dayResult.isFailure) {
          return Result.fail(dayResult.getError());
        }

        const financialDay = dayResult.getValue();

        const generatedStockLotId = new mongoose.Types.ObjectId().toHexString();
        const generatedTransactionId = new mongoose.Types.ObjectId().toHexString();

        const stockLot = makeStockLot({
          id: generatedStockLotId,
          supplier: validatedInput.supplier,
          purchaseDate: validatedInput.purchaseDate,
          items: stockLotItems,
          paymentMethod: 'CASH',
          transactionId: generatedTransactionId,
          notes: validatedInput.notes,
          contextId: validatedInput.contextId,
        });

        const transactionResult = makeTransactionResult({
          id: generatedTransactionId,
          accountId: validatedInput.accountId!,
          type: 'DEBIT',
          amount: Number(stockLot.totalCost.toString()),
          currency: account.currency.toString(),
          description: `[Compra Stock] ${validatedInput.supplier}`,
          date: dateStr.toString(),
          financialDayId: financialDay.id!.toString(),
          source: 'STOCK_PURCHASE',
          sourceReferenceId: generatedStockLotId,
        });

        if (transactionResult.isFailure) {
          return Result.fail(transactionResult.getError());
        }

        const transaction = transactionResult.getValue();

        const saveTxResult = await transactionRepository.create(transaction, IdVO.create(validatedInput.userId));
        if (saveTxResult.isFailure) {
          return Result.fail(saveTxResult.getError());
        }

        const balanceUpdateResult = await AccountModel.updateOne(
          { _id: new mongoose.Types.ObjectId(validatedInput.accountId!) },
          { $inc: { balance: -Number(stockLot.totalCost) } },
        ).exec();

        if (balanceUpdateResult.modifiedCount === 0) {
          return Result.fail(createDatabaseError('Failed to update account balance'));
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

        const accountsPayable = makeAccountsPayable({
          supplier: validatedInput.supplier,
          stockLotId,
          totalAmount,
          contextId: validatedInput.contextId,
        });

        const savePayableResult = await accountsPayableRepository.create(
          accountsPayable,
          IdVO.create(validatedInput.userId),
        );
        if (savePayableResult.isFailure) {
          return Result.fail(savePayableResult.getError());
        }

        const savedPayable = savePayableResult.getValue() as IAccountsPayable;

        const accountsPayableId = savedPayable.id!.toString();

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
