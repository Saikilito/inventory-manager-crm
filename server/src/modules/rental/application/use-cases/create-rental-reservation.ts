import { UseCase } from '../../../../../../shared-domain/src/shared/use-case.js';
import { DomainError } from '../../../../../../shared-domain/src/shared/errors.js';
import { ValidationError } from '../../../../../../shared-domain/src/shared/validation-error.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import { ResultComposer } from '../../../../../../shared-domain/src/shared/result-composer.js';
import { getErrorMessage } from '../../../../../../shared-domain/src/shared/error-utils.js';
import { IRentalReservation, makeRentalReservation, RentalStatus } from '../../../../../../shared-domain/src/rental/rental.entity.js';
import { IRentalRepository } from '../repositories/rental.repository.js';
import { IProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import { IProductRepository } from '../../../product/application/repositories/product.repository.js';
import { RentalCalculator } from '../../../../../../shared-domain/src/rental/rental-calculator.js';
import { Id, IdVO } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { DateTime, DateTimeVO } from '../../../../../../shared-domain/src/shared/value-objects/date-time.vo.js';
import { buildOverlapWhere } from '../services/build-overlap-where.js';

export interface CreateRentalReservationInput {
  productId: string;
  orderId: string;
  startDateTime: string;
  durationHours: number;
  quantity: number;
}

export type CreateRentalReservation = UseCase<CreateRentalReservationInput, IRentalReservation, DomainError>;

class KeyMutex {
  private locks = new Map<string, Promise<void>>();

  async acquire(key: string): Promise<() => void> {
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }
    
    let resolveLock!: () => void;
    const promise = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    this.locks.set(key, promise);

    return () => {
      this.locks.delete(key);
      resolveLock();
    };
  }
}

const mutex = new KeyMutex();

export const makeCreateRentalReservation = (
  rentalRepository: IRentalRepository,
  productRepository: IProductRepository
): CreateRentalReservation => {
  return async (input: CreateRentalReservationInput) => {
    let startDT: DateTime;
    let endDT: DateTime;
    let prodId: Id;
    let ordId: Id;

    try {
      prodId = IdVO.create(input.productId);
      ordId = IdVO.create(input.orderId);
      startDT = DateTimeVO.create(input.startDateTime);
      endDT = RentalCalculator.calculateRentalDueDate(startDT, input.durationHours);
    } catch (err: unknown) {
      return Result.fail(new ValidationError(getErrorMessage(err)));
    }

    const release = await mutex.acquire(prodId.toString());

    try {
      let rentalEntity: IRentalReservation;

      const composerResult = await ResultComposer.start()
        .useResult('product', () => productRepository.getById(prodId))
        .useResult('overlapping', async () => {
          const overlapResult = await rentalRepository.getAll({
            where: { fields: buildOverlapWhere(prodId, startDT, endDT) }
          });
          if (overlapResult.isFailure) {
            return Result.fail(overlapResult.getError());
          }
          return Result.ok(overlapResult.getValue().items);
        })
        .useResult('stockCheck', ({ product, overlapping }: { product: IProduct | null; overlapping: IRentalReservation[] }) => {
          if (!product) {
            return Result.fail(new ValidationError(`Product with ID ${input.productId} not found`));
          }

          const bookedQuantity = overlapping.reduce((sum: number, rental: IRentalReservation) => sum + rental.quantity, 0);
          const availableStock = product.stock - bookedQuantity;

          if (availableStock < input.quantity) {
            return Result.fail(
              new ValidationError(
                `Insufficient stock for rental reservation of product "${product.name.toString()}". ` +
                `Requested: ${input.quantity}, Available: ${availableStock} (Total: ${product.stock}, Booked: ${bookedQuantity})`
              )
            );
          }

          return Result.ok(void 0);
        })
        .useResult('rentalEntity', () => {
          const makeResult = makeRentalReservation({
            productId: input.productId,
            orderId: input.orderId,
            startDateTime: startDT,
            endDateTime: endDT,
            quantity: input.quantity,
            status: RentalStatus.RESERVED,
          });
          if (makeResult.isFailure) {
            return Result.fail(makeResult.getError());
          }
          rentalEntity = makeResult.getValue();
          return Result.ok(rentalEntity);
        })
        .useResult('savedRental', () => {
          return rentalRepository.create(rentalEntity, IdVO.generateNil());
        })
        .run();

      if (composerResult.isFailure) {
        return Result.fail(composerResult.getError());
      }

      return Result.ok(composerResult.getValue().savedRental);
    } finally {
      release();
    }
  };
};
