import { z } from "zod";
import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { DomainError } from "../../../../../../shared-domain/src/shared/errors.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { createValidationError } from "../../../../../../shared-domain/src/shared/validation-error.js";
import { IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { DateTimeVO } from "../../../../../../shared-domain/src/shared/value-objects/date-time.vo.js";
import {
  IUnsatisfiedDemandRepository,
  makeUnsatisfiedDemand,
} from "../repositories/unsatisfied-demand.repository.js";
import {
  zodIdString,
  zodNonEmptyString,
  zodPositiveNumber,
} from "../../../../../../shared-domain/src/shared/zod-schemas.js";

const logUnsatisfiedDemandInputSchema = z.object({
  productId: zodIdString,
  clientPhone: zodNonEmptyString,
  productName: zodNonEmptyString,
  quantity: zodPositiveNumber,
});

export type LogUnsatisfiedDemandInput = z.infer<
  typeof logUnsatisfiedDemandInputSchema
>;

export type LogUnsatisfiedDemand = UseCase<
  LogUnsatisfiedDemandInput,
  void,
  DomainError
>;

export const makeLogUnsatisfiedDemand = (
  unsatisfiedDemandRepository: IUnsatisfiedDemandRepository
): LogUnsatisfiedDemand => {
  return async (input: LogUnsatisfiedDemandInput) => {
    const parseResult = logUnsatisfiedDemandInputSchema.safeParse(input);
    if (!parseResult.success) {
      return Result.fail(
        createValidationError(
          `Invalid unsatisfied demand input: ${parseResult.error.message}`
        )
      );
    }

    const { productId, clientPhone, productName, quantity } = parseResult.data;

    const requestedAtResult = DateTimeVO.createResult();
    if (requestedAtResult.isFailure) {
      return Result.fail(requestedAtResult.getError() as DomainError);
    }

    try {
      const demand = makeUnsatisfiedDemand({
        productId,
        clientPhone,
        productName,
        quantity,
        requestedAt: requestedAtResult.getValue(),
      });

      const systemActorId = IdVO.generateNil();

      const createResult = await unsatisfiedDemandRepository.create(
        demand,
        systemActorId
      );
      if (createResult.isFailure) {
        return Result.fail(createResult.getError());
      }

      return Result.ok<void, DomainError>();
    } catch (error: unknown) {
      return Result.fail(
        createValidationError(
          error instanceof Error ? error.message : String(error)
        )
      );
    }
  };
};

export default makeLogUnsatisfiedDemand;
