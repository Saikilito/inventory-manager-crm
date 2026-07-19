import { describe, it, expect } from 'vitest';
import { makeContext } from '../context.entity.js';

describe('context.entity', () => {
  describe('makeContext', () => {
    it('should create a context with label fallback to name', () => {
      const context = makeContext({
        name: 'T-Shirt Schema',
        attributes: [
          { name: 'size', type: 'STRING', required: true },
          { name: 'color', label: 'Item Color', type: 'STRING', required: false }
        ]
      });

      expect(context.name.toString()).toBe('T-Shirt Schema');
      expect(context.attributes[0].name.toString()).toBe('size');
      expect(context.attributes[0].label.toString()).toBe('size'); // fallback
      expect(context.attributes[1].name.toString()).toBe('color');
      expect(context.attributes[1].label.toString()).toBe('Item Color'); // explicit label
    });
  });
});
