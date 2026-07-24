import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { createDomainError, DomainError } from "../../../../../../shared-domain/src/shared/errors.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { DateTimeVO } from "../../../../../../shared-domain/src/shared/value-objects/date-time.vo.js";
import { WhatsAppConstants } from "../../infrastructure/services/whatsapp-constants.js";

export type CheckWorkingHours = UseCase<
  Date | string | number | undefined,
  boolean,
  DomainError
>;

export const makeCheckWorkingHours = (): CheckWorkingHours => {
  return async (input) => {
    const dateResult = DateTimeVO.createResult(input);
    if (dateResult.isFailure) {
      return Result.fail(dateResult.getError() as DomainError);
    }

    const dateTime = dateResult.getValue();

    const regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):/;
    const match = dateTime.match(regex);
    if (!match) {
      return Result.fail(createDomainError("Failed to parse formatted datetime"));
    }

    const hour = parseInt(match[4], 10);
    const minute = parseInt(match[5], 10);

    const localMinutes = hour * 60 + minute;
    const startMinutes = WhatsAppConstants.BUSINESS_HOURS_START_MINUTES;
    const endMinutes = WhatsAppConstants.BUSINESS_HOURS_END_MINUTES;

    const isWithinHours =
      localMinutes >= startMinutes && localMinutes <= endMinutes;

    return Result.ok<boolean, DomainError>(isWithinHours);
  };
};

export default makeCheckWorkingHours;
