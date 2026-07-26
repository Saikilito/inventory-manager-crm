import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, createNotFoundError, createValidationError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IStockLotRepository } from '../repositories/stock-lot.repository.js';
import { IStockLot, makeStockLotItem } from '../../../../../../shared-domain/src/stock-lot/stock-lot.entity.js';
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

    const updateResult = await stockLotRepository.updateById(
      IdVO.create(input.id),
      {
        supplier: input.supplier.trim(),
        purchaseDate: input.purchaseDate,
        paymentMethod: input.paymentMethod,
        notes: input.notes?.trim(),
        contextId: input.contextId ? input.contextId : undefined,
        items: stockLotItems,
        totalCost: stockLotItems.reduce((sum, item) => sum + (Number(item.unitCost) * Number(item.quantity)), 0),
        projectedProfit: stockLotItems.reduce((sum, item) => sum + (Number(item.projectedProfit) || 0), 0),
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
