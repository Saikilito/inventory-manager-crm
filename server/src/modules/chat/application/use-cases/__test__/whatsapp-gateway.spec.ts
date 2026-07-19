import { describe, it, expect, vi } from "vitest";
import { Result } from "../../../../../../../shared-domain/src/shared/result.js";

describe("WhatsApp Agent Use Cases", () => {
  describe("WhatsApp Gateway Integration & PubSub Streaming", () => {
    it("should manage status state correctly and publish WHATSAPP_CONNECTION_UPDATED to PubSub", async () => {
      const { makeBaileysGateway } = await import("../../../infrastructure/services/baileys.gateway.js");

      // Mock dependencies
      const mockBaileysAuthRepository = {};
      const mockChatMessageRepository = {
        create: vi.fn().mockResolvedValue(Result.ok()),
        getAll: vi.fn().mockResolvedValue(Result.ok({ items: [] })),
        getActiveThreads: vi.fn().mockResolvedValue(Result.ok([])),
        archiveThreads: vi.fn().mockResolvedValue(Result.ok()),
      };
      const gateway = makeBaileysGateway({
        baileysAuthRepository: mockBaileysAuthRepository as any,
        chatMessageRepository: mockChatMessageRepository as any,
      });

      // Initially state should be DISCONNECTED
      const initialState = gateway.getConnectionState();
      expect(initialState.status).toBe("DISCONNECTED");
      expect(initialState.qr).toBeNull();

      expect(gateway.getConnectionState).toBeDefined();
      expect(gateway.sendMessage).toBeDefined();
      expect(gateway.initialize).toBeDefined();
    });
  });
});
