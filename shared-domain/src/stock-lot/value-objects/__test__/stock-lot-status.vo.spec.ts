import { describe, it, expect } from 'vitest';
import { StockLotStatus, StockLotStatusVO } from '../stock-lot-status.vo.js';
import { ValidationError } from '../../../shared/validation-error.js';

describe('StockLotStatusVO', () => {
  it('should create valid stock lot statuses', () => {
    const draft = StockLotStatusVO.create('DRAFT');
    expect(draft).toBe(StockLotStatus.DRAFT);
    expect(StockLotStatusVO.isDraft(draft)).toBe(true);

    const received = StockLotStatusVO.create('received');
    expect(received).toBe(StockLotStatus.RECEIVED);
    expect(StockLotStatusVO.isReceived(received)).toBe(true);

    const partial = StockLotStatusVO.create('PARTIAL');
    expect(StockLotStatusVO.isPartial(partial)).toBe(true);

    const paid = StockLotStatusVO.create('PAID');
    expect(StockLotStatusVO.isPaid(paid)).toBe(true);
  });

  it('should fail creation for invalid statuses', () => {
    const result = StockLotStatusVO.createResult('UNKNOWN');
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(ValidationError);

    expect(() => StockLotStatusVO.create('INVALID')).toThrow(ValidationError);
  });

  it('should check equality correctly', () => {
    const status1 = StockLotStatusVO.create('RECEIVED');
    const status2 = StockLotStatusVO.create('received');
    const draft = StockLotStatusVO.create('DRAFT');

    expect(StockLotStatusVO.equals(status1, status2)).toBe(true);
    expect(StockLotStatusVO.equals(status1, draft)).toBe(false);
  });
});
