import { z } from 'zod';
import { Id, IdVO } from '../shared/value-objects/id.vo.js';
import { NonEmptyString, NonEmptyStringVO } from '../shared/value-objects/non-empty-string.vo.js';
import { PositiveNumber, PositiveNumberVO } from '../shared/value-objects/positive-number.vo.js';
import { NonNegativeNumber, NonNegativeNumberVO } from '../shared/value-objects/non-negative-number.vo.js';
import { DateOnly, DateOnlyVO } from '../shared/value-objects/date-only.vo.js';
import { ReconciliationStatus } from './reconciliation-status.vo.js';
import { TransactionSource } from './transaction-source.vo.js';

export interface IReconciliationDiscrepancy {
  type: ReconciliationStatus;
  source: TransactionSource;
  referenceId: Id;
  expectedAmount?: PositiveNumber;
  actualAmount?: PositiveNumber;
  description: NonEmptyString;
}

export interface IReconciliationReport {
  id?: Id;
  date: DateOnly;
  status: ReconciliationStatus;
  matchedCount: NonNegativeNumber;
  discrepancies: IReconciliationDiscrepancy[];
  openingBalance: NonNegativeNumber;
  closingBalance: NonNegativeNumber;
  totalCredits: NonNegativeNumber;
  totalDebits: NonNegativeNumber;
  financialDayId: Id;
  createdAt: NonEmptyString;
}

const ReconciliationDiscrepancySchema = z.object({
  type: z.nativeEnum(ReconciliationStatus),
  source: z.nativeEnum(TransactionSource),
  referenceId: z.string().min(1),
  expectedAmount: z.number().positive().optional(),
  actualAmount: z.number().positive().optional(),
  description: z.string().min(1),
});

const ReconciliationReportSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(1),
  status: z.nativeEnum(ReconciliationStatus),
  matchedCount: z.number().int().nonnegative(),
  discrepancies: z.array(ReconciliationDiscrepancySchema),
  openingBalance: z.number().nonnegative(),
  closingBalance: z.number().nonnegative(),
  totalCredits: z.number().nonnegative(),
  totalDebits: z.number().nonnegative(),
  financialDayId: z.string().min(1),
  createdAt: z.string().min(1).optional(),
});

export const makeReconciliationDiscrepancy = (props: {
  type: ReconciliationStatus;
  source: TransactionSource;
  referenceId: string;
  expectedAmount?: number;
  actualAmount?: number;
  description: string;
}): IReconciliationDiscrepancy => {
  return {
    type: props.type,
    source: props.source,
    referenceId: IdVO.create(props.referenceId),
    expectedAmount: props.expectedAmount !== undefined ? PositiveNumberVO.create(props.expectedAmount) : undefined,
    actualAmount: props.actualAmount !== undefined ? PositiveNumberVO.create(props.actualAmount) : undefined,
    description: NonEmptyStringVO.create(props.description),
  };
};

export const makeReconciliationReport = (props: {
  id?: string;
  date: string;
  status: ReconciliationStatus;
  matchedCount: number;
  discrepancies: Array<{
    type: ReconciliationStatus;
    source: TransactionSource;
    referenceId: string;
    expectedAmount?: number;
    actualAmount?: number;
    description: string;
  }>;
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  financialDayId: string;
  createdAt?: string;
}): IReconciliationReport => {
  const validated = ReconciliationReportSchema.parse(props);

  return {
    id: validated.id ? IdVO.create(validated.id) : undefined,
    date: DateOnlyVO.create(validated.date),
    status: validated.status,
    matchedCount: NonNegativeNumberVO.create(validated.matchedCount),
    discrepancies: validated.discrepancies.map(makeReconciliationDiscrepancy),
    openingBalance: NonNegativeNumberVO.create(validated.openingBalance),
    closingBalance: NonNegativeNumberVO.create(validated.closingBalance),
    totalCredits: NonNegativeNumberVO.create(validated.totalCredits),
    totalDebits: NonNegativeNumberVO.create(validated.totalDebits),
    financialDayId: IdVO.create(validated.financialDayId),
    createdAt: NonEmptyStringVO.create(validated.createdAt ?? new Date().toISOString()),
  };
};
