import { DateOnlyVO } from '@shared-domain/shared/value-objects/date-only.vo';

export const getTodayDate = (): string => {
  return DateOnlyVO.create().toString();
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
