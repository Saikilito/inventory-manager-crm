import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, createDatabaseError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IStockLot } from '../../../../../../shared-domain/src/stock-lot/stock-lot.entity.js';
import { IStockLotRepository } from '../repositories/stock-lot.repository.js';

export interface GetStockLotsInput {
  contextId?: string;
  supplierName?: string;
  status?: string;
}

export type GetStockLots = UseCase<GetStockLotsInput, IStockLot[], DomainError>;

export const makeGetStockLots = (deps: {
  stockLotRepository: IStockLotRepository;
}): GetStockLots => {
  const { stockLotRepository } = deps;

  return async (input: GetStockLotsInput) => {
    try {
      let stockLots: IStockLot[];

      if (input.status && input.contextId) {
        stockLots = await stockLotRepository.findByStatus(input.status, input.contextId);
      } else if (input.status) {
        stockLots = await stockLotRepository.findByStatus(input.status);
      } else if (input.supplierName && input.contextId) {
        stockLots = await stockLotRepository.findBySupplierName(input.supplierName, input.contextId);
      } else if (input.supplierName) {
        stockLots = await stockLotRepository.findBySupplierName(input.supplierName);
      } else {
        const result = await stockLotRepository.getAll({
          where: input.contextId ? {
            fields: [{ field: 'contextId', operator: '=', value: input.contextId }]
          } : undefined,
        });

        if (result.isFailure) {
          return Result.fail(result.getError());
        }

        stockLots = result.getValue().items;
      }

      return Result.ok<IStockLot[], DomainError>(stockLots);
    } catch (error) {
      return Result.fail(createDatabaseError(error instanceof Error ? error.message : 'Failed to get stock lots'));
    }
  };
};
