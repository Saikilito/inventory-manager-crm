import { describe, expect, it } from 'vitest';
import { verifyReply } from '../response-verifier.js';

describe('verifyReply', () => {
  it('passes when the reply mentions the matching authoritative total', () => {
    const result = verifyReply('Tu pedido tiene un total de $125.00', { orderTotal: 125 });
    expect(result.ok).toBe(true);
  });

  it('fails when the reply mentions a mismatched total', () => {
    const result = verifyReply('Tu pedido tiene un total de $200.00', { orderTotal: 125 });
    expect(result.ok).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('passes when the reply mentions no price at all', () => {
    const result = verifyReply('Gracias por tu compra, en breve recibirás tu pedido.', { orderTotal: 125 });
    expect(result.ok).toBe(true);
  });

  it('always passes when no authoritative fact is set', () => {
    const result = verifyReply('Tu pedido tiene un total de $9999.00', {});
    expect(result.ok).toBe(true);
  });

  it('parses Venezuelan comma-decimal format correctly', () => {
    const result = verifyReply('El total es Bs 125,00', { orderTotal: 125 });
    expect(result.ok).toBe(true);
  });

  it('rejects a mismatched Venezuelan comma-decimal amount', () => {
    const result = verifyReply('El total es 200,50', { orderTotal: 125 });
    expect(result.ok).toBe(false);
  });

  it('allows totals within the rounding tolerance', () => {
    const result = verifyReply('El total es $125.90', { orderTotal: 125 });
    expect(result.ok).toBe(true);
  });
});
