import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { DomainError } from "../../../../../../shared-domain/src/shared/errors.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { ResultComposer } from "../../../../../../shared-domain/src/shared/result-composer.js";
import { getErrorMessage } from "../../../../../../shared-domain/src/shared/error-utils.js";
import { GetContextMetrics } from "./get-context-metrics.js";
import { IPdfReportService } from "../services/pdf-report-service.interface.js";
import { doTryResult } from "../../../../../../shared-domain/src/shared/do-try-result.js";

export interface GeneratePdfReportInput {
  contextId?: string;
  periodType: string;
}

export type GeneratePdfReport = UseCase<
  GeneratePdfReportInput,
  string,
  DomainError
>;

export const makeGeneratePdfReport = (
  getContextMetrics: GetContextMetrics,
  pdfReportService: IPdfReportService,
): GeneratePdfReport => {
  return async (input: GeneratePdfReportInput) => {
    const composerResult = await ResultComposer.start()
      .useResult("metrics", () =>
        getContextMetrics({ contextId: input.contextId }),
      )
      .useResult("pdfBuffer", async ({ metrics }) =>
        doTryResult(
          async () =>
            pdfReportService.generateContextReport(metrics, input.periodType),

          (err: Error) =>
            new DomainError(
              `Failed to generate PDF report: ${getErrorMessage(err)}`,
            ),
        ),
      )
      .run();

    if (composerResult.isFailure) {
      return Result.fail(composerResult.getError());
    }

    const { pdfBuffer } = composerResult.getValue();
    const base64 = pdfBuffer.toString("base64");
    return Result.ok(base64);
  };
};
