import { getISOWeekKey } from '../../../../../../shared-domain/src/shared/utils/date-utils.js';
import { DateTimeVO } from '../../../../../../shared-domain/src/shared/value-objects/date-time.vo.js';
import { OrderStatus, PaymentStatus, DeliveryStatus } from '../../../../../../shared-domain/src/order/order.entity.js';
import { IProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import { IOrder } from '../../../../../../shared-domain/src/order/order.entity.js';
import { IExpense } from '../../../../../../shared-domain/src/expense/expense.entity.js';
import { PeriodMetric, TopSellerMetric } from './context-metrics.types.js';

export type PeriodData = { revenue: number; profit: number; salesCount: number };

export function filterExpensesByContextAndDates(
  expenses: IExpense[],
  contextId: string | undefined,
  startDate: string | undefined,
  endDate: string | undefined,
): { contextExpenses: IExpense[]; totalExpenses: number } {
  const contextExpenses = contextId ? expenses.filter((e) => e.contextId?.toString() === contextId) : expenses;

  let filteredExpenses = contextExpenses;
  if (startDate) {
    const startVo = DateTimeVO.create(startDate);
    filteredExpenses = filteredExpenses.filter((e) => {
      if (!e.createdAt) return false;
      const expenseDateVo = DateTimeVO.create(e.createdAt);
      return expenseDateVo >= startVo;
    });
  }
  if (endDate) {
    const endVo = DateTimeVO.create(endDate);
    filteredExpenses = filteredExpenses.filter((e) => {
      if (!e.createdAt) return false;
      const expenseDateVo = DateTimeVO.create(e.createdAt);
      return expenseDateVo <= endVo;
    });
  }

  let totalExpenses = 0;
  for (const e of filteredExpenses) {
    totalExpenses += Number(e.amount);
  }

  return { contextExpenses, totalExpenses };
}

export function aggregateStockMetrics(
  products: IProduct[],
  contextId: string | undefined,
): {
  contextProductIds: Set<string>;
  productMap: Map<string, IProduct>;
  totalStock: number;
  investedCapital: number;
  potentialRevenue: number;
  potentialMargin: number;
} {
  const contextProducts = contextId ? products.filter((p) => p.contextId?.toString() === contextId) : products;

  const contextProductIds = new Set(contextProducts.map((p) => p.id?.toString()).filter(Boolean) as string[]);
  const productMap = new Map(contextProducts.map((p) => [p.id?.toString(), p]));

  let totalStock = 0;
  let investedCapital = 0;
  let potentialRevenue = 0;

  for (const p of contextProducts) {
    const stockVal = p.stock;
    const pPriceVal = p.purchasePrice;
    const sPriceVal = p.sellingPrice;

    totalStock += stockVal;
    investedCapital += stockVal * pPriceVal;
    potentialRevenue += stockVal * sPriceVal;
  }

  const potentialMargin = potentialRevenue - investedCapital;

  return {
    contextProductIds,
    productMap,
    totalStock,
    investedCapital,
    potentialRevenue,
    potentialMargin,
  };
}

export function aggregateOrderPeriodsAndTopSellers(
  orders: IOrder[],
  contextProductIds: Set<string>,
  productMap: Map<string, IProduct>,
  startDate: string | undefined,
  endDate: string | undefined,
): {
  completedOrders: IOrder[];
  dailyMap: Map<string, PeriodData>;
  weeklyMap: Map<string, PeriodData>;
  monthlyMap: Map<string, PeriodData>;
  quarterlyMap: Map<string, PeriodData>;
  semestralMap: Map<string, PeriodData>;
  annualMap: Map<string, PeriodData>;
  topSellers: TopSellerMetric[];
  totalRevenue: number;
  totalCOGS: number;
} {
  let completedOrders = orders.filter(
    (o) => o.status !== OrderStatus.CANCELLED && o.paymentStatus === PaymentStatus.PAID,
  );

  if (startDate) {
    const startVo = DateTimeVO.create(startDate);
    completedOrders = completedOrders.filter((o) => {
      if (!o.createdAt) return false;
      const orderDateVo = DateTimeVO.create(o.createdAt);
      return orderDateVo >= startVo;
    });
  }
  if (endDate) {
    const endVo = DateTimeVO.create(endDate);
    completedOrders = completedOrders.filter((o) => {
      if (!o.createdAt) return false;
      const orderDateVo = DateTimeVO.create(o.createdAt);
      return orderDateVo <= endVo;
    });
  }

  const dailyMap = new Map<string, PeriodData>();
  const weeklyMap = new Map<string, PeriodData>();
  const monthlyMap = new Map<string, PeriodData>();
  const quarterlyMap = new Map<string, PeriodData>();
  const semestralMap = new Map<string, PeriodData>();
  const annualMap = new Map<string, PeriodData>();

  const topSellersMap = new Map<
    string,
    {
      productId: string;
      productName: string;
      quantitySold: number;
      revenue: number;
      profit: number;
    }
  >();

  let totalRevenue = 0;
  let totalCOGS = 0;

  const addToPeriodMap = (map: Map<string, PeriodData>, key: string, orderRevenue: number, orderProfit: number) => {
    const existing = map.get(key);
    if (existing) {
      existing.revenue += orderRevenue;
      existing.profit += orderProfit;
      existing.salesCount += 1;
    } else {
      map.set(key, {
        revenue: orderRevenue,
        profit: orderProfit,
        salesCount: 1,
      });
    }
  };

  for (const order of completedOrders) {
    const orderItemsInContext = order.items.filter((item) => contextProductIds.has(item.productId.toString()));
    if (orderItemsInContext.length === 0) {
      continue;
    }

    let orderRevenue = 0;
    let orderCost = 0;

    for (const item of orderItemsInContext) {
      const qty = item.quantity;
      const sPrice = item.sellingPriceAtSale;
      let pPrice: number = item.purchasePriceAtSale;
      if (!pPrice || pPrice <= 0.01) {
        const catalogProd = productMap.get(item.productId.toString());
        pPrice = (catalogProd?.purchasePrice as number) || 0;
      }

      const rev = qty * sPrice;
      const cost = qty * pPrice;

      orderRevenue += rev;
      orderCost += cost;

      const pIdStr = item.productId.toString();
      const existingTop = topSellersMap.get(pIdStr);
      const prodName = productMap.get(pIdStr)?.name.toString() || 'Unknown Product';

      const itemProfit = rev - cost;
      if (existingTop) {
        existingTop.quantitySold += qty;
        existingTop.revenue += rev;
        existingTop.profit += itemProfit;
      } else {
        topSellersMap.set(pIdStr, {
          productId: pIdStr,
          productName: prodName,
          quantitySold: qty,
          revenue: rev,
          profit: itemProfit,
        });
      }
    }

    const orderProfit = orderRevenue - orderCost;
    totalRevenue += orderRevenue;
    totalCOGS += orderCost;

    const localStr = DateTimeVO.create(order.createdAt);
    const year = localStr.substring(0, 4);
    const month = localStr.substring(5, 7);
    const day = localStr.substring(8, 10);

    const dailyKey = `${year}-${month}-${day}`;
    const weeklyKey = getISOWeekKey(year, month, day);
    const monthlyKey = `${year}-${month}`;
    const quarterlyKey = `${year}-Q${Math.ceil(parseInt(month, 10) / 3)}`;
    const semestralKey = `${year}-S${parseInt(month, 10) <= 6 ? 1 : 2}`;
    const annualKey = year;

    addToPeriodMap(dailyMap, dailyKey, orderRevenue, orderProfit);
    addToPeriodMap(weeklyMap, weeklyKey, orderRevenue, orderProfit);
    addToPeriodMap(monthlyMap, monthlyKey, orderRevenue, orderProfit);
    addToPeriodMap(quarterlyMap, quarterlyKey, orderRevenue, orderProfit);
    addToPeriodMap(semestralMap, semestralKey, orderRevenue, orderProfit);
    addToPeriodMap(annualMap, annualKey, orderRevenue, orderProfit);
  }

  const topSellers = Array.from(topSellersMap.values())
    .map((ts) => ({
      ...ts,
      quantitySold: Number(ts.quantitySold.toFixed(4)),
      revenue: Number(ts.revenue.toFixed(2)),
      profit: Number(ts.profit.toFixed(2)),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    completedOrders,
    dailyMap,
    weeklyMap,
    monthlyMap,
    quarterlyMap,
    semestralMap,
    annualMap,
    topSellers,
    totalRevenue,
    totalCOGS,
  };
}

export function mapToSortedArray(map: Map<string, PeriodData>): PeriodMetric[] {
  return Array.from(map.entries())
    .map(([pKey, data]) => ({
      period: pKey,
      revenue: Number(data.revenue.toFixed(2)),
      profit: Number(data.profit.toFixed(2)),
      salesCount: data.salesCount,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}
