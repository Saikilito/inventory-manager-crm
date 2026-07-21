import { describe, it, expect } from 'vitest';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { KnowledgeCategory } from '../../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import { HierarchyLevel } from '../../../../../../../shared-domain/src/knowledge/value-objects/hierarchy-level.vo.js';
import { KnowledgeStatus } from '../../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { makeProductExtractor } from '../product-extractor.js';

const PRODUCT_ID = '507f1f77bcf86cd799439011';

const buildInput = (overrides: Record<string, unknown> = {}) => ({
  productId: IdVO.create(PRODUCT_ID),
  name: 'Premium Saikilo Coffee',
  price: 12.5,
  ...overrides,
});

describe('ProductExtractor', () => {
  it('should use the product name as the knowledge title', () => {
    const extractor = makeProductExtractor();
    const result = extractor.extract(buildInput());
    expect(result.title).toBe('Premium Saikilo Coffee');
  });

  it('should default to PRODUCTS category when none is provided', () => {
    const extractor = makeProductExtractor();
    const result = extractor.extract(buildInput());
    expect(result.category).toBe(KnowledgeCategory.PRODUCTS);
  });

  it('should map SALES-related category names to the SALES category', () => {
    const extractor = makeProductExtractor();
    expect(extractor.extract(buildInput({ category: 'SALE' })).category).toBe(KnowledgeCategory.SALES);
    expect(extractor.extract(buildInput({ category: 'sales' })).category).toBe(KnowledgeCategory.SALES);
  });

  it('should map SUPPORT-related category names to CUSTOMER_SERVICE', () => {
    const extractor = makeProductExtractor();
    expect(extractor.extract(buildInput({ category: 'SUPPORT' })).category).toBe(KnowledgeCategory.CUSTOMER_SERVICE);
    expect(extractor.extract(buildInput({ category: 'customer service' })).category).toBe(KnowledgeCategory.CUSTOMER_SERVICE);
  });

  it('should fall back to PRODUCTS for unknown category strings', () => {
    const extractor = makeProductExtractor();
    const result = extractor.extract(buildInput({ category: 'NOT_A_REAL_CATEGORY' }));
    expect(result.category).toBe(KnowledgeCategory.PRODUCTS);
  });

  it('should produce content containing the product name and price', () => {
    const extractor = makeProductExtractor();
    const result = extractor.extract(
      buildInput({ name: 'Espresso Roast', price: 9.99, description: 'Dark roast' }),
    );
    expect(result.content).toContain('Espresso Roast');
    expect(result.content).toContain('9.99');
    expect(result.content).toContain('Dark roast');
  });

  it('should extract wiki links from generated content', () => {
    const extractor = makeProductExtractor();
    const result = extractor.extract(buildInput());
    const titles = result.wikiLinks.map((link) => link.title.toString());
    expect(titles).toContain('Premium Saikilo Coffee');
    expect(titles).toContain('Product Catalog');
  });

  it('should set status to DRAFT and hierarchy to TOPIC', () => {
    const extractor = makeProductExtractor();
    const result = extractor.extract(buildInput());
    expect(result.status).toBe(KnowledgeStatus.DRAFT);
    expect(result.hierarchyLevel).toBe(HierarchyLevel.TOPIC);
  });

  it('should preserve the productId', () => {
    const extractor = makeProductExtractor();
    const result = extractor.extract(buildInput());
    expect(result.productId.toString()).toBe(PRODUCT_ID);
  });

  it('should include SKU and an auto-extracted tag', () => {
    const extractor = makeProductExtractor();
    const result = extractor.extract(buildInput({ sku: 'ABC-123' }));
    expect(result.tags).toContain('auto-extracted');
    expect(result.tags).toContain('sku:abc-123');
  });
});
