import { describe, expect, it } from 'vitest';
import { validateAggregateAgainstAllowlist } from '../mongo-query-allowlist.js';

describe('Mongo query allowlist', () => {
  const fields = ['total', 'clientId'];

  it('allows aggregate calculations over allowlisted fields', () => {
    expect(validateAggregateAgainstAllowlist([
      { $group: { _id: '$clientId', total: { $sum: '$total' } } },
    ], fields)).toBeNull();
  });

  it('rejects aggregate references to fields outside the allowlist', () => {
    expect(validateAggregateAgainstAllowlist([
      { $group: { _id: null, leaked: { $first: '$passwordHash' } } },
    ], fields)).toContain('disallowed field reference');
  });
});
