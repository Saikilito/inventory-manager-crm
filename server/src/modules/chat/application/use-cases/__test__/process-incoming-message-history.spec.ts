import { describe, expect, it } from 'vitest';
import { ChatMessageSender, type IChatThread } from '../../repositories/chat-message.repository.js';
import { buildCompactionTranscript, buildPublicActiveHistory, MAX_RECENT_ACTIVE_HISTORY_MESSAGES } from '../process-incoming-message-history.js';

describe('public Sales history', () => {
  it('excludes private whispers and compacted threads', () => {
    const threads = [thread('old', 'archived data'), {
      ...thread('today', 'customer data'),
      messages: [
        { text: 'private directive', sender: ChatMessageSender.CRM_OPERATOR, isPrivate: true },
        { text: 'customer data', sender: ChatMessageSender.CUSTOMER, isPrivate: false },
      ],
    }];
    const history = buildPublicActiveHistory(threads, new Set(['old']));
    const transcript = buildCompactionTranscript(threads);

    expect(history).toEqual([{ role: 'user', text: 'customer data' }]);
    expect(transcript).not.toContain('private directive');
  });

  it('caps active history to the named limit', () => {
    const messages = Array.from({ length: MAX_RECENT_ACTIVE_HISTORY_MESSAGES + 5 }, (_, index) => ({
      text: String(index), sender: ChatMessageSender.CUSTOMER, isPrivate: false,
    }));
    expect(buildPublicActiveHistory([{ ...thread('today', ''), messages }])).toHaveLength(MAX_RECENT_ACTIVE_HISTORY_MESSAGES);
  });
});

const thread = (dateStr: string, text: string): IChatThread => ({
  whatsappId: '+1' as IChatThread['whatsappId'],
  dateStr,
  status: 'ACTIVE',
  messages: [{ text, sender: ChatMessageSender.CUSTOMER, isPrivate: false }],
});
