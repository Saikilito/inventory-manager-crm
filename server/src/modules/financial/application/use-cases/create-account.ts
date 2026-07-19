import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IAccount, makeAccount } from '../../../../../../shared-domain/src/financial/account.entity.js';
import { IAccountRepository } from '../repositories/financial.repository.js';

export interface CreateAccountInput {
  name: string;
  currency: string;
  balance?: number;
}

export type CreateAccount = UseCase<CreateAccountInput, IAccount, DomainError>;

export const makeCreateAccount = (accountRepository: IAccountRepository): CreateAccount => {
  return async (input: CreateAccountInput) => {
    const composerResult = await ResultComposer.start()
      .useResult('account', () => {
        return Result.ok(makeAccount({
          name: input.name,
          currency: input.currency,
          balance: input.balance || 0,
        }));
      })
      .useResult('save', ({ account }) => accountRepository.create(account, IdVO.generateNil()))
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const { save: savedAccount } = composerResult.getValue() as { save: IAccount };
    return Result.ok<IAccount, DomainError>(savedAccount);
  };
};
