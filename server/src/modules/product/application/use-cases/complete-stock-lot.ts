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
  makeStockLotItem,
  completeStockLot,
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
import { atomicIncrementStock } from './atomic-stock-update.js';
import { z } from 'zod';

const CompleteStockLotInputSchema = z.object({
  stockLotId: z.string().min(1, 'Stock Lot ID is required'),
  accountId: z.string().optional(), // Needed if we are confirming a CASH payment now
  userId: z.string().min(1, 'User ID is required'),
});

export type CompleteStockLotInput = z.infer<typeof CompleteStockLotInputSchema>;

export interface CompleteStockLotOutput {
  stockLot: IStockLot;
  accountsPayableId?: string;
  createdProducts: IProduct[];
  updatedProducts: IProduct[];
}

export type CompleteStockLot = UseCase<CompleteStockLotInput, CompleteStockLotOutput, DomainError>;

interface ProductProcessingResult {
  productId?: string;
  productName: string;
  quantity: number;
  unitCost: number;
  confirmedSellingPrice: number;
  isNewProduct: boolean;
  entity?: IProduct;
}

export const makeCompleteStockLot = (deps: {
  productRepository: IProductRepository;
  stockLotRepository: IStockLotRepository;
  accountRepository: IAccountRepository;
  transactionRepository: ITransactionRepository;
  financialDayRepository: IFinancialDayRepository;
  accountsPayableRepository: IAccountsPayableRepository;
}): CompleteStockLot => {
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
    items: IStockLot['items'],
    contextId?: string,
    userId?: string,
  ): Promise<Result<ProductProcessingResult[], DomainError>> => {
    const results: ProductProcessingResult[] = [];

    for (const item of items) {
      let existingProduct: IProduct | undefined;

      if (item.productId) {
        const productResult = await productRepository.getById(IdVO.create(item.productId.toString()));
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
        const normalizedName = item.productName.toString().trim().toLowerCase();
        existingProduct = allProducts.find((p: IProduct) => p.name.toString().trim().toLowerCase() === normalizedName);
      }

      if (existingProduct) {
        const updateResult = await atomicIncrementStock(
          existingProduct.id!.toString(),
          Number(item.quantity),
          Number(item.unitCost),
          productRepository,
        );

        if (updateResult.isFailure) {
          return Result.fail(updateResult.getError());
        }

        results.push({
          productId: existingProduct.id!.toString(),
          productName: item.productName.toString(),
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
          confirmedSellingPrice: Number(item.confirmedSellingPrice),
          isNewProduct: false,
          entity: updateResult.getValue(),
        });
      } else {
        const newProduct = makeProduct({
          name: item.productName.toString(),
          purchasePrice: Number(item.unitCost),
          sellingPrice: Number(item.confirmedSellingPrice),
          stock: Number(item.quantity),
          contextId,
        });

        const createResult = await productRepository.create(newProduct, IdVO.create(userId!));
        if (createResult.isFailure) {
          return Result.fail(createResult.getError());
        }

        const created = createResult.getValue() as IProduct;

        results.push({
          productId: created.id!.toString(),
          productName: item.productName.toString(),
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
          confirmedSellingPrice: Number(item.confirmedSellingPrice),
          isNewProduct: true,
          entity: created,
        });
      }
    }

    return Result.ok(results);
  };

  return async (input: CompleteStockLotInput) => {
    const validationResult = CompleteStockLotInputSchema.safeParse(input);
    if (!validationResult.success) {
      return Result.fail(createValidationError(`Validation failed: ${validationResult.error.message}`));
    }

    const { stockLotId, accountId, userId } = validationResult.data;

    const lotResult = await stockLotRepository.getById(IdVO.create(stockLotId));
    if (lotResult.isFailure || !lotResult.getValue()) {
      return Result.fail(createNotFoundError('Stock lot not found'));
    }
    const draftStockLot = lotResult.getValue()!;

    if (draftStockLot.status !== 'DRAFT') {
      return Result.fail(createValidationError('Only DRAFT stock lots can be completed'));
    }

    if (draftStockLot.paymentMethod === 'CASH' && !accountId) {
      return Result.fail(createValidationError('Account ID is required to complete a CASH payment stock lot'));
    }

    try {
      if (draftStockLot.paymentMethod === 'CASH') {
        const accountResult = await accountRepository.getById(IdVO.create(accountId!));
        if (accountResult.isFailure || !accountResult.getValue()) {
          throw new Error('Account not found');
        }

        const account = accountResult.getValue()!;
        const dateStr = DateOnlyVO.create(draftStockLot.purchaseDate);

        const dayResult = await findOrOpenFinancialDay(dateStr.toString());
        if (dayResult.isFailure) {
          throw new Error(dayResult.getError().message);
        }

        const financialDay = dayResult.getValue();

        const transactionResult = makeTransactionResult({
          accountId: accountId!,
          type: 'DEBIT',
          amount: Number(draftStockLot.totalCost),
          currency: account.currency.toString(),
          description: `[Compra Stock] ${draftStockLot.supplier.toString()}`,
          date: dateStr.toString(),
          financialDayId: financialDay.id!.toString(),
          source: 'STOCK_PURCHASE',
          sourceReferenceId: draftStockLot.id!.toString(),
        });

        if (transactionResult.isFailure) {
          throw new Error(transactionResult.getError().message);
        }

        const transaction = transactionResult.getValue();

        const saveTxResult = await transactionRepository.create(transaction, IdVO.create(userId));
        if (saveTxResult.isFailure) {
          throw new Error(saveTxResult.getError().message);
        }

        const savedTx = saveTxResult.getValue() as ITransaction;
        const transactionId = savedTx.id?.toString();

        const balanceUpdateResult = await AccountModel.updateOne(
          { _id: new mongoose.Types.ObjectId(accountId!) },
          { $inc: { balance: -Number(draftStockLot.totalCost) } },
        ).exec();

        if (balanceUpdateResult.modifiedCount === 0) {
          throw new Error('Failed to update account balance');
        }

        const contextIdStr = draftStockLot.contextId ? draftStockLot.contextId.toString() : undefined;
        const productsResult = await processItems(draftStockLot.items, contextIdStr, userId);
        if (productsResult.isFailure) {
          throw new Error(productsResult.getError().message);
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

        const completedLot = completeStockLot(draftStockLot, {
          items: stockLotItems,
          transactionId: transactionId ? IdVO.create(transactionId) : undefined,
        });

        const updateResult = await stockLotRepository.updateById(
          IdVO.create(stockLotId),
          completedLot,
          IdVO.create(userId),
        );

        if (updateResult.isFailure) {
          throw new Error(updateResult.getError().message);
        }

        const updatedLot = await stockLotRepository.getById(IdVO.create(stockLotId));

        return Result.ok<CompleteStockLotOutput, DomainError>({
          stockLot: updatedLot.getValue()!,
          createdProducts: products.filter((p) => p.isNewProduct && p.entity).map((p) => p.entity!),
          updatedProducts: products.filter((p) => !p.isNewProduct && p.entity).map((p) => p.entity!),
        });
      } else {
        const contextIdStr = draftStockLot.contextId ? draftStockLot.contextId.toString() : undefined;
        const productsResult = await processItems(draftStockLot.items, contextIdStr, userId);
        if (productsResult.isFailure) {
          throw new Error(productsResult.getError().message);
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

        const totalAmount = stockLotItems.reduce((sum, item) => sum + Number(item.unitCost) * Number(item.quantity), 0);

        const accountsPayable = makeAccountsPayable({
          supplier: draftStockLot.supplier.toString(),
          stockLotId,
          totalAmount,
          contextId: contextIdStr,
        });

        const savePayableResult = await accountsPayableRepository.create(accountsPayable, IdVO.create(userId));

        if (savePayableResult.isFailure) {
          throw new Error(savePayableResult.getError().message);
        }

        const savedPayable = savePayableResult.getValue() as IAccountsPayable;

        const accountsPayableId = savedPayable.id!.toString();

        const completedLot = completeStockLot(draftStockLot, {
          items: stockLotItems,
          accountsPayableId: IdVO.create(accountsPayableId),
        });

        const updateResult = await stockLotRepository.updateById(
          IdVO.create(stockLotId),
          completedLot,
          IdVO.create(userId),
        );

        if (updateResult.isFailure) {
          throw new Error(updateResult.getError().message);
        }

        const updatedLot = await stockLotRepository.getById(IdVO.create(stockLotId));

        return Result.ok<CompleteStockLotOutput, DomainError>({
          stockLot: updatedLot.getValue()!,
          accountsPayableId,
          createdProducts: products.filter((p) => p.isNewProduct && p.entity).map((p) => p.entity!),
          updatedProducts: products.filter((p) => !p.isNewProduct && p.entity).map((p) => p.entity!),
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error during complete stock lot';
      return Result.fail(createDatabaseError(message));
    }
  };
};
