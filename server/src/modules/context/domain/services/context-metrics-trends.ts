import { OrderStatus, PaymentStatus } from '../../../../../../shared-domain/src/order/order.entity.js';
import { IProduct } from '../../../../../../shared-domain/src/product/product.entity.js';
import { IOrder } from '../../../../../../shared-domain/src/order/order.entity.js';
import { IExpense } from '../../../../../../shared-domain/src/expense/expense.entity.js';
import { IAccount } from '../../../../../../shared-domain/src/financial/account.entity.js';
import { AccountDistribution } from './context-metrics.types.js';
import { ContextMetricsConstants } from './context-metrics.constants.js';

export function calculateTrends(params: {
  period: string | undefined;
  contextExpenses: IExpense[];
  orders: IOrder[];
  contextProductIds: Set<string>;
  productMap: Map<string, IProduct>;
}): { revenueTrend: number | null; profitTrend: number | null; expenseTrend: number | null } {
  const { period, contextExpenses, orders, contextProductIds, productMap } = params;

  const pNorm = period?.toLowerCase();
  const oneDay = ContextMetricsConstants.ONE_DAY_MS;
  const nowMs = Date.now();
  let currentStartMs = 0;
  let currentEndMs = nowMs;
  let previousStartMs = 0;
  let previousEndMs = 0;
  let hasTrends = false;

  if (pNorm === 'daily') {
    currentStartMs = nowMs - oneDay;
    previousEndMs = currentStartMs;
    previousStartMs = previousEndMs - oneDay;
    hasTrends = true;
  } else if (pNorm === 'weekly') {
    const sevenDays = ContextMetricsConstants.WEEKLY_WINDOW_DAYS * oneDay;
    currentStartMs = nowMs - sevenDays;
    previousEndMs = currentStartMs;
    previousStartMs = previousEndMs - sevenDays;
    hasTrends = true;
  } else if (pNorm === 'monthly') {
    const thirtyDays = ContextMetricsConstants.MONTHLY_WINDOW_DAYS * oneDay;
    currentStartMs = nowMs - thirtyDays;
    previousEndMs = currentStartMs;
    previousStartMs = previousEndMs - thirtyDays;
    hasTrends = true;
  }

  let currentRevenue = 0;
  let currentCOGS = 0;
  let previousRevenue = 0;
  let previousCOGS = 0;
  let currentExpense = 0;
  let previousExpense = 0;

  if (hasTrends) {
    for (const e of contextExpenses) {
      if (!e.createdAt) continue;
      const expenseDateMs = new Date(e.createdAt.toString()).getTime();
      const amt = Number(e.amount) || 0;
      if (expenseDateMs >= currentStartMs && expenseDateMs <= currentEndMs) {
        currentExpense += amt;
      } else if (expenseDateMs >= previousStartMs && expenseDateMs <= previousEndMs) {
        previousExpense += amt;
      }
    }

    for (const order of orders) {
      if (order.status === OrderStatus.CANCELLED || order.paymentStatus !== PaymentStatus.PAID) {
        continue;
      }
      const orderItemsInContext = order.items.filter((item) => contextProductIds.has(item.productId.toString()));
      if (orderItemsInContext.length === 0) continue;

      if (!order.createdAt) continue;
      const orderDateMs = new Date(order.createdAt.toString()).getTime();

      const isCurrent = orderDateMs >= currentStartMs && orderDateMs <= currentEndMs;
      const isPrevious = orderDateMs >= previousStartMs && orderDateMs <= previousEndMs;

      if (!isCurrent && !isPrevious) continue;

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
      }

      if (isCurrent) {
        currentRevenue += orderRevenue;
        currentCOGS += orderCost;
      } else {
        previousRevenue += orderRevenue;
        previousCOGS += orderCost;
      }
    }
  }

  const currentProfit = currentRevenue - currentCOGS - currentExpense;
  const previousProfit = previousRevenue - previousCOGS - previousExpense;

  const calculateTrend = (current: number, previous: number): number => {
    if (previous === 0) {
      if (current > 0) return 100.0;
      if (current < 0) return -100.0;
      return 0.0;
    }
    return Number((((current - previous) / previous) * 100).toFixed(2));
  };

  return {
    revenueTrend: hasTrends ? calculateTrend(currentRevenue, previousRevenue) : null,
    profitTrend: hasTrends ? calculateTrend(currentProfit, previousProfit) : null,
    expenseTrend: hasTrends ? calculateTrend(currentExpense, previousExpense) : null,
  };
}

export function calculateAccountDistribution(
  completedOrders: IOrder[],
  contextProductIds: Set<string>,
  accounts: IAccount[],
): { accountDistribution: AccountDistribution[]; favoriteAccountName: string | null } {
  const accountMap = new Map(accounts.map((acc) => [acc.id?.toString(), acc]));
  const accountVolumeMap = new Map<string, number>();

  for (const order of completedOrders) {
    const orderItemsInContext = order.items.filter((item) => contextProductIds.has(item.productId.toString()));
    if (orderItemsInContext.length === 0) {
      continue;
    }

    if (order.payments) {
      for (const payment of order.payments) {
        const accIdStr = payment.accountId.toString();
        const amount = Number(payment.amount);
        const exRate = Number(payment.exchangeRate) || 1.0;
        const usdAmount = exRate > 0 ? amount / exRate : 0;

        const currentVol = accountVolumeMap.get(accIdStr) || 0;
        accountVolumeMap.set(accIdStr, currentVol + usdAmount);
      }
    }
  }

  let totalPaymentVolumeUsd = 0;
  for (const vol of accountVolumeMap.values()) {
    totalPaymentVolumeUsd += vol;
  }

  const accountDistribution: AccountDistribution[] = [];

  for (const [accIdStr, vol] of accountVolumeMap.entries()) {
    const acc = accountMap.get(accIdStr);
    const accountName = acc?.name.toString() || 'Unknown Account';
    const currency = acc?.currency.toString() || 'USD';

    const percentage = totalPaymentVolumeUsd > 0 ? (vol / totalPaymentVolumeUsd) * 100 : 0;

    accountDistribution.push({
      accountId: accIdStr,
      accountName,
      currency,
      totalReceivedUsd: Number(vol.toFixed(2)),
      percentage: Number(percentage.toFixed(2)),
    });
  }

  accountDistribution.sort((a, b) => b.totalReceivedUsd - a.totalReceivedUsd);

  const favoriteAccountName = accountDistribution.length > 0 ? accountDistribution[0].accountName : null;

  return { accountDistribution, favoriteAccountName };
}
