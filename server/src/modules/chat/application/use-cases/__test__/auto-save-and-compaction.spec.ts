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
  describe("sdd - auto-save names and auto-clearing tags on incoming messages", () => {
    it("should auto-save contact name when empty and extractedData.client contains firstName and lastName", async () => {
      const mockChatSessionRepository = createMockChatSessionRepository({
        getOrCreate: vi.fn().mockResolvedValue(
          Result.ok({
            id: IdVO.create("550e8400-e29b-41d4-a716-446655440003"),
            whatsappId: NonEmptyStringVO.create("+584121234567"),
            status: "BOT",
            driftCount: 0,
            contactName: null,
            tags: [],
          })
        ),
      });
      mockChatSessionRepository.getById = vi.fn().mockResolvedValue(
        Result.ok({
          id: IdVO.create("550e8400-e29b-41d4-a716-446655440003"),
          whatsappId: NonEmptyStringVO.create("+584121234567"),
          status: "BOT",
          driftCount: 0,
          contactName: NonEmptyStringVO.create("Jane Smith"),
          tags: [],
        })
      );

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
            reply: "Hello, nice to meet you",
            isDrift: false,
            extractedData: {
              client: {
                firstName: "Jane",
                lastName: "Smith",
              },
            },
          })
        ),
      };

      const mockCheckWorkingHours = vi.fn().mockResolvedValue(Result.ok(true));
      const mockHandoverToHuman = vi.fn().mockResolvedValue(Result.ok());
      const mockPubSub = {
        publish: vi.fn().mockResolvedValue(undefined),
      };

      const processIncomingMessage = makeProcessIncomingMessage({
        chatSessionRepository: mockChatSessionRepository as any,
        chatMessageRepository: mockChatMessageRepository as any,
        clientRepository: mockClientRepository as any,
        whatsAppGateway: mockWhatsAppGateway as any,
        llmAdapter: mockLlmAdapter as any,
        checkWorkingHours: mockCheckWorkingHours as any,
        handoverToHuman: mockHandoverToHuman as any,
        pubSub: mockPubSub as any,
      });

      const res = await processIncomingMessage({
        from: "+584121234567",
        text: "My name is Jane Smith",
      });

      expect(res.isFailure).toBe(false);
      expect(mockChatSessionRepository.updateById).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440003",
        expect.objectContaining({
          contactName: NonEmptyStringVO.create("Jane Smith"),
        }),
        expect.any(String)
      );
      expect(mockPubSub.publish).toHaveBeenCalledWith("CHAT_SESSION_UPDATED", expect.any(Object));
    });

    it("should auto-clear tags on incoming message if they contain terminal tags like ORDER COMPLETED or CANCELLED", async () => {
      const mockChatSessionRepository = createMockChatSessionRepository({
        getOrCreate: vi.fn().mockResolvedValue(
          Result.ok({
            id: IdVO.create("550e8400-e29b-41d4-a716-446655440003"),
            whatsappId: NonEmptyStringVO.create("+584121234567"),
            status: "BOT",
            driftCount: 0,
            contactName: NonEmptyStringVO.create("Jane Smith"),
            tags: ["ORDER COMPLETED"],
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
            reply: "How can I help you today?",
            isDrift: false,
          })
        ),
      };

      const mockCheckWorkingHours = vi.fn().mockResolvedValue(Result.ok(true));
      const mockHandoverToHuman = vi.fn().mockResolvedValue(Result.ok());
      const mockPubSub = {
        publish: vi.fn().mockResolvedValue(undefined),
      };

      const processIncomingMessage = makeProcessIncomingMessage({
        chatSessionRepository: mockChatSessionRepository as any,
        chatMessageRepository: mockChatMessageRepository as any,
        clientRepository: mockClientRepository as any,
        whatsAppGateway: mockWhatsAppGateway as any,
        llmAdapter: mockLlmAdapter as any,
        checkWorkingHours: mockCheckWorkingHours as any,
        handoverToHuman: mockHandoverToHuman as any,
        pubSub: mockPubSub as any,
      });

      const res = await processIncomingMessage({
        from: "+584121234567",
        text: "I need to order again",
      });

      expect(res.isFailure).toBe(false);
      expect(mockChatSessionRepository.updateById).toHaveBeenCalledWith(
        "550e8400-e29b-41d4-a716-446655440003",
        { tags: [] },
        expect.any(String)
      );
      expect(mockPubSub.publish).toHaveBeenCalledWith("CHAT_SESSION_UPDATED", expect.any(Object));
    });
  });

  describe("Memory Compaction Pipeline & Daily Threads", () => {
    it("should trigger compaction pipeline when 3 or more active threads exist and today is a new day", async () => {
      const mockChatSessionRepository = createMockChatSessionRepository({
        getOrCreate: vi.fn().mockResolvedValue(
          Result.ok({
            id: IdVO.create("550e8400-e29b-41d4-a716-446655440003"),
            whatsappId: NonEmptyStringVO.create("+584121234567"),
            status: "BOT",
            driftCount: 0,
            historicalSummary: "Resumen inicial.",
          })
        ),
      });

      const mockChatMessageRepository = createMockChatMessageRepository();
      mockChatMessageRepository.getActiveThreads = vi.fn().mockResolvedValue(
        Result.ok([
          {
            dateStr: "2026-07-09",
            status: "ACTIVE",
            messages: [{ sender: "CUSTOMER", text: "Hola, quiero una bujía", createdAt: new Date("2026-07-09T10:00:00Z") }],
          },
          {
            dateStr: "2026-07-10",
            status: "ACTIVE",
            messages: [{ sender: "BOT", text: "Hola, claro pana", createdAt: new Date("2026-07-10T10:00:00Z") }],
          },
          {
            dateStr: "2026-07-11",
            status: "ACTIVE",
            messages: [{ sender: "CUSTOMER", text: "Me la puedes enviar hoy?", createdAt: new Date("2026-07-11T10:00:00Z") }],
          },
        ])
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
            reply: "Buenísimo pana! Tu bujía está en camino",
            isDrift: false,
          })
        ),
        compactMemory: vi.fn().mockResolvedValue(
          Result.ok("El cliente solicitó una bujía y preguntó por el despacho.")
        ),
      };

      const processIncomingMessage = makeProcessIncomingMessage({
        chatSessionRepository: mockChatSessionRepository as any,
        chatMessageRepository: mockChatMessageRepository as any,
        clientRepository: mockClientRepository as any,
        whatsAppGateway: mockWhatsAppGateway,
        llmAdapter: mockLlmAdapter,
        checkWorkingHours: vi.fn().mockResolvedValue(Result.ok(true)),
        handoverToHuman: vi.fn().mockResolvedValue(Result.ok(undefined)),
      });

      const res = await processIncomingMessage({
        from: "+584121234567",
        text: "Sí, por favor",
      });

      expect(res.isFailure).toBe(false);
      expect(mockLlmAdapter.compactMemory).toHaveBeenCalled();
      expect(mockLlmAdapter.compactMemory).toHaveBeenCalledWith(
        "Resumen inicial.",
        expect.stringContaining("2026-07-09")
      );
      expect(mockChatSessionRepository.updateById).toHaveBeenCalledWith(
        expect.anything(),
        { historicalSummary: "El cliente solicitó una bujía y preguntó por el despacho." },
        expect.anything()
      );
      expect(mockChatMessageRepository.archiveThreads).toHaveBeenCalledWith(
        expect.anything(),
        ["2026-07-09", "2026-07-10", "2026-07-11"]
      );
      expect(mockLlmAdapter.generateResponse).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Array),
        expect.objectContaining({
          historicalSummary: "El cliente solicitó una bujía y preguntó por el despacho.",
        })
      );
    });

    it("should NOT trigger compaction if there are fewer than 3 active threads", async () => {
      const mockChatSessionRepository = createMockChatSessionRepository({
        getOrCreate: vi.fn().mockResolvedValue(
          Result.ok({
            id: IdVO.create("550e8400-e29b-41d4-a716-446655440003"),
            whatsappId: NonEmptyStringVO.create("+584121234567"),
            status: "BOT",
            driftCount: 0,
            historicalSummary: "Resumen inicial.",
          })
        ),
      });

      const mockChatMessageRepository = createMockChatMessageRepository();
      mockChatMessageRepository.getActiveThreads = vi.fn().mockResolvedValue(
        Result.ok([
          {
            dateStr: "2026-07-11",
            status: "ACTIVE",
            messages: [{ sender: "CUSTOMER", text: "Hola, quiero una bujía", createdAt: new Date() }],
          },
        ])
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
            reply: "Buenísimo pana!",
            isDrift: false,
          })
        ),
        compactMemory: vi.fn(),
      };

      const processIncomingMessage = makeProcessIncomingMessage({
        chatSessionRepository: mockChatSessionRepository as any,
        chatMessageRepository: mockChatMessageRepository as any,
        clientRepository: mockClientRepository as any,
        whatsAppGateway: mockWhatsAppGateway,
        llmAdapter: mockLlmAdapter,
        checkWorkingHours: vi.fn().mockResolvedValue(Result.ok(true)),
        handoverToHuman: vi.fn().mockResolvedValue(Result.ok(undefined)),
      });

      const res = await processIncomingMessage({
        from: "+584121234567",
        text: "Sí, por favor",
      });

      expect(res.isFailure).toBe(false);
      expect(mockLlmAdapter.compactMemory).not.toHaveBeenCalled();
      expect(mockChatMessageRepository.archiveThreads).not.toHaveBeenCalled();
    });
  });
});
