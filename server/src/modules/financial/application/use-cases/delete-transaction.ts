import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { Id, IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { ITransaction, TransactionType } from '../../../../../../shared-domain/src/financial/transaction.entity.js';
import { IFinancialDay, FinancialDayStatus } from '../../../../../../shared-domain/src/financial/financial-day.entity.js';
import { IAccount, makeAccount } from '../../../../../../shared-domain/src/financial/account.entity.js';
import { IAccountRepository, ITransactionRepository, IFinancialDayRepository } from '../repositories/financial.repository.js';
import { IDeliveryRepository } from '../../../delivery/application/repositories/delivery.repository.js';
import { DeliveryField } from '../../../delivery/application/repositories/delivery.constants.js';

export interface DeleteTransactionInput {
  id: string;
}

export type DeleteTransaction = UseCase<DeleteTransactionInput, boolean, DomainError>;

export const makeDeleteTransaction = (
  transactionRepository: ITransactionRepository,
  accountRepository: IAccountRepository,
  financialDayRepository: IFinancialDayRepository,
  deliveryRepository: IDeliveryRepository,
): DeleteTransaction => {
  return async (input: DeleteTransactionInput) => {
    const txId = IdVO.create(input.id);
    const txResult = await transactionRepository.getById(txId);
    if (txResult.isFailure) {
      return Result.fail(txResult.getError());
    }

    const transaction = txResult.getValue() as ITransaction | null;
    if (!transaction) {
      return Result.fail(new NotFoundError('Transaction not found'));
    }

    const dayId = IdVO.create(transaction.financialDayId.toString());
    const dayResult = await financialDayRepository.getById(dayId);
    if (dayResult.isFailure) {
      return Result.fail(dayResult.getError());
    }

    const financialDay = dayResult.getValue() as IFinancialDay | null;
    if (!financialDay) {
      return Result.fail(new NotFoundError('Financial day not found'));
    }

    if (financialDay.status !== FinancialDayStatus.OPEN) {
      return Result.fail(new ValidationError('Day is closed'));
    }

    const accId = IdVO.create(transaction.accountId.toString());
    const accountResult = await accountRepository.getById(accId);
    if (accountResult.isFailure) {
      return Result.fail(accountResult.getError());
    }

    const account = accountResult.getValue() as IAccount | null;
    if (!account) {
      return Result.fail(new NotFoundError('Account not found'));
    }

    let newBalance = account.balance;
    if (transaction.type === TransactionType.CREDIT) {
      newBalance -= transaction.amount;
    } else {
      newBalance += transaction.amount;
    }

    const updatedAccount = makeAccount({
      id: account.id!.toString(),
      name: account.name.toString(),
      currency: account.currency.toString(),
      balance: newBalance,
      createdAt: account.createdAt.toString(),
    });

    const updateAccResult = await accountRepository.updateById(account.id!, updatedAccount, IdVO.generateNil());
    if (updateAccResult.isFailure) {
      return Result.fail(updateAccResult.getError());
    }

    if (transaction.referenceId) {
      const refIdStr = transaction.referenceId.toString();
      const deliveryIdsToDelete: Id[] = [];

      const deliveriesResult = await deliveryRepository.getAll({
        where: {
          fields: [
            { field: NonEmptyStringVO.create(DeliveryField.OrderId), value: refIdStr, operator: '=' }
          ]
        }
      });
      if (!deliveriesResult.isFailure) {
        const items = deliveriesResult.getValue().items;
        for (const item of items) {
          if (item.id) {
            deliveryIdsToDelete.push(IdVO.create(item.id.toString()));
          }
        }
      }

      try {
        const deliveryResult = await deliveryRepository.getById(IdVO.create(refIdStr));
        if (!deliveryResult.isFailure && deliveryResult.getValue()) {
          const delivery = deliveryResult.getValue()!;
          if (delivery.id) {
            const dId = IdVO.create(delivery.id.toString());
            if (!deliveryIdsToDelete.some(id => id.toString() === dId.toString())) {
              deliveryIdsToDelete.push(dId);
            }
          }
        }
      } catch (err) {
        // Safe to ignore if referenceId is not a valid ObjectId / uuid for deliveryId
      }

      if (deliveryIdsToDelete.length > 0) {
        const deleteDeliveriesResult = await deliveryRepository.deleteByIds(deliveryIdsToDelete, IdVO.generateNil());
        if (deleteDeliveriesResult.isFailure) {
          return Result.fail(deleteDeliveriesResult.getError());
        }
      }
    }

    const deleteTxResult = await transactionRepository.deleteByIds([txId], IdVO.generateNil());
    if (deleteTxResult.isFailure) {
      return Result.fail(deleteTxResult.getError());
    }

    return Result.ok<boolean, DomainError>(true);
  };
};
