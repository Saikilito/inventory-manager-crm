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
import { NonEmptyStringVO } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { PositiveNumberVO } from "../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js";
import { IKnowledgeRepository } from "../../../knowledge/application/repositories/knowledge.repository.js";

export interface CalculateDeliveryFeeInput {
  lat: number;
  lng: number;
}

export type CalculateDeliveryFee = UseCase<
  CalculateDeliveryFeeInput,
  number,
  DomainError
>;

interface GpsJsonPayload {
  lat: number;
  lng: number;
}

const GPS_ORIGIN_TAG = "gps-origin";
const GPS_JSON_MARKER = "GPS_ORIGIN_JSON:";

const parseGpsFromContent = (content: string): GpsJsonPayload | null => {
  const markerIndex = content.indexOf(GPS_JSON_MARKER);
  if (markerIndex === -1) return null;

  const jsonSlice = content.slice(markerIndex + GPS_JSON_MARKER.length).trim();
  const jsonStart = jsonSlice.indexOf("{");
  const jsonEnd = jsonSlice.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return null;

  const jsonText = jsonSlice.slice(jsonStart, jsonEnd + 1);
  try {
    const parsed = JSON.parse(jsonText) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as { lat?: unknown }).lat === "number" &&
      typeof (parsed as { lng?: unknown }).lng === "number"
    ) {
      return parsed as GpsJsonPayload;
    }
    return null;
  } catch {
    return null;
  }
};

export const makeCalculateDeliveryFee = (
  knowledgeRepository: IKnowledgeRepository,
): CalculateDeliveryFee => {
  return async (input) => {
    const latResult = LatitudeVO.createResult(input.lat);
    if (latResult.isFailure) {
      return Result.fail(latResult.getError() as ValidationError);
    }

    const lngResult = LongitudeVO.createResult(input.lng);
    if (lngResult.isFailure) {
      return Result.fail(lngResult.getError() as ValidationError);
    }

    let originLat = DEFAULT_ORIGIN_LAT;
    let originLng = DEFAULT_ORIGIN_LNG;

    try {
      const result = await knowledgeRepository.getAll({
        where: {
          fields: [
            {
              field: NonEmptyStringVO.create("metadata.tags"),
              value: GPS_ORIGIN_TAG,
              operator: "=",
            },
          ],
        },
        limit: PositiveNumberVO.create(1),
      });

      if (!result.isFailure) {
        const entry = result.getValue().items[0];
        if (entry) {
          const gps = parseGpsFromContent(entry.content.toString());
          if (gps) {
            originLat = gps.lat;
            originLng = gps.lng;
          }
        }
      }
    } catch (err) {
      console.warn(
        "[calculate-delivery-fee] knowledge lookup failed; using default origin",
        err instanceof Error ? err.message : String(err),
      );
    }

    const fee = calculateDeliveryFee(input.lat, input.lng, originLat, originLng);

    return Result.ok<number, DomainError>(fee);
  };
};

export default makeCalculateDeliveryFee;
