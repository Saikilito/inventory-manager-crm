import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Result } from '../../../../../../../shared-domain/src/shared/result.js';
import {
  makeIncomingMessageCollector,
  IIncomingMessageCollector,
} from '../incoming-message-collector.js';

describe('IncomingMessageCollector', () => {
  let mockProcessIncomingMessage: any;
  let mockHandoverToHuman: any;
  let mockPubSub: any;
  let collector: IIncomingMessageCollector;

  beforeEach(() => {
    vi.useFakeTimers();

    mockProcessIncomingMessage = vi.fn().mockResolvedValue(
      Result.ok({
        sessionId: 'session-123',
        status: 'BOT',
        driftCount: 0,
      }),
    );

    mockHandoverToHuman = vi.fn().mockResolvedValue(Result.ok());
    mockPubSub = {
      publish: vi.fn().mockResolvedValue(undefined),
    };
  });

  afterEach(() => {
    if (collector) {
      collector.destroy();
    }
    vi.useRealTimers();
  });

  it('should debounce a single message and call processIncomingMessage after debounceMs', async () => {
    collector = makeIncomingMessageCollector({
      processIncomingMessage: mockProcessIncomingMessage,
      handoverToHuman: mockHandoverToHuman,
      pubSub: mockPubSub,
      debounceMs: 5000,
    });

    const res = await collector.enqueue({ from: '+584121234567', text: 'Hola' });
    expect(res.isFailure).toBe(false);

    expect(mockProcessIncomingMessage).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(5000);

    expect(mockProcessIncomingMessage).toHaveBeenCalledTimes(1);
    expect(mockProcessIncomingMessage).toHaveBeenCalledWith({
      from: '+584121234567',
      text: 'Hola',
      alreadySaved: true,
    });
    expect(mockPubSub.publish).toHaveBeenCalledWith('CHAT_SESSION_UPDATED', expect.anything());
  });

  it('should accumulate multiple rapid messages and flush a single combined message', async () => {
    collector = makeIncomingMessageCollector({
      processIncomingMessage: mockProcessIncomingMessage,
      handoverToHuman: mockHandoverToHuman,
      pubSub: mockPubSub,
      debounceMs: 5000,
    });

    await collector.enqueue({ from: '+584121234567', text: 'Hola' });
    await vi.advanceTimersByTimeAsync(2000);

    await collector.enqueue({ from: '+584121234567', text: '¿Cómo estás?' });
    await vi.advanceTimersByTimeAsync(2000);

    await collector.enqueue({ from: '+584121234567', text: 'Yo bien, ¿y tú?' });

    expect(mockProcessIncomingMessage).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(5000);

    expect(mockProcessIncomingMessage).toHaveBeenCalledTimes(1);
    expect(mockProcessIncomingMessage).toHaveBeenCalledWith({
      from: '+584121234567',
      text: 'Hola\n¿Cómo estás?\nYo bien, ¿y tú?',
      alreadySaved: true,
    });
  });

  it('should trigger human handover when maxMessageCount is exceeded (safety limit)', async () => {
    collector = makeIncomingMessageCollector({
      processIncomingMessage: mockProcessIncomingMessage,
      handoverToHuman: mockHandoverToHuman,
      pubSub: mockPubSub,
      debounceMs: 5000,
      maxMessageCount: 3,
    });

    await collector.enqueue({ from: '+584121234567', text: 'Msg 1' });
    await collector.enqueue({ from: '+584121234567', text: 'Msg 2' });
    await collector.enqueue({ from: '+584121234567', text: 'Msg 3' });

    expect(mockHandoverToHuman).not.toHaveBeenCalled();

    await collector.enqueue({ from: '+584121234567', text: 'Msg 4' });

    expect(mockHandoverToHuman).toHaveBeenCalledTimes(1);
    expect(mockHandoverToHuman).toHaveBeenCalledWith('+584121234567');
    expect(mockProcessIncomingMessage).not.toHaveBeenCalled();
  });

  it('should trigger human handover when maxWaitMs is exceeded (safety limit)', async () => {
    collector = makeIncomingMessageCollector({
      processIncomingMessage: mockProcessIncomingMessage,
      handoverToHuman: mockHandoverToHuman,
      pubSub: mockPubSub,
      debounceMs: 5000,
      maxWaitMs: 10000,
    });

    await collector.enqueue({ from: '+584121234567', text: 'Msg 1' });

    await vi.advanceTimersByTimeAsync(4000);
    await collector.enqueue({ from: '+584121234567', text: 'Msg 2' });

    await vi.advanceTimersByTimeAsync(4000);
    await collector.enqueue({ from: '+584121234567', text: 'Msg 3' });

    await vi.advanceTimersByTimeAsync(3000);
    await collector.enqueue({ from: '+584121234567', text: 'Msg 4' });

    expect(mockHandoverToHuman).toHaveBeenCalledTimes(1);
    expect(mockHandoverToHuman).toHaveBeenCalledWith('+584121234567');
  });

  it('should clear buffer without invoking processIncomingMessage on clear() or destroy()', async () => {
    collector = makeIncomingMessageCollector({
      processIncomingMessage: mockProcessIncomingMessage,
      handoverToHuman: mockHandoverToHuman,
      debounceMs: 5000,
    });

    await collector.enqueue({ from: '+584121234567', text: 'Hola' });
    collector.clear('+584121234567');

    await vi.advanceTimersByTimeAsync(10000);
    expect(mockProcessIncomingMessage).not.toHaveBeenCalled();
  });

  it('should immediately invoke processIncomingMessage without debouncing when mediaType is audio or image', async () => {
    collector = makeIncomingMessageCollector({
      processIncomingMessage: mockProcessIncomingMessage,
      handoverToHuman: mockHandoverToHuman,
      pubSub: mockPubSub,
      debounceMs: 5000,
    });

    const res = await collector.enqueue({
      from: '+584121234567',
      text: '🎵 [Audio recibido]',
      mediaType: 'audio',
    });

    expect(res.isFailure).toBe(false);
    expect(mockProcessIncomingMessage).toHaveBeenCalledTimes(1);
    expect(mockProcessIncomingMessage).toHaveBeenCalledWith({
      from: '+584121234567',
      text: '🎵 [Audio recibido]',
      mediaType: 'audio',
      alreadySaved: true,
    });
  });
});
