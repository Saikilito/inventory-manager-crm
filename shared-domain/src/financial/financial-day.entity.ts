import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { DateTime, DateTimeVO } from '../shared/value-objects/date-time.vo.js';
import { DateOnly, DateOnlyVO } from '../shared/value-objects/date-only.vo.js';

export const FinancialDayStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
} as const;

export type FinancialDayStatus = typeof FinancialDayStatus[keyof typeof FinancialDayStatus];

export interface IFinancialDayBalance {
  accountId: Id;
  balance: number;
}

export interface IFinancialDay {
  id?: Id;
  date: DateOnly;
  status: FinancialDayStatus;
  openingBalances: IFinancialDayBalance[];
  closingBalances: IFinancialDayBalance[];
  openedAt: DateTime;
  closedAt?: DateTime;
  isOpen: () => boolean;
}

export const makeFinancialDay = (props: {
  id?: string;
  date: string | Date;
  status: string;
  openingBalances?: Array<{ accountId: string; balance: number }>;
  closingBalances?: Array<{ accountId: string; balance: number }>;
  openedAt?: string;
  closedAt?: string;
}): IFinancialDay => {
  const parsedStatus = props.status.toUpperCase() as FinancialDayStatus;
  if (parsedStatus !== FinancialDayStatus.OPEN && parsedStatus !== FinancialDayStatus.CLOSED) {
    throw new Error(`Unsupported financial day status: ${props.status}`);
  }

  return {
    id: props.id ? IdVO.create(props.id) : undefined,
    date: DateOnlyVO.create(props.date),
    status: parsedStatus,
    openingBalances: (props.openingBalances || []).map(b => ({
      accountId: IdVO.create(b.accountId),
      balance: b.balance,
    })),
    closingBalances: (props.closingBalances || []).map(b => ({
      accountId: IdVO.create(b.accountId),
      balance: b.balance,
    })),
    openedAt: DateTimeVO.create(props.openedAt),
    closedAt: props.closedAt ? DateTimeVO.create(props.closedAt) : undefined,
    isOpen: (): boolean => parsedStatus === FinancialDayStatus.OPEN,
  };
};
