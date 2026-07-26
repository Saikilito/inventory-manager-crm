import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, createDatabaseError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { IAccountsPayable } from '../../../../../../shared-domain/src/financial/accounts-payable.entity.js';
import { IAccountsPayableRepository } from '../repositories/accounts-payable.repository.js';

export interface GetAccountsPayablesInput {
  contextId?: string;
  supplierName?: string;
  status?: string;
}

export type GetAccountsPayables = UseCase<GetAccountsPayablesInput, IAccountsPayable[], DomainError>;

export const makeGetAccountsPayables = (deps: {
  accountsPayableRepository: IAccountsPayableRepository;
}): GetAccountsPayables => {
  const { accountsPayableRepository } = deps;

  return async (input: GetAccountsPayablesInput) => {
    try {
      let payables: IAccountsPayable[];

      if (input.status && input.contextId) {
        payables = await accountsPayableRepository.findByStatus(input.status, input.contextId);
      } else if (input.status) {
        payables = await accountsPayableRepository.findByStatus(input.status);
      } else if (input.supplierName && input.contextId) {
        payables = await accountsPayableRepository.findBySupplier(input.supplierName, input.contextId);
      } else if (input.supplierName) {
        payables = await accountsPayableRepository.findBySupplier(input.supplierName);
      } else {
        const result = await accountsPayableRepository.getAll({
          where: input.contextId ? {
            fields: [{ field: 'contextId', operator: '=', value: input.contextId }]
          } : undefined,
        });

        if (result.isFailure) {
          return Result.fail(result.getError());
        }

        payables = result.getValue().items;
      }

      return Result.ok<IAccountsPayable[], DomainError>(payables);
    } catch (error) {
      return Result.fail(createDatabaseError(error instanceof Error ? error.message : 'Failed to get accounts payables'));
    }
  };
};
