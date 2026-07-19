import { describe, it, expect } from 'vitest';
import { makeGetContextMetrics } from '../get-context-metrics.js';
import { makeGeneratePdfReport } from '../generate-pdf-report.js';
import {
  CONTEXT_ID,
  PRODUCT_1_ID,
  mockProductRepository,
  mockOrderRepository,
  mockContextRepository,
  mockExpenseRepository,
  mockAccountRepository,
  mockPdfReportService,
} from './context-test-helpers.js';

describe('Reporting & PDF Engine (Slice 6 Tests)', () => {
  it('should compute static and dynamic metrics for a specific contextId correctly', async () => {
    const getContextMetrics = makeGetContextMetrics(
      mockProductRepository,
      mockOrderRepository,
      mockContextRepository,
      mockExpenseRepository,
      mockAccountRepository
    );

    const result = await getContextMetrics({ contextId: CONTEXT_ID });
    if (result.isFailure) {
      console.log('ERROR:', result.getError());
    }
    expect(result.isFailure).toBe(false);

    const metrics = result.getValue();

    // Verify Static Inventory Metrics (only CONTEXT_ID products: Coca Cola & Orange Juice)
    expect(metrics.totalStock).toBe(15);
    expect(metrics.investedCapital).toBe(25);
    expect(metrics.potentialRevenue).toBe(42.5);
    expect(metrics.potentialMargin).toBe(17.5);

    // Verify newly added financial fields
    expect(metrics.totalCOGS).toBe(9.5);
    expect(metrics.netProfit).toBe(6.5);
    expect(metrics.accountDistribution.length).toBe(2);
    expect(metrics.accountDistribution[0].accountId).toBe('110e8400-e29b-41d4-a716-44665544acc1');
    expect(metrics.accountDistribution[0].totalReceivedUsd).toBe(15);
    expect(metrics.accountDistribution[1].accountId).toBe('110e8400-e29b-41d4-a716-44665544acc2');
    expect(metrics.accountDistribution[1].totalReceivedUsd).toBe(2);
    expect(metrics.favoriteAccountName).toBe('Banesco');

    expect(metrics.periods.monthly.length).toBe(2);

    const juneMonthly = metrics.periods.monthly.find(m => m.period === '2026-06');
    const julyMonthly = metrics.periods.monthly.find(m => m.period === '2026-07');

    expect(juneMonthly).toBeDefined();
    expect(juneMonthly!.revenue).toBe(11.00);
    expect(juneMonthly!.profit).toBe(4.50);
    expect(juneMonthly!.salesCount).toBe(1);

    expect(julyMonthly).toBeDefined();
    expect(julyMonthly!.revenue).toBe(5.00);
    expect(julyMonthly!.profit).toBe(2.00);
    expect(julyMonthly!.salesCount).toBe(1);

    // Weekly verification
    expect(metrics.periods.weekly.length).toBe(2);
    expect(metrics.periods.weekly.some(w => w.period === '2026-W25')).toBe(true);
    expect(metrics.periods.weekly.some(w => w.period === '2026-W30')).toBe(true);

    // Top Sellers
    expect(metrics.topSellers.length).toBe(2);
    expect(metrics.topSellers[0].productId).toBe(PRODUCT_1_ID);
    expect(metrics.topSellers[0].quantitySold).toBe(5);
    expect(metrics.topSellers[0].revenue).toBe(12.50);
  });

  it('should filter metrics and expenses by startDate and endDate correctly', async () => {
    const getContextMetrics = makeGetContextMetrics(
      mockProductRepository,
      mockOrderRepository,
      mockContextRepository,
      mockExpenseRepository,
      mockAccountRepository
    );

    // Filter only June (2026-06-01 to 2026-06-30)
    const result = await getContextMetrics({
      contextId: CONTEXT_ID,
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z',
    });

    expect(result.isFailure).toBe(false);
    const metrics = result.getValue();

    // In June, we have only 1 completed order with revenue of 11.00 and profit of 4.50
    expect(metrics.totalRevenue).toBe(11.00);
    expect(metrics.periods.monthly.length).toBe(1);
    expect(metrics.periods.monthly[0].period).toBe('2026-06');
    expect(metrics.periods.monthly[0].revenue).toBe(11.00);
    expect(metrics.periods.monthly[0].profit).toBe(4.50);

    // June should not see July's order (which has revenue 5.00)
    expect(metrics.periods.monthly.some(m => m.period === '2026-07')).toBe(false);
  });

  it('should compute metrics for the General Context (no contextId provided) correctly across all products', async () => {
    const getContextMetrics = makeGetContextMetrics(
      mockProductRepository,
      mockOrderRepository,
      mockContextRepository,
      mockExpenseRepository,
      mockAccountRepository
    );

    const result = await getContextMetrics({});
    if (result.isFailure) {
      console.log('ERROR General Context:', result.getError());
    }
    expect(result.isFailure).toBe(false);

    const metrics = result.getValue();

    expect(metrics.totalStock).toBe(17);
    expect(metrics.investedCapital).toBe(65);
    expect(metrics.potentialRevenue).toBe(122.5);
    expect(metrics.potentialMargin).toBe(57.5);
  });

  it('should fail when contextId is provided but not found', async () => {
    const getContextMetrics = makeGetContextMetrics(
      mockProductRepository,
      mockOrderRepository,
      mockContextRepository,
      mockExpenseRepository,
      mockAccountRepository
    );

    const result = await getContextMetrics({ contextId: '990e8400-e29b-41d4-a716-446655440099' });
    expect(result.isFailure).toBe(true);
    expect(result.getError().message).toContain('not found');
  });

  it('should execute the generatePdfReport use case correctly and return base64 string', async () => {
    const getContextMetrics = makeGetContextMetrics(
      mockProductRepository,
      mockOrderRepository,
      mockContextRepository,
      mockExpenseRepository,
      mockAccountRepository
    );
    const generatePdfReport = makeGeneratePdfReport(getContextMetrics, mockPdfReportService);

    const result = await generatePdfReport({ contextId: CONTEXT_ID, periodType: 'MONTHLY' });
    if (result.isFailure) {
      console.log('ERROR generatePdfReport:', result.getError());
    }
    expect(result.isFailure).toBe(false);
    
    const base64 = result.getValue();
    expect(typeof base64).toBe('string');
    expect(base64).toBe('UERGX0RVTU1ZX0RBVEE=');
  });
});
