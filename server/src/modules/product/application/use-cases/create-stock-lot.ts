import mongoose from 'mongoose';
import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { DateOnlyVO } from '../../../../../../shared-domain/src/shared/value-objects/date-only.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { IProduct, makeProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import { IStockLot, makeStockLot, makeStockLotItem } from '../../../../../../shared-domain/src/stock-lot/stock-lot.entity.js';
import { IAccountsPayable, makeAccountsPayable } from '../../../../../../shared-domain/src/financial/accounts-payable.entity.js';
import { makeTransaction, ITransaction } from '../../../../../../shared-domain/src/financial/transaction.entity.js';
import { IProductRepository } from '../repositories/product.repository.js';
import { IStockLotRepository } from '../repositories/stock-lot.repository.js';
import { IAccountRepository, ITransactionRepository, IFinancialDayRepository } from '../../../financial/application/repositories/financial.repository.js';
import { IAccountsPayableRepository } from '../../../financial/application/repositories/accounts-payable.repository.js';
import { makeFindOrOpenFinancialDay } from '../../../financial/application/services/find-or-open-financial-day.js';
import { AccountModel } from '../../../financial/infrastructure/financial.model.js';
import { atomicIncrementStock } from './atomic-stock-update.js';
import { z } from 'zod';

const StockLotItemInputSchema = z.object({
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

  const findOrOpenFinancialDay = makeFindOrOpenFinancialDay(
    financialDayRepository,
    accountRepository,
  );

  /**
   * Processes all items, creating new products or updating existing ones
   */
  const processItems = async (
    items: z.infer<typeof StockLotItemInputSchema>[],
    contextId?: string,
  ): Promise<Result<ProductProcessingResult[], DomainError>> => {
    const results: ProductProcessingResult[] = [];

    for (const item of items) {
      const allProductsResult = await productRepository.getAll({
        where: {
          fields: contextId
            ? [
                { 
                  field: NonEmptyStringVO.create('contextId'), 
                  operator: '=' as const, 
                  value: contextId 
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
      const existingProduct = allProducts.find(
        (p: IProduct) => p.name.toString().trim().toLowerCase() === normalizedName,
      );

      if (existingProduct) {
        // Update existing product with atomic increment
        const updateResult = await atomicIncrementStock(
          existingProduct.id!.toString(),
          item.quantity,
          item.unitCost,
          productRepository,
        );

        if (updateResult.isFailure) {
          return Result.fail(updateResult.getError());
        }

        results.push({
          productId: existingProduct.id!.toString(),
          productName: item.productName,
          quantity: item.quantity,
          unitCost: item.unitCost,
          confirmedSellingPrice: item.confirmedSellingPrice,
          isNewProduct: false,
          entity: updateResult.getValue(),
        });
      } else {
        // Create new product
        const newProduct = makeProduct({
          name: item.productName,
          purchasePrice: item.unitCost,
          sellingPrice: item.confirmedSellingPrice,
          stock: item.quantity,
          contextId,
        });

        const createResult = await productRepository.create(newProduct, IdVO.generateNil());
        if (createResult.isFailure) {
          return Result.fail(createResult.getError());
        }

        const created = Array.isArray(createResult.getValue())
          ? (createResult.getValue() as IProduct[])[0]
          : createResult.getValue() as IProduct;

        results.push({
          productId: created.id!.toString(),
          productName: item.productName,
          quantity: item.quantity,
          unitCost: item.unitCost,
          confirmedSellingPrice: item.confirmedSellingPrice,
          isNewProduct: true,
          entity: created,
        });
      }
    }

    return Result.ok(results);
  };

  return async (input: CreateStockLotInput) => {
    const validationResult = CreateStockLotInputSchema.safeParse(input);
    if (!validationResult.success) {
      return Result.fail(new DomainError(`Validation failed: ${validationResult.error.message}`));
    }

    const validatedInput = validationResult.data;

    if (validatedInput.paymentMethod === 'CASH' && !validatedInput.accountId) {
      return Result.fail(new DomainError('Account ID is required for CASH payment'));
    }

    // Process items first (outside transaction - products can be created/updated independently)
    const productsResult = await processItems(validatedInput.items, validatedInput.contextId);
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

    // Start transaction for financial operations
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (validatedInput.paymentMethod === 'CASH') {
        // CASH payment flow
        const accountResult = await accountRepository.getById(IdVO.create(validatedInput.accountId!));
        if (accountResult.isFailure || !accountResult.getValue()) {
          await session.abortTransaction();
          return Result.fail(new DomainError('Account not found'));
        }

        const account = accountResult.getValue()!;
        const dateStr = DateOnlyVO.create(validatedInput.purchaseDate);
        
        const dayResult = await findOrOpenFinancialDay(dateStr.toString());
        if (dayResult.isFailure) {
          await session.abortTransaction();
          return Result.fail(dayResult.getError());
        }

        const financialDay = dayResult.getValue();

        // Create transaction
        const stockLot = makeStockLot({
          supplier: validatedInput.supplier,
          purchaseDate: validatedInput.purchaseDate,
          items: stockLotItems,
          paymentMethod: 'CASH',
          notes: validatedInput.notes,
          contextId: validatedInput.contextId,
        });

        const transaction = makeTransaction({
          accountId: validatedInput.accountId!,
          type: 'DEBIT',
          amount: Number(stockLot.totalCost),
          currency: account.currency.toString(),
          description: `[Compra Stock] ${validatedInput.supplier}`,
          date: dateStr.toString(),
          financialDayId: financialDay.id!.toString(),
        });

        const saveTxResult = await transactionRepository.create(transaction, IdVO.generateNil());
        if (saveTxResult.isFailure) {
          await session.abortTransaction();
          return Result.fail(saveTxResult.getError());
        }

        const savedTx = Array.isArray(saveTxResult.getValue()) 
          ? (saveTxResult.getValue() as ITransaction[])[0] 
          : saveTxResult.getValue() as ITransaction;
        const transactionId = savedTx.id?.toString();

        // Atomic balance update using $inc
        const balanceUpdateResult = await AccountModel.updateOne(
          { _id: new mongoose.Types.ObjectId(validatedInput.accountId!) },
          { $inc: { balance: -Number(stockLot.totalCost) } },
        ).session(session).exec();

        if (balanceUpdateResult.modifiedCount === 0) {
          await session.abortTransaction();
          return Result.fail(new DomainError('Failed to update account balance'));
        }

        // Create stock lot with transaction reference
        const stockLotWithTransaction = makeStockLot({
          supplier: validatedInput.supplier,
          purchaseDate: validatedInput.purchaseDate,
          items: stockLotItems,
          paymentMethod: 'CASH',
          transactionId,
          notes: validatedInput.notes,
          contextId: validatedInput.contextId,
        });

        const saveResult = await stockLotRepository.create(stockLotWithTransaction, IdVO.generateNil());
        if (saveResult.isFailure) {
          await session.abortTransaction();
          return Result.fail(saveResult.getError());
        }

        const saved = Array.isArray(saveResult.getValue()) 
          ? (saveResult.getValue() as IStockLot[])[0] 
          : saveResult.getValue() as IStockLot;

        await session.commitTransaction();

        const createdProducts = products.filter((p) => p.isNewProduct && p.entity).map((p) => p.entity!);
        const updatedProducts = products.filter((p) => !p.isNewProduct && p.entity).map((p) => p.entity!);

        return Result.ok<CreateStockLotOutput, DomainError>({
          stockLot: saved,
          createdProducts,
          updatedProducts,
        });
      } else {
        // CREDIT payment flow - create StockLot first, then AccountsPayable
        const stockLot = makeStockLot({
          supplier: validatedInput.supplier,
          purchaseDate: validatedInput.purchaseDate,
          items: stockLotItems,
          paymentMethod: 'CREDIT',
          notes: validatedInput.notes,
          contextId: validatedInput.contextId,
        });

        const saveStockLotResult = await stockLotRepository.create(stockLot, IdVO.generateNil());
        if (saveStockLotResult.isFailure) {
          await session.abortTransaction();
          return Result.fail(saveStockLotResult.getError());
        }

        const savedStockLot = Array.isArray(saveStockLotResult.getValue()) 
          ? (saveStockLotResult.getValue() as IStockLot[])[0] 
          : saveStockLotResult.getValue() as IStockLot;

        const stockLotId = savedStockLot.id!.toString();

        // Create AccountsPayable with stockLotId
        const totalAmount = stockLotItems.reduce(
          (sum, item) => sum + Number(item.unitCost) * Number(item.quantity), 
          0
        );

        const accountsPayable = makeAccountsPayable({
          supplier: validatedInput.supplier,
          stockLotId,
          totalAmount,
          contextId: validatedInput.contextId,
        });

        const savePayableResult = await accountsPayableRepository.create(
          accountsPayable, 
          IdVO.generateNil()
        );
        if (savePayableResult.isFailure) {
          await session.abortTransaction();
          return Result.fail(savePayableResult.getError());
        }

        const savedPayable = Array.isArray(savePayableResult.getValue())
          ? (savePayableResult.getValue() as IAccountsPayable[])[0]
          : savePayableResult.getValue() as IAccountsPayable;

        const accountsPayableId = savedPayable.id!.toString();

        // Update StockLot with accountsPayableId
        const updateStockLotResult = await stockLotRepository.updateById(
          IdVO.create(stockLotId),
          { accountsPayableId },
          IdVO.generateNil(),
        );
        if (updateStockLotResult.isFailure) {
          await session.abortTransaction();
          return Result.fail(updateStockLotResult.getError());
        }

        await session.commitTransaction();

        const createdProducts = products.filter((p) => p.isNewProduct && p.entity).map((p) => p.entity!);
        const updatedProducts = products.filter((p) => !p.isNewProduct && p.entity).map((p) => p.entity!);

        return Result.ok<CreateStockLotOutput, DomainError>({
          stockLot: savedStockLot,
          accountsPayableId,
          createdProducts,
          updatedProducts,
        });
      }
    } catch (error) {
      await session.abortTransaction();
      const message = error instanceof Error ? error.message : 'Unknown error during stock lot creation';
      return Result.fail(new DomainError(message));
    } finally {
      session.endSession();
    }
  };
};
