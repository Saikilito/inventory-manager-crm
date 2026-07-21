import { KnowledgeCategory, KnowledgeCategoryType, KnowledgeCategoryVO } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-category.vo.js';
import { HierarchyLevel, HierarchyLevelType, HierarchyLevelVO } from '../../../../../../shared-domain/src/knowledge/value-objects/hierarchy-level.vo.js';
import { KnowledgeStatus, KnowledgeStatusType, KnowledgeStatusVO } from '../../../../../../shared-domain/src/knowledge/value-objects/knowledge-status.vo.js';
import { WikiLinkVO, IWikiLink } from '../../../../../../shared-domain/src/knowledge/value-objects/wiki-link.vo.js';
import { IdVO, Id } from '../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { IWikiLink as IWikiLinkType } from '../../../../../../shared-domain/src/knowledge/value-objects/wiki-link.vo.js';

export interface ProductExtractorInput {
  productId: Id;
  name: string;
  category?: string;
  price?: number;
  description?: string;
  sku?: string;
}

export interface ProductExtractorOutput {
  category: KnowledgeCategoryType;
  title: string;
  content: string;
  wikiLinks: IWikiLinkType[];
  hierarchyLevel: HierarchyLevelType;
  tags: string[];
  status: KnowledgeStatusType;
  productId: Id;
}

const CATEGORY_MAP: Record<string, KnowledgeCategory> = {
  PRODUCT: KnowledgeCategory.PRODUCTS,
  PRODUCTS: KnowledgeCategory.PRODUCTS,
  SALE: KnowledgeCategory.SALES,
  SALES: KnowledgeCategory.SALES,
  COMPANY: KnowledgeCategory.COMPANY,
  SUPPORT: KnowledgeCategory.CUSTOMER_SERVICE,
  SERVICE: KnowledgeCategory.CUSTOMER_SERVICE,
  CUSTOMER_SERVICE: KnowledgeCategory.CUSTOMER_SERVICE,
};

const mapToCategory = (raw?: string): KnowledgeCategoryType => {
  if (!raw) return KnowledgeCategoryVO.create(KnowledgeCategory.PRODUCTS);

  const normalized = raw.toUpperCase().replace(/\s+/g, '_');
  const mapped = CATEGORY_MAP[normalized] ?? CATEGORY_MAP[normalized.split('_')[0] ?? ''];
  if (mapped) return KnowledgeCategoryVO.create(mapped);

  const directResult = KnowledgeCategoryVO.createResult(raw);
  return directResult.isFailure
    ? KnowledgeCategoryVO.create(KnowledgeCategory.PRODUCTS)
    : directResult.getValue();
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);

const buildContent = (input: ProductExtractorInput): string => {
  const sections: string[] = [];
  sections.push(`Auto-extracted knowledge for product "${input.name}".`);
  if (input.description) {
    sections.push(input.description);
  }
  if (input.price !== undefined) {
    sections.push(`Reference price: ${input.price.toFixed(2)}.`);
  }
  if (input.sku) {
    sections.push(`SKU: ${input.sku}.`);
  }
  sections.push(
    `See [[${input.name}]] for canonical product details and [[Product Catalog]] for related entries.`,
  );
  return sections.join('\n\n');
};

const buildTitle = (name: string): string => {
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Untitled product';
  return trimmed.length > 120 ? `${trimmed.slice(0, 117).trimEnd()}...` : trimmed;
};

const buildTags = (input: ProductExtractorInput): string[] => {
  const tags: string[] = ['auto-extracted', 'product', slugify(input.name)];
  if (input.sku) tags.push(`sku:${input.sku.toLowerCase()}`);
  return tags;
};

export const makeProductExtractor = () => {
  return {
    extract: (input: ProductExtractorInput): ProductExtractorOutput => {
      const title = buildTitle(input.name);
      const content = buildContent(input);
      const wikiLinks: IWikiLink[] = WikiLinkVO.extractFromContent(content);

      return {
        category: mapToCategory(input.category),
        title,
        content,
        wikiLinks,
        hierarchyLevel: HierarchyLevelVO.create(HierarchyLevel.TOPIC),
        tags: buildTags(input),
        status: KnowledgeStatusVO.create(KnowledgeStatus.DRAFT),
        productId: IdVO.create(input.productId.toString()),
      };
    },
  };
};

export type ProductExtractor = ReturnType<typeof makeProductExtractor>;
