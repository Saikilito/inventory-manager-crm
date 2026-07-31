import { beforeEach, describe, expect, it, vi } from 'vitest';

const { find, countDocuments } = vi.hoisted(() => ({
  find: vi.fn(),
  countDocuments: vi.fn(),
}));

vi.mock('../../product.model.js', () => ({
  default: {
    find,
    countDocuments,
  },
}));

import { makeProductMongooseRepository } from '../product-mongoose.repository.js';

describe('product token search', () => {
  beforeEach(() => {
    find.mockReset();
    countDocuments.mockReset();
    find.mockReturnValue({ limit: vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue([]) }) });
    countDocuments.mockReturnValue({ exec: vi.fn().mockResolvedValue(0) });
  });

  it('filters motoModel against the motoModel custom attribute', async () => {
    await makeProductMongooseRepository().searchByTokens({
      nameTokens: ['brake'],
      motoModel: 'TX 200',
      limit: 10,
    });

    const filter = find.mock.calls[0]![0];
    expect(JSON.stringify(filter)).toContain('customAttributes.motoModel');
    expect(JSON.stringify(filter)).not.toContain('"customAttributes.motoBrand":{"$regex":"TX 200"');
  });
});
