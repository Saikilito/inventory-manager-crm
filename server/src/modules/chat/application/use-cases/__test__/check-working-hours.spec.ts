import { describe, it, expect, vi } from "vitest";
import { makeCheckWorkingHours } from "../check-working-hours.use-case.js";
import { makeCalculateDeliveryFee } from "../calculate-delivery-fee.use-case.js";
import type { IKnowledgeRepository } from "../../../knowledge/application/repositories/knowledge.repository.js";
import { Result } from "../../../../../../../shared-domain/src/shared/result.js";

const buildMockKnowledgeRepo = (
  entries: Array<{ id: string; content: string }> = [],
): IKnowledgeRepository => {
  return {
    getAll: vi.fn(async () =>
      Result.ok({
        items: entries,
        total: entries.length,
        page: 1,
        limit: entries.length,
        pages: 1,
      }),
    ),
  } as unknown as IKnowledgeRepository;
};

describe("WhatsApp Agent Use Cases", () => {
  describe("WA-4: Working Hours Gateway (Caracas VET)", () => {
    it("should allow processing during active hours (Monday-Sunday 10:00 AM - 6:00 PM)", async () => {
      const checkWorkingHours = makeCheckWorkingHours();

      // Caracas time: 11:30 AM (UTC-4)
      // Formatted as UTC date that matches 11:30 AM in local VET.
      // E.g., "2026-07-07T11:30:00" string represents 11:30 AM
      const res = await checkWorkingHours("2026-07-07T11:30:00");
      expect(res.isFailure).toBe(false);
      expect(res.getValue()).toBe(true);
    });

    it("should reject processing outside of working hours (e.g., 8:30 PM VET)", async () => {
      const checkWorkingHours = makeCheckWorkingHours();

      // Caracas time: 8:30 PM (20:30)
      const res = await checkWorkingHours("2026-07-07T20:30:00");
      expect(res.isFailure).toBe(false);
      expect(res.getValue()).toBe(false);
    });
  });

  describe("WA-3: Geolocation Cost Validation (Haversine Formula)", () => {
    it("should compute base delivery fee of $2.00 for distance up to 3.0 km", async () => {
      const calculateDeliveryFee = makeCalculateDeliveryFee(buildMockKnowledgeRepo());

      // Coordinates ~1.0 km away
      // Origin: (10.4806, -66.9036)
      const res = await calculateDeliveryFee({ lat: 10.485, lng: -66.9036 });
      expect(res.isFailure).toBe(false);
      expect(res.getValue()).toBe(2.0);
    });

    it("should compute surcharge of $4.00 for distance exactly 6.0 km away", async () => {
      const calculateDeliveryFee = makeCalculateDeliveryFee(buildMockKnowledgeRepo());

      // Origin: (10.4806, -66.9036)
      // Let's use exact lat difference for 6.0km: 6.0 / 6371 * 180 / Math.PI = ~0.053959
      const destLat = 10.4806 + 0.053959;
      const res = await calculateDeliveryFee({ lat: destLat, lng: -66.9036 });

      expect(res.isFailure).toBe(false);
      expect(res.getValue()).toBe(4.0); // Base $2.00 + $2.00 surcharge
    });
  });
});
