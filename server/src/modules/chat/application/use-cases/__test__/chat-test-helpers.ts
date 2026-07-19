import { vi } from "vitest";
import { Result } from "../../../../../../../shared-domain/src/shared/result.js";
import { IdVO } from "../../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { NonEmptyStringVO } from "../../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";

export const createMockChatMessageRepository = () => ({
  create: vi.fn().mockResolvedValue(Result.ok({})),
  getAll: vi.fn().mockResolvedValue(Result.ok({ items: [] })),
  getMessagesByWhatsappId: vi.fn().mockResolvedValue(Result.ok([])),
  getActiveThreads: vi.fn().mockResolvedValue(Result.ok([])),
  archiveThreads: vi.fn().mockResolvedValue(Result.ok()),
});

export const createMockChatSessionRepository = (
  overrides: {
    getOrCreate?: ReturnType<typeof vi.fn>;
  } = {}
) => ({
  getOrCreate: overrides.getOrCreate ?? vi.fn().mockResolvedValue(
    Result.ok({
      id: IdVO.create("550e8400-e29b-41d4-a716-446655440003"),
      whatsappId: NonEmptyStringVO.create("+584121234567"),
      status: "BOT",
      driftCount: 0,
    })
  ),
  updateById: vi.fn().mockResolvedValue(Result.ok()),
  updateDrift: vi.fn().mockResolvedValue(Result.ok()),
  getById: vi.fn().mockResolvedValue(
    Result.ok({
      id: IdVO.create("550e8400-e29b-41d4-a716-446655440003"),
      whatsappId: NonEmptyStringVO.create("+584121234567"),
      status: "BOT",
      driftCount: 0,
    })
  ),
});
