import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError, NotFoundError } from '../../../../../../shared-domain/src/shared/errors.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { NonEmptyStringVO } from '../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { PositiveNumberVO } from '../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import { WhereField } from '../../../../../../shared-domain/src/shared/repository.js';
import { IClient, calculateClientRatingTier, makeClient } from '../../../../../../shared-domain/src/client/client.entity.js';
import { OrderStatus, PaymentStatus, DeliveryStatus } from '../../../../../../shared-domain/src/order/order.entity.js';
import { IClientRepository } from '../repositories/client.repository.js';
import { IOrderRepository } from '../../../order/application/repositories/order.repository.js';

export type RecalculateClientRating = UseCase<string, void, DomainError>;

export const makeRecalculateClientRating = (
  clientRepository: IClientRepository,
  orderRepository: IOrderRepository,
): RecalculateClientRating => {
  return async (clientId: string) => {
    const composerResult = await ResultComposer.start()
      .useResult('client', () => clientRepository.getById(IdVO.create(clientId)))
      .useResult('validateClient', ({ client }) => {
        const cli = client as IClient | null;
        if (!cli) {
          return Result.fail(new NotFoundError('Client not found'));
        }
        return Result.ok(cli);
      })
      .useResult('ordersResult', () => {
        const fields: WhereField[] = [
          {
            field: NonEmptyStringVO.create('clientId'),
            value: clientId,
            operator: '=',
          },
          {
            field: NonEmptyStringVO.create('status'),
            value: OrderStatus.ACTIVE,
            operator: '=',
          },
          {
            field: NonEmptyStringVO.create('paymentStatus'),
            value: PaymentStatus.PAID,
            operator: '=',
          },
          {
            field: NonEmptyStringVO.create('deliveryStatus'),
            value: DeliveryStatus.COMPLETE,
            operator: '=',
          },
        ];

        return orderRepository.getAll({
          limit: PositiveNumberVO.create(1000),
          where: { fields },
        });
      })
      .useResult('updateClientRating', async ({ validateClient, ordersResult }) => {
        const client = validateClient as IClient;
        const completedOrdersCount = ordersResult.items.length;
        const targetTier = calculateClientRatingTier(completedOrdersCount);

        if (client.type !== targetTier) {
          const updatedClient = makeClient({
            id: client.id,
            firstName: client.firstName,
            lastName: client.lastName,
            address: client.address,
            whatsapp: client.whatsapp,
            nationalId: client.nationalId,
            type: targetTier,
            orders: client.orders as unknown as string[],
            sellerId: client.sellerId,
          });

          const updateResult = await clientRepository.updateById(IdVO.create(clientId), updatedClient, IdVO.generateNil());
          if (updateResult.isFailure) {
            return Result.fail(updateResult.getError());
          }
        }
        return Result.ok<void, DomainError>();
      })
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    return Result.ok<void, DomainError>();
  };
};
