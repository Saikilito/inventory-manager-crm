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
import { IProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import {
  IStockLot,
  makeStockLotItem,
  canBeCompleted,
  completeStockLot,
} from '../../../../../../shared-domain/src/stock-lot/stock-lot.entity.js';
import { IProductRepository } from '../repositories/product.repository.js';
import { IStockLotRepository } from '../repositories/stock-lot.repository.js';
import {
  IAccountRepository,
  ITransactionRepository,
  IFinancialDayRepository,
} from '../../../financial/application/repositories/financial.repository.js';
import { IAccountsPayableRepository } from '../../../financial/application/repositories/accounts-payable.repository.js';
import { makeFindOrOpenFinancialDay } from '../../../financial/application/services/find-or-open-financial-day.js';
import { processStockLotItems, applyStockLotProductUpdates } from './atomic-stock-update.js';
import { executeCashPayment, executeCreditPayment } from './stock-lot-payment-helper.js';
import { z } from 'zod';

const CompleteStockLotInputSchema = z.object({
  stockLotId: z.string().min(1, 'Stock Lot ID is required'),
  accountId: z.string().optional(),
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

    if (!canBeCompleted(draftStockLot)) {
      return Result.fail(createValidationError('Only DRAFT stock lots can be completed'));
    }

    let targetAccountId = accountId;
    if (draftStockLot.paymentMethod === 'CASH' && !targetAccountId) {
      targetAccountId = draftStockLot.accountId?.toString();
    }

    if (draftStockLot.paymentMethod === 'CASH' && !targetAccountId) {
      return Result.fail(createValidationError('Account ID is required to complete a CASH payment stock lot'));
    }

    try {
      const contextIdStr = draftStockLot.contextId ? draftStockLot.contextId.toString() : undefined;
      const productsResult = await processStockLotItems(draftStockLot.items, productRepository, contextIdStr);
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

      if (draftStockLot.paymentMethod === 'CASH') {
        const dateStr = DateOnlyVO.create(draftStockLot.purchaseDate);
        const dayResult = await findOrOpenFinancialDay(dateStr.toString());
        if (dayResult.isFailure) {
          throw new Error(dayResult.getError().message);
        }

        const financialDay = dayResult.getValue();

        const cashResult = await executeCashPayment({
          supplier: draftStockLot.supplier.toString(),
          purchaseDate: draftStockLot.purchaseDate.toString(),
          totalCost: Number(draftStockLot.totalCost),
          accountId: targetAccountId!,
          userId,
          stockLotId: draftStockLot.id!.toString(),
          financialDayId: financialDay.id!.toString(),
          accountRepository,
          transactionRepository,
        });

        if (cashResult.isFailure) {
          return Result.fail(cashResult.getError());
        }

        const transactionId = cashResult.getValue().transactionId;

        const { createdProducts, updatedProducts } = await applyStockLotProductUpdates(
          products,
          userId,
          productRepository,
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
          createdProducts,
          updatedProducts,
        });
      } else {
        const totalAmount = stockLotItems.reduce((sum, item) => sum + Number(item.unitCost) * Number(item.quantity), 0);

        const creditResult = await executeCreditPayment({
          supplier: draftStockLot.supplier.toString(),
          stockLotId,
          totalAmount,
          contextId: contextIdStr,
          userId,
          accountsPayableRepository,
        });

        if (creditResult.isFailure) {
          return Result.fail(creditResult.getError());
        }

        const { accountsPayableId } = creditResult.getValue();

        const { createdProducts, updatedProducts } = await applyStockLotProductUpdates(
          products,
          userId,
          productRepository,
        );

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
          createdProducts,
          updatedProducts,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error during complete stock lot';
      return Result.fail(createDatabaseError(message));
    }
  };
};
