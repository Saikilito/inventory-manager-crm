import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { DomainError } from "../../../../../../shared-domain/src/shared/errors.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { ValidationError } from "../../../../../../shared-domain/src/shared/validation-error.js";
import {
  calculateDeliveryFee,
  DEFAULT_ORIGIN_LAT,
  DEFAULT_ORIGIN_LNG,
} from "../../../../../../shared-domain/src/delivery/delivery-calculator.js";
import { LatitudeVO } from "../../../../../../shared-domain/src/shared/value-objects/latitude.vo.js";
import { LongitudeVO } from "../../../../../../shared-domain/src/shared/value-objects/longitude.vo.js";

export interface CalculateDeliveryFeeInput {
  lat: number;
  lng: number;
}

export type CalculateDeliveryFee = UseCase<
  CalculateDeliveryFeeInput,
  number,
  DomainError
>;

export const makeCalculateDeliveryFee = (): CalculateDeliveryFee => {
  return async (input: CalculateDeliveryFeeInput) => {
    const latResult = LatitudeVO.createResult(input.lat);
    if (latResult.isFailure) {
      return Result.fail(latResult.getError() as ValidationError);
    }

    const lngResult = LongitudeVO.createResult(input.lng);
    if (lngResult.isFailure) {
      return Result.fail(lngResult.getError() as ValidationError);
    }

    let originLat = parseFloat(process.env.WHATSAPP_ORIGIN_LATITUDE || "");
    if (isNaN(originLat)) originLat = DEFAULT_ORIGIN_LAT;
    let originLng = parseFloat(process.env.WHATSAPP_ORIGIN_LONGITUDE || "");
    if (isNaN(originLng)) originLng = DEFAULT_ORIGIN_LNG;

    const fee = calculateDeliveryFee(input.lat, input.lng, originLat, originLng);

    return Result.ok<number, DomainError>(fee);
  };
};

export default makeCalculateDeliveryFee;
