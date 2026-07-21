import { useQuery } from '@apollo/client';
import { PRODUCTS_QUERY, GET_CONTEXT_METRICS } from '@modules/product/infrastructure/graphql/queries';
import { formatCurrency } from '@utils/formatters';
import { useMemo } from 'react';

export interface Suggestion {
  type: 'low_rotation' | 'low_margin' | 'restock';
  productId: string;
  productName: string;
  reason: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
}

interface TopSeller {
  productId: string;
  productName: string;
  profit: number;
  revenue: number;
  quantitySold: number;
}

export const useSuggestionsLogic = (contextId?: string) => {
  const { data: productsData, loading: loadingProducts, error: productsError } = useQuery<{
    getAllProducts: Product[];
  }>(PRODUCTS_QUERY, {
    variables: { limit: 100 },
    fetchPolicy: 'cache-first',
  });

  const { data: metricsData, loading: loadingMetrics, error: metricsError } = useQuery<{
    getContextMetrics?: {
      topSellers: TopSeller[];
    };
  }>(GET_CONTEXT_METRICS, {
    variables: { contextId, period: 'MONTHLY' },
    fetchPolicy: 'cache-first',
  });

  const products = productsData?.getAllProducts || [];
  const topSellers = metricsData?.getContextMetrics?.topSellers || [];

  const suggestions = useMemo<Suggestion[]>(() => {
    const list: Suggestion[] = [];
    if (products.length === 0) return list;

    const soldProductIds = new Set(topSellers.map((t) => t.productId));

    const notSoldProducts = products.filter((p) => !soldProductIds.has(p._id));
    const lowRotationProducts = notSoldProducts.filter((p) => p.stock > 0).slice(0, 3);

    lowRotationProducts.forEach((p) => {
      list.push({
        type: 'low_rotation',
        productId: p._id,
        productName: p.name,
        reason: `Tienes ${p.stock} unidades en stock y no se vendió ninguna este período`,
        action: 'Considera promocionarlo o revisar el precio',
        priority: p.stock > 10 ? 'high' : 'medium',
      });
    });

    const lowMarginProducts = topSellers
      .filter((t) => {
        const margin = t.revenue > 0 ? (t.profit / t.revenue) * 100 : 0;
        return margin < 20;
      })
      .slice(0, 2);

    lowMarginProducts.forEach((t) => {
      const margin = t.revenue > 0 ? ((t.profit / t.revenue) * 100).toFixed(1) : '0';
      list.push({
        type: 'low_margin',
        productId: t.productId,
        productName: t.productName,
        reason: `Margen de solo ${margin}% - ganancia de ${formatCurrency(t.profit)}`,
        action: 'Evalúa subir el precio o buscar proveedor más económico',
        priority: 'medium',
      });
    });

    const highDemandLowStock = topSellers
      .filter((t) => {
        const product = products.find((p) => p._id === t.productId);
        return product && product.stock < 5;
      })
      .slice(0, 2);

    highDemandLowStock.forEach((t) => {
      const product = products.find((p) => p._id === t.productId);
      list.push({
        type: 'restock',
        productId: t.productId,
        productName: t.productName,
        reason: `Vendiste ${t.quantitySold} unidades y solo te quedan ${product?.stock || 0}`,
        action: '¡Reponer URGENTEMENTE para no perder ventas!',
        priority: 'high',
      });
    });

    const priorityOrder: Record<'high' | 'medium' | 'low', number> = { high: 0, medium: 1, low: 2 };
    return list.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [products, topSellers]);

  const loading = loadingProducts || loadingMetrics;
  const error = productsError || metricsError;

  return {
    suggestions,
    loading,
    error,
  };
};
