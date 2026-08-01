import { describe, it, expect } from "vitest";
import { DEFAULT_ORIGIN_LAT, DEFAULT_ORIGIN_LNG } from "@shared-domain/delivery/delivery-calculator";
import { CARACAS_ZONES, CUSTOM_ZONE_NAME, resolveZoneCoordinates } from "../delivery-zones";

describe("resolveZoneCoordinates", () => {
  it("returns the custom coordinates when the custom zone is selected", () => {
    const customZoneIndex = CARACAS_ZONES.findIndex((zone) => zone.name === CUSTOM_ZONE_NAME);
    const result = resolveZoneCoordinates(customZoneIndex, 1.23, 4.56);
    expect(result).toEqual({ lat: 1.23, lng: 4.56 });
  });

  it("returns the zone's fixed coordinates when a predefined zone is selected", () => {
    const zoneIndex = CARACAS_ZONES.findIndex((zone) => zone.name === "Petare");
    const result = resolveZoneCoordinates(zoneIndex, 0, 0);
    expect(result).toEqual({ lat: 10.479, lng: -66.795 });
  });

  it("falls back to the first zone when given an out-of-range index", () => {
    const result = resolveZoneCoordinates(999, 1.23, 4.56);
    expect(result).toEqual({ lat: 1.23, lng: 4.56 });
  });

  it("falls back to the first zone when given a negative index", () => {
    const result = resolveZoneCoordinates(-1, 1.23, 4.56);
    expect(result).toEqual({ lat: 1.23, lng: 4.56 });
  });

  it("defaults the custom zone to DEFAULT_ORIGIN coordinates", () => {
    const customZone = CARACAS_ZONES.find((zone) => zone.name === CUSTOM_ZONE_NAME);
    expect(customZone).toEqual({ name: CUSTOM_ZONE_NAME, lat: DEFAULT_ORIGIN_LAT, lng: DEFAULT_ORIGIN_LNG });
  });
});
