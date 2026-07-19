import { describe, it, expect, vi } from "vitest";
import { Result } from "../../../../../../../shared-domain/src/shared/result.js";
import { IdVO } from "../../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { NonEmptyStringVO } from "../../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { makeAssignAgentToSession } from "../assign-agent-to-session.use-case.js";

describe("WhatsApp Agent Use Cases", () => {
  describe("Defensive Agent Assignment Securing (SALES role only)", () => {
    it("should allow assigning an agent with role SALES", async () => {
      const mockChatSessionRepository = {
        getOne: vi.fn().mockResolvedValue(
          Result.ok({
            id: IdVO.create("550e8400-e29b-41d4-a716-446655440003"),
            whatsappId: NonEmptyStringVO.create("+584121234567"),
            status: "BOT",
            driftCount: 0,
          })
        ),
        updateById: vi.fn().mockResolvedValue(Result.ok()),
        getById: vi.fn().mockResolvedValue(
          Result.ok({
            id: IdVO.create("550e8400-e29b-41d4-a716-446655440003"),
            whatsappId: NonEmptyStringVO.create("+584121234567"),
            status: "BOT",
            driftCount: 0,
            assignedAgentId: IdVO.create("550e8400-e29b-41d4-a716-446655440009"),
          })
        ),
      };

      const mockAgentRepository = {
        getById: vi.fn().mockResolvedValue(
          Result.ok({
            id: IdVO.create("550e8400-e29b-41d4-a716-446655440009"),
            name: NonEmptyStringVO.create("Sales Agent"),
            role: "SALES",
          })
        ),
      };

      const mockPubSub = {
        publish: vi.fn().mockResolvedValue(undefined),
      };

      const assignAgentToSession = makeAssignAgentToSession({
        chatSessionRepository: mockChatSessionRepository as any,
        agentRepository: mockAgentRepository as any,
        pubSub: mockPubSub,
      });

      const res = await assignAgentToSession({
        whatsappId: "+584121234567",
        agentId: "550e8400-e29b-41d4-a716-446655440009",
      });

      expect(res.isFailure).toBe(false);
      expect(mockChatSessionRepository.updateById).toHaveBeenCalled();
    });

    it("should fail to assign an agent with role SUPPORT", async () => {
      const mockChatSessionRepository = {
        getOne: vi.fn().mockResolvedValue(
          Result.ok({
            id: IdVO.create("550e8400-e29b-41d4-a716-446655440003"),
            whatsappId: NonEmptyStringVO.create("+584121234567"),
            status: "BOT",
            driftCount: 0,
          })
        ),
        updateById: vi.fn(),
      };

      const mockAgentRepository = {
        getById: vi.fn().mockResolvedValue(
          Result.ok({
            id: IdVO.create("550e8400-e29b-41d4-a716-446655440008"),
            name: NonEmptyStringVO.create("Support Agent"),
            role: "SUPPORT",
          })
        ),
      };

      const mockPubSub = {
        publish: vi.fn(),
      };

      const assignAgentToSession = makeAssignAgentToSession({
        chatSessionRepository: mockChatSessionRepository as any,
        agentRepository: mockAgentRepository as any,
        pubSub: mockPubSub,
      });

      const res = await assignAgentToSession({
        whatsappId: "+584121234567",
        agentId: "550e8400-e29b-41d4-a716-446655440008",
      });

      expect(res.isFailure).toBe(true);
      expect(res.getError().message).toContain("Only agents with role SALES can be assigned to live chat sessions");
      expect(mockChatSessionRepository.updateById).not.toHaveBeenCalled();
    });
  });
});
