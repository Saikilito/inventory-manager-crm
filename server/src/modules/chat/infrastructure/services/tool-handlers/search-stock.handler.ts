import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { getSpanishSingular } from '../gemini.utils.js';
import { MAX_PRODUCT_SEARCH_LIMIT } from '../gemini.constants.js';
import type { ToolDispatcherDependencies } from '../types.js';

export async function handleSearchStock(
  args: Record<string, unknown>,
  from: string,
  dependencies: ToolDispatcherDependencies,
): Promise<Record<string, unknown>> {
  const query = (args.query as string) || '';
  const contextId = (args.contextId as string) || undefined;
  const motoBrand = (args.motoBrand as string) || '';
  const motoModel = (args.motoModel as string) || '';
  const partBrand = (args.partBrand as string) || '';

  const tokens = query
    .trim()
    .split(/\s+/)
    .map((t: string) => getSpanishSingular(t))
    .filter((t: string) => t.length > 0);

  let cleanedTokens = tokens;
  const hasAlphabetical = tokens.some((t: string) => /[a-zA-ZñÑ]/.test(t));
  if (hasAlphabetical) {
    cleanedTokens = tokens.filter((t: string) => !/^\d+$/.test(t));
  }

  const searchTokens = {
    nameTokens: cleanedTokens.length > 0 ? cleanedTokens : query ? [query] : [],
    contextId: contextId,
    motoBrand: motoBrand || undefined,
    motoModel: motoModel || undefined,
    partBrand: partBrand || undefined,
    limit: MAX_PRODUCT_SEARCH_LIMIT,
  };

  const searchResult = await dependencies.productRepository.searchByTokens(searchTokens);
  let matchingProducts = searchResult.items;

  if (matchingProducts.length === 0 && cleanedTokens.length > 1) {
    const relaxed = await dependencies.productRepository.searchByTokens({
      nameTokens: [cleanedTokens[0]!],
      limit: MAX_PRODUCT_SEARCH_LIMIT,
    });
    matchingProducts = relaxed.items;
  }

  if (matchingProducts.length === 0) {
    const nilUuid = IdVO.generateNil().toString();
    await dependencies.logUnsatisfiedDemand({
      productId: nilUuid,
      clientPhone: from,
      productName: query,
      quantity: 1,
    });
  } else {
    await logUnsatisfiedDemandForOutOfStock(matchingProducts, from, dependencies);
  }

  return {
    products: matchingProducts.map((p) => ({
      id: p.id ? p.id.toString() : '',
      name: p.name.toString(),
      sellingPrice: unwrapNumberValue(p.sellingPrice),
      stock: unwrapNumberValue(p.stock),
    })),
  };
}

function unwrapNumberValue(value: unknown): number {
  if (typeof value === 'object' && value !== null && 'value' in value) {
    return Number((value as { value: unknown }).value);
  }
  return Number(value);
}

async function logUnsatisfiedDemandForOutOfStock(
  products: Array<{ id?: { toString(): string }; name: { toString(): string }; stock: unknown }>,
  from: string,
  dependencies: ToolDispatcherDependencies,
): Promise<void> {
  for (const p of products) {
    const stockValue = unwrapNumberValue(p.stock);
    if (stockValue === 0) {
      await dependencies.logUnsatisfiedDemand({
        productId: p.id ? p.id.toString() : IdVO.generateNil().toString(),
        clientPhone: from,
        productName: p.name.toString(),
        quantity: 1,
      });
    }
  }
}
