import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import {
  ProcessIncomingMessage,
  ProcessIncomingMessageOutput,
} from '../../application/use-cases/process-incoming-message.types.js';
import { HandoverToHuman } from '../../application/use-cases/handover-to-human.use-case.js';
import { IPubSub } from '../pubsub.js';

export interface IncomingMessageCollectorInput {
  from: string;
  text: string;
  mediaType?: "audio" | "image" | "video" | "document" | null;
}

export interface IncomingMessageCollectorDependencies {
  processIncomingMessage: ProcessIncomingMessage;
  handoverToHuman: HandoverToHuman;
  pubSub?: IPubSub;
  debounceMs?: number;
  maxWaitMs?: number;
  maxMessageCount?: number;
}

export interface PendingBuffer {
  messages: string[];
  startTime: number;
  timer: NodeJS.Timeout;
}

export interface IIncomingMessageCollector {
  enqueue(input: IncomingMessageCollectorInput): Promise<Result<void, Error>>;
  flush(from: string): Promise<Result<ProcessIncomingMessageOutput | null, Error>>;
  clear(from: string): void;
  destroy(): void;
}

export const DEFAULT_DEBOUNCE_MS = 10_000;
export const DEFAULT_MAX_WAIT_MS = 60_000;
export const DEFAULT_MAX_MESSAGE_COUNT = 5;

export const makeIncomingMessageCollector = (
  dependencies: IncomingMessageCollectorDependencies,
): IIncomingMessageCollector => {
  const debounceMs = dependencies.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const maxWaitMs = dependencies.maxWaitMs ?? DEFAULT_MAX_WAIT_MS;
  const maxMessageCount = dependencies.maxMessageCount ?? DEFAULT_MAX_MESSAGE_COUNT;

  const buffers = new Map<string, PendingBuffer>();

  const clear = (from: string): void => {
    const existing = buffers.get(from);
    if (existing) {
      clearTimeout(existing.timer);
      buffers.delete(from);
    }
  };

  const destroy = (): void => {
    for (const [from, buffer] of buffers.entries()) {
      clearTimeout(buffer.timer);
      buffers.delete(from);
    }
  };

  const triggerSafetyHandover = async (from: string): Promise<Result<void, Error>> => {
    clear(from);
    const handoverRes = await dependencies.handoverToHuman(from);
    if (handoverRes.isFailure) {
      return Result.fail(handoverRes.getError());
    }
    return Result.ok<void, Error>();
  };

  const flush = async (
    from: string,
  ): Promise<Result<ProcessIncomingMessageOutput | null, Error>> => {
    const buffer = buffers.get(from);
    if (!buffer || buffer.messages.length === 0) {
      return Result.ok(null);
    }

    clearTimeout(buffer.timer);
    buffers.delete(from);

    const combinedText = buffer.messages.join('\n');
    const processRes = await dependencies.processIncomingMessage({
      from,
      text: combinedText,
      alreadySaved: true,
    });

    if (processRes.isFailure) {
      return Result.fail(processRes.getError());
    }

    const output = processRes.getValue();

    if (dependencies.pubSub) {
      await dependencies.pubSub.publish('CHAT_SESSION_UPDATED', {
        chatSessionUpdated: {
          id: output.sessionId,
          _id: output.sessionId,
          whatsappId: from,
          status: output.status,
          driftCount: output.driftCount,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    return Result.ok(output);
  };

  const enqueue = async (
    input: IncomingMessageCollectorInput,
  ): Promise<Result<void, Error>> => {
    const { from, text, mediaType } = input;

    if (mediaType === "audio" || mediaType === "image") {
      clear(from);
      const processRes = await dependencies.processIncomingMessage({
        from,
        text,
        mediaType,
        alreadySaved: true,
      });

      if (processRes.isFailure) {
        return Result.fail(processRes.getError());
      }

      const output = processRes.getValue();

      if (dependencies.pubSub) {
        await dependencies.pubSub.publish('CHAT_SESSION_UPDATED', {
          chatSessionUpdated: {
            id: output.sessionId,
            _id: output.sessionId,
            whatsappId: from,
            status: output.status,
            driftCount: output.driftCount,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      }

      return Result.ok<void, Error>();
    }

    const now = Date.now();
    const existing = buffers.get(from);

    if (!existing) {
      const timer = setTimeout(() => {
        void flush(from);
      }, debounceMs);

      buffers.set(from, {
        messages: [text],
        startTime: now,
        timer,
      });

      return Result.ok<void, Error>();
    }

    clearTimeout(existing.timer);
    existing.messages.push(text);

    const totalCount = existing.messages.length;
    const elapsedTime = now - existing.startTime;

    if (totalCount > maxMessageCount || elapsedTime >= maxWaitMs) {
      console.warn(
        `⚠️ [MessageCollector] Safety limit reached for ${from} (messages: ${totalCount}/${maxMessageCount}, elapsed: ${elapsedTime}ms/${maxWaitMs}ms). Escalating to HUMAN mode.`,
      );
      return triggerSafetyHandover(from);
    }

    existing.timer = setTimeout(() => {
      void flush(from);
    }, debounceMs);

    return Result.ok<void, Error>();
  };

  return {
    enqueue,
    flush,
    clear,
    destroy,
  };
};
