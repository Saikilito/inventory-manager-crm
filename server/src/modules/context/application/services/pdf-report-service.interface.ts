import { ContextMetrics } from '../use-cases/get-context-metrics.js';

export interface IPdfReportService {
  generateContextReport(metrics: ContextMetrics, periodType: string): Promise<Buffer>;
}
