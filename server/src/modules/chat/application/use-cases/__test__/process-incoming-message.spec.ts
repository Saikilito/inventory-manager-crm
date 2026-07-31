import { describe, it, expect, vi } from "vitest";
import { Result } from "../../../../../../../shared-domain/src/shared/result.js";
import { IdVO } from "../../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { NonEmptyStringVO } from "../../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { makeProcessIncomingMessage } from "../process-incoming-message.use-case.js";
import {
  createMockChatMessageRepository,
  createMockChatSessionRepository,
} from "./chat-test-helpers.js";

describe("WhatsApp Agent Use Cases", () => {
  describe("WA-2: Message Processor State Machine & Drift Handover", () => {
    it("should trigger human support handover on 3 consecutive drift messages", async () => {
      const mockChatSessionRepository = createMockChatSessionRepository({
        getOrCreate: vi.fn().mockResolvedValue(
          Result.ok({
            id: IdVO.create("550e8400-e29b-41d4-a716-446655440003"),
            whatsappId: NonEmptyStringVO.create("+584121234567"),
            status: "BOT",
            driftCount: 2,
          })
        ),
      });

      const mockChatMessageRepository = createMockChatMessageRepository();
      mockChatMessageRepository.create = vi.fn().mockResolvedValue(
        Result.ok({
          id: IdVO.create("550e8400-e29b-41d4-a716-446655440004"),
          whatsappId: NonEmptyStringVO.create("+584121234567"),
          text: NonEmptyStringVO.create("Off-topic chat"),
          sender: "CUSTOMER",
          createdAt: new Date(),
        })
      );

      const mockClientRepository = {
        getOne: vi.fn().mockResolvedValue(Result.ok(null)),
      };

      const mockWhatsAppGateway = {
        sendMessage: vi.fn().mockResolvedValue(Result.ok()),
      };

      const mockLlmAdapter = {
        generateResponse: vi.fn().mockResolvedValue(
          Result.ok({
            reply: "Off-topic message",
            isDrift: true,
          })
        ),
      };

      const mockCheckWorkingHours = vi.fn().mockResolvedValue(Result.ok(true));
      const mockHandoverToHuman = vi.fn().mockResolvedValue(Result.ok());

      const processIncomingMessage = makeProcessIncomingMessage({
        chatSessionRepository: mockChatSessionRepository as any,
        chatMessageRepository: mockChatMessageRepository as any,
        clientRepository: mockClientRepository as any,
        whatsAppGateway: mockWhatsAppGateway as any,
        llmAdapter: mockLlmAdapter as any,
        checkWorkingHours: mockCheckWorkingHours as any,
        handoverToHuman: mockHandoverToHuman as any,
      });

      const res = await processIncomingMessage({
        from: "+584121234567",
        text: "Off-topic chat",
      });

      expect(res.isFailure).toBe(false);
      expect(mockHandoverToHuman).toHaveBeenCalledWith("+584121234567");
    });

    it("should terminate immediately and not trigger Gemini LLM if chat status is not BOT (e.g., HUMAN)", async () => {
      const mockChatSessionRepository = createMockChatSessionRepository({
        getOrCreate: vi.fn().mockResolvedValue(
          Result.ok({
            id: IdVO.create("550e8400-e29b-41d4-a716-446655440003"),
            whatsappId: NonEmptyStringVO.create("+584121234567"),
            status: "HUMAN",
            driftCount: 0,
          })
        ),
      });

      const mockChatMessageRepository = createMockChatMessageRepository();
      mockChatMessageRepository.create = vi.fn().mockResolvedValue(
        Result.ok({
          id: IdVO.create("550e8400-e29b-41d4-a716-446655440004"),
          whatsappId: NonEmptyStringVO.create("+584121234567"),
          text: NonEmptyStringVO.create("Direct question for human support"),
          sender: "CUSTOMER",
          createdAt: new Date(),
        })
      );

      const mockClientRepository = {
        getOne: vi.fn().mockResolvedValue(Result.ok(null)),
      };

      const mockWhatsAppGateway = {
        sendMessage: vi.fn().mockResolvedValue(Result.ok()),
      };

      const mockLlmAdapter = {
        generateResponse: vi.fn(),
      };

      const mockCheckWorkingHours = vi.fn().mockResolvedValue(Result.ok(true));
      const mockHandoverToHuman = vi.fn().mockResolvedValue(Result.ok());

      const processIncomingMessage = makeProcessIncomingMessage({
        chatSessionRepository: mockChatSessionRepository as any,
        chatMessageRepository: mockChatMessageRepository as any,
        clientRepository: mockClientRepository as any,
        whatsAppGateway: mockWhatsAppGateway as any,
        llmAdapter: mockLlmAdapter as any,
        checkWorkingHours: mockCheckWorkingHours as any,
        handoverToHuman: mockHandoverToHuman as any,
      });

      const res = await processIncomingMessage({
        from: "+584121234567",
        text: "Direct question for human support",
      });

      expect(res.isFailure).toBe(false);
      expect(mockLlmAdapter.generateResponse).not.toHaveBeenCalled();
      expect(mockWhatsAppGateway.sendMessage).not.toHaveBeenCalled();
    });

    it("should pass isOutOfHours: true to llmAdapter when outside of working hours", async () => {
      const mockChatSessionRepository = createMockChatSessionRepository({
        getOrCreate: vi.fn().mockResolvedValue(
          Result.ok({
            id: IdVO.create("550e8400-e29b-41d4-a716-446655440003"),
            whatsappId: NonEmptyStringVO.create("+584121234567"),
            status: "BOT",
            driftCount: 0,
          })
        ),
      });

      const mockChatMessageRepository = createMockChatMessageRepository();

      const mockClientRepository = {
        getOne: vi.fn().mockResolvedValue(Result.ok(null)),
      };

      const mockWhatsAppGateway = {
        sendMessage: vi.fn().mockResolvedValue(Result.ok()),
      };

      const mockLlmAdapter = {
        generateResponse: vi.fn().mockResolvedValue(
          Result.ok({
            reply: "Cordial off-hours reply",
            isDrift: false,
          })
        ),
      };

      const mockCheckWorkingHours = vi.fn().mockResolvedValue(Result.ok(false));
      const mockHandoverToHuman = vi.fn().mockResolvedValue(Result.ok());

      const processIncomingMessage = makeProcessIncomingMessage({
        chatSessionRepository: mockChatSessionRepository as any,
        chatMessageRepository: mockChatMessageRepository as any,
        clientRepository: mockClientRepository as any,
        whatsAppGateway: mockWhatsAppGateway as any,
        llmAdapter: mockLlmAdapter as any,
        checkWorkingHours: mockCheckWorkingHours as any,
        handoverToHuman: mockHandoverToHuman as any,
      });

      const res = await processIncomingMessage({
        from: "+584121234567",
        text: "Are you open?",
      });

      expect(res.isFailure).toBe(false);
      expect(mockLlmAdapter.generateResponse).toHaveBeenCalledWith(
        "+584121234567",
        "Are you open?",
        expect.any(Array),
        { isOutOfHours: true }
      );
    });

    it("should persist the incoming message but skip the LLM call when the whatsapp rate limiter blocks the sender", async () => {
      const mockChatSessionRepository = createMockChatSessionRepository();
      const mockChatMessageRepository = createMockChatMessageRepository();
      const mockClientRepository = { getOne: vi.fn().mockResolvedValue(Result.ok(null)) };
      const mockWhatsAppGateway = { sendMessage: vi.fn().mockResolvedValue(Result.ok()) };
      const mockLlmAdapter = { generateResponse: vi.fn() };
      const mockCheckWorkingHours = vi.fn().mockResolvedValue(Result.ok(true));
      const mockHandoverToHuman = vi.fn().mockResolvedValue(Result.ok());
      const mockWhatsappRateLimiter = { checkAndRecord: vi.fn().mockReturnValue(false) };

      const processIncomingMessage = makeProcessIncomingMessage({
        chatSessionRepository: mockChatSessionRepository as any,
        chatMessageRepository: mockChatMessageRepository as any,
        clientRepository: mockClientRepository as any,
        whatsAppGateway: mockWhatsAppGateway as any,
        llmAdapter: mockLlmAdapter as any,
        checkWorkingHours: mockCheckWorkingHours as any,
        handoverToHuman: mockHandoverToHuman as any,
        whatsappRateLimiter: mockWhatsappRateLimiter as any,
      });

      const res = await processIncomingMessage({
        from: "+584121234567",
        text: "spam spam spam",
      });

      expect(res.isFailure).toBe(false);
      expect(mockWhatsappRateLimiter.checkAndRecord).toHaveBeenCalledWith("+584121234567");
      expect(mockChatMessageRepository.create).toHaveBeenCalled();
      expect(mockLlmAdapter.generateResponse).not.toHaveBeenCalled();
      expect(mockWhatsAppGateway.sendMessage).not.toHaveBeenCalled();
    });

    it("should trigger human handover and send notice when incoming message is audio", async () => {
      const mockChatSessionRepository = createMockChatSessionRepository({
        getOrCreate: vi.fn().mockResolvedValue(
          Result.ok({
            id: IdVO.create("550e8400-e29b-41d4-a716-446655440003"),
            whatsappId: NonEmptyStringVO.create("+584121234567"),
            status: "BOT",
            driftCount: 0,
          })
        ),
      });

      const mockChatMessageRepository = createMockChatMessageRepository();
      mockChatMessageRepository.create = vi.fn().mockResolvedValue(
        Result.ok({
          id: IdVO.create("550e8400-e29b-41d4-a716-446655440004"),
          whatsappId: NonEmptyStringVO.create("+584121234567"),
          text: NonEmptyStringVO.create("🎵 [Audio recibido]"),
          sender: "CUSTOMER",
          createdAt: new Date(),
        })
      );

      const mockClientRepository = { getOne: vi.fn().mockResolvedValue(Result.ok(null)) };
      const mockWhatsAppGateway = { sendMessage: vi.fn().mockResolvedValue(Result.ok()) };
      const mockLlmAdapter = { generateResponse: vi.fn() };
      const mockCheckWorkingHours = vi.fn().mockResolvedValue(Result.ok(true));
      const mockHandoverToHuman = vi.fn().mockResolvedValue(Result.ok());

      const processIncomingMessage = makeProcessIncomingMessage({
        chatSessionRepository: mockChatSessionRepository as any,
        chatMessageRepository: mockChatMessageRepository as any,
        clientRepository: mockClientRepository as any,
        whatsAppGateway: mockWhatsAppGateway as any,
        llmAdapter: mockLlmAdapter as any,
        checkWorkingHours: mockCheckWorkingHours as any,
        handoverToHuman: mockHandoverToHuman as any,
      });

      const res = await processIncomingMessage({
        from: "+584121234567",
        text: "🎵 [Audio recibido]",
        mediaType: "audio",
      });

      expect(res.isFailure).toBe(false);
      expect(res.getValue().status).toBe("PENDING_HUMAN");
      expect(mockHandoverToHuman).toHaveBeenCalledWith("+584121234567");
      expect(mockLlmAdapter.generateResponse).not.toHaveBeenCalled();
      expect(mockWhatsAppGateway.sendMessage).toHaveBeenCalledWith(
        "+584121234567",
        expect.stringContaining("notas de voz"),
        expect.any(Object)
      );
    });

    it("should trigger human handover and send notice when incoming message is an image", async () => {
      const mockChatSessionRepository = createMockChatSessionRepository({
        getOrCreate: vi.fn().mockResolvedValue(
          Result.ok({
            id: IdVO.create("550e8400-e29b-41d4-a716-446655440003"),
            whatsappId: NonEmptyStringVO.create("+584121234567"),
            status: "BOT",
            driftCount: 0,
          })
        ),
      });

      const mockChatMessageRepository = createMockChatMessageRepository();
      mockChatMessageRepository.create = vi.fn().mockResolvedValue(
        Result.ok({
          id: IdVO.create("550e8400-e29b-41d4-a716-446655440004"),
          whatsappId: NonEmptyStringVO.create("+584121234567"),
          text: NonEmptyStringVO.create("📷 [Imagen recibida]"),
          sender: "CUSTOMER",
          createdAt: new Date(),
        })
      );

      const mockClientRepository = { getOne: vi.fn().mockResolvedValue(Result.ok(null)) };
      const mockWhatsAppGateway = { sendMessage: vi.fn().mockResolvedValue(Result.ok()) };
      const mockLlmAdapter = { generateResponse: vi.fn() };
      const mockCheckWorkingHours = vi.fn().mockResolvedValue(Result.ok(true));
      const mockHandoverToHuman = vi.fn().mockResolvedValue(Result.ok());

      const processIncomingMessage = makeProcessIncomingMessage({
        chatSessionRepository: mockChatSessionRepository as any,
        chatMessageRepository: mockChatMessageRepository as any,
        clientRepository: mockClientRepository as any,
        whatsAppGateway: mockWhatsAppGateway as any,
        llmAdapter: mockLlmAdapter as any,
        checkWorkingHours: mockCheckWorkingHours as any,
        handoverToHuman: mockHandoverToHuman as any,
      });

      const res = await processIncomingMessage({
        from: "+584121234567",
        text: "📷 [Imagen recibida]",
        mediaType: "image",
      });

      expect(res.isFailure).toBe(false);
      expect(res.getValue().status).toBe("PENDING_HUMAN");
      expect(mockHandoverToHuman).toHaveBeenCalledWith("+584121234567");
      expect(mockLlmAdapter.generateResponse).not.toHaveBeenCalled();
      expect(mockWhatsAppGateway.sendMessage).toHaveBeenCalledWith(
        "+584121234567",
        expect.stringContaining("imágenes"),
        expect.any(Object)
      );
    });
  });
});
