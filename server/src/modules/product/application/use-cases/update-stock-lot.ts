import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, createNotFoundError, createValidationError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { IStockLotRepository } from '../repositories/stock-lot.repository.js';
import { IStockLot, makeStockLotItem, PRICE_DECIMAL_PRECISION } from '../../../../../../shared-domain/src/stock-lot/stock-lot.entity.js';
import { CreateStockLotInput } from './create-stock-lot.js';

export interface UpdateStockLotInput extends CreateStockLotInput {
  id: string;
}

export type UpdateStockLot = UseCase<UpdateStockLotInput, IStockLot, DomainError>;

export const makeUpdateStockLot = (stockLotRepository: IStockLotRepository): UpdateStockLot => {
  return async (input: UpdateStockLotInput) => {
    const lotResult = await stockLotRepository.getById(IdVO.create(input.id));
    if (lotResult.isFailure || !lotResult.getValue()) {
      return Result.fail(createNotFoundError('Stock lot not found'));
    }

    const existingLot = lotResult.getValue()!;
    if (existingLot.status !== 'DRAFT') {
      return Result.fail(createValidationError('Only DRAFT stock lots can be edited'));
    }

    const stockLotItems = input.items.map((item) =>
      makeStockLotItem({
        productId: undefined,
        productName: item.productName,
        quantity: item.quantity,
        unitCost: item.unitCost,
        confirmedSellingPrice: item.confirmedSellingPrice,
        isNewProduct: false,
      }),
    );

    const totalCostNum = stockLotItems.reduce((sum, item) => sum + (Number(item.unitCost) * Number(item.quantity)), 0);
    const projectedProfitNum = stockLotItems.reduce((sum, item) => sum + (Number(item.projectedProfit) || 0), 0);

    const updateResult = await stockLotRepository.updateById(
      IdVO.create(input.id),
      {
        supplier: NonEmptyStringVO.create(input.supplier.trim()),
        purchaseDate: input.purchaseDate,
        paymentMethod: input.paymentMethod,
        accountId: input.accountId ? IdVO.create(input.accountId) : undefined,
        notes: input.notes?.trim() ? NonEmptyStringVO.create(input.notes.trim()) : undefined,
        contextId: input.contextId ? IdVO.create(input.contextId) : undefined,
        items: stockLotItems,
        totalCost: PositiveNumberVO.create(Number(totalCostNum.toFixed(PRICE_DECIMAL_PRECISION))),
        projectedProfit: projectedProfitNum > 0 ? PositiveNumberVO.create(Number(projectedProfitNum.toFixed(PRICE_DECIMAL_PRECISION))) : undefined,
      },
      IdVO.create(input.userId)
    );

    if (updateResult.isFailure) {
      return Result.fail(updateResult.getError());
    }

    const updatedLotResult = await stockLotRepository.getById(IdVO.create(input.id));
    return Result.ok(updatedLotResult.getValue()!);
  };
};
