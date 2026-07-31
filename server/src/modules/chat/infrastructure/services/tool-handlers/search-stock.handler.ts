import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { getSpanishSingular } from '../gemini.utils.js';
import { MAX_PRODUCT_SEARCH_LIMIT } from '../gemini.constants.js';
import type { ToolDispatcherDependencies } from '../types.js';
import type { IProduct } from '../../../../../../../shared-domain/src/product/product.entity.js';

const SPANISH_STOP_WORDS = new Set([
  'que', 'qué', 'cuantos', 'cuántos', 'cuantas', 'cuántas', 'cual', 'cuál', 'cuales', 'cuáles',
  'tenemos', 'tenemo', 'tienen', 'tienes', 'hay', 'existe', 'existen', 'busco', 'necesito',
  'en', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'para', 'por',
  'stock', 'inventario', 'disponible', 'disponibles', 'favor', 'porfavor', 'hola', 'buenas',
  'me', 'nos', 'te', 'se', 'les', 'mi', 'su', 'sus', 'tu', 'tus',
]);

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

  const rawTokens = query
    .trim()
    .split(/\s+/)
    .map((t: string) => t.toLowerCase().replace(/[^a-z0-9áéíóúñ]/g, ''))
    .filter((t: string) => t.length > 0);

  const significantWords = rawTokens.filter((w) => !SPANISH_STOP_WORDS.has(w));
  const candidateWords = significantWords.length > 0 ? significantWords : rawTokens;

  const tokens = candidateWords
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
  let matchingProducts = extractProductItems(searchResult);

  if (matchingProducts.length === 0 && cleanedTokens.length > 1) {
    const relaxed = await dependencies.productRepository.searchByTokens({
      ...searchTokens,
      nameTokens: [cleanedTokens[0]!],
    });
    matchingProducts = extractProductItems(relaxed);
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

function extractProductItems(res: unknown): IProduct[] {
  if (!res) return [];
  if (typeof res === 'object' && res !== null && 'getValue' in res && typeof (res as { getValue: unknown }).getValue === 'function') {
    const isFailure = (res as { isFailure?: boolean }).isFailure;
    if (isFailure) return [];
    const val = (res as { getValue: () => unknown }).getValue();
    if (Array.isArray(val)) return val as IProduct[];
    if (typeof val === 'object' && val !== null && 'items' in val && Array.isArray(val.items)) {
      return val.items as IProduct[];
    }
    return [];
  }
  if (typeof res === 'object' && res !== null && 'items' in res && Array.isArray((res as { items: unknown }).items)) {
    return (res as { items: IProduct[] }).items;
  }
  if (Array.isArray(res)) return res as IProduct[];
  return [];
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
