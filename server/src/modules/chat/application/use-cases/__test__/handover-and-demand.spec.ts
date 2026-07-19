import { describe, it, expect, vi } from "vitest";
import { Result } from "../../../../../../../shared-domain/src/shared/result.js";
import { IdVO } from "../../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { NonEmptyStringVO } from "../../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { makeHandoverToHuman } from "../handover-to-human.use-case.js";
import { makeLogUnsatisfiedDemand } from "../log-unsatisfied-demand.use-case.js";

describe("WhatsApp Agent Use Cases", () => {
  describe("WA-8: Handover to Human & Support Group Alerts", () => {
    it("should transition chat state to PENDING_HUMAN and dispatch support alert", async () => {
      const mockChatSessionRepository = {
        getOne: vi.fn().mockResolvedValue(
          Result.ok({
            id: IdVO.create("550e8400-e29b-41d4-a716-446655440003"),
            whatsappId: NonEmptyStringVO.create("+584121234567"),
            status: "BOT",
            driftCount: 2,
          })
        ),
        updateById: vi.fn().mockResolvedValue(Result.ok()),
      };

      const mockWhatsAppGateway = {
        sendMessage: vi.fn().mockResolvedValue(Result.ok()),
      };

      const mockPubSub = {
        publish: vi.fn().mockResolvedValue(undefined),
      };

      const handoverToHuman = makeHandoverToHuman({
        chatSessionRepository: mockChatSessionRepository as any,
        whatsAppGateway: mockWhatsAppGateway as any,
        pubSub: mockPubSub,
      });

      const res = await handoverToHuman("+584121234567");
      expect(res.isFailure).toBe(false);

      // Verify DB update
      expect(mockChatSessionRepository.updateById).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440003",
        {
          status: "PENDING_HUMAN",
          assignedUserId: null,
          driftCount: 0,
        },
        "00000000-0000-0000-0000-000000000000"
      );

      // Verify WhatsApp support alert group was notified
      expect(mockWhatsAppGateway.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining("@g.us"),
        expect.stringContaining("HUMAN ESCALATION")
      );

      // Verify PubSub event published
      expect(mockPubSub.publish).toHaveBeenCalledWith(
        "CHAT_SESSION_UPDATED",
        expect.any(Object)
      );
    });
  });

  describe("WA-6: Out-of-Stock Demand Logging", () => {
    it("should log unsatisfied demand for out-of-stock product successfully", async () => {
      const mockUnsatisfiedDemandRepository = {
        create: vi.fn().mockResolvedValue(Result.ok()),
      };

      const logUnsatisfiedDemand = makeLogUnsatisfiedDemand(
        mockUnsatisfiedDemandRepository as any
      );

      const res = await logUnsatisfiedDemand({
        productId: "550e8400-e29b-41d4-a716-446655440005",
        clientPhone: "+584121234567",
        productName: "Bateria Bosch 12v",
        quantity: 2,
      });

      expect(res.isFailure).toBe(false);
      expect(mockUnsatisfiedDemandRepository.create).toHaveBeenCalled();
    });
  });
});
