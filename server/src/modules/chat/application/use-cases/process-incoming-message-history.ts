import {
  ChatMessageSender,
  type IChatThread,
} from '../repositories/chat-message.repository.js';

export const MAX_RECENT_ACTIVE_HISTORY_MESSAGES = 40;
export const COMPACTION_THREAD_BATCH_SIZE = 3;

const isPublicMessage = (message: IChatThread['messages'][number]): boolean =>
  !message.isPrivate && message.sender !== ChatMessageSender.CRM_OPERATOR;

export const buildPublicActiveHistory = (
  threads: readonly IChatThread[],
  excludedDateStrs: ReadonlySet<string> = new Set(),
): Array<{ role: string; text: string }> =>
  threads
    .filter((thread) => !excludedDateStrs.has(thread.dateStr))
    .flatMap((thread) => thread.messages)
    .filter(isPublicMessage)
    .slice(-MAX_RECENT_ACTIVE_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.sender === ChatMessageSender.CUSTOMER ? 'user' : 'model',
      text: message.text,
    }));

export const buildCompactionTranscript = (threads: readonly IChatThread[]): string =>
  threads
    .map((thread) => {
      const messages = thread.messages
        .filter(isPublicMessage)
        .map((message) => {
          const role = message.sender === ChatMessageSender.CUSTOMER ? 'Customer' : 'Assistant';
          const timestamp = message.createdAt ? new Date(message.createdAt).toISOString() : '';
          return `[${timestamp}] ${role}: ${message.text}`;
        })
        .join('\n');
      return `--- Date: ${thread.dateStr} ---\n${messages}`;
    })
    .join('\n');
