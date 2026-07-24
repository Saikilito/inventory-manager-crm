import PDFDocument from "pdfkit";
import { IPdfReportService } from "../../application/services/pdf-report-service.interface.js";
import { ContextMetrics } from "../../application/use-cases/get-context-metrics.js";
import { DateTimeVO } from "../../../../../../shared-domain/src/shared/value-objects/date-time.vo.js";

export const makePdfReportService = (): IPdfReportService => {
  return {
    async generateContextReport(
      metrics: ContextMetrics,
      periodType: string,
    ): Promise<Buffer> {
      return new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument({ size: "LETTER", margin: 50 });
          const chunks: Buffer[] = [];

          doc.on("data", (chunk) => chunks.push(chunk));
          doc.on("end", () => resolve(Buffer.concat(chunks)));
          doc.on("error", (err) => reject(err));

          const nowLocalStr = DateTimeVO.create();
          const timestamp = DateTimeVO.format(
            nowLocalStr,
            "YYYY-MM-DD HH:mm:ss ZZ",
          );

          const primaryColor = "#1e293b"; // Slate 800
          const secondaryColor = "#475569"; // Slate 600
          const accentGreen = "#15803d"; // Green 700
          const textDark = "#334155"; // Slate 700
          const borderLight = "#e2e8f0"; // Slate 200
          const bgLight = "#f8fafc"; // Slate 50

          doc
            .fillColor(primaryColor)
            .font("Helvetica-Bold")
            .fontSize(20)
            .text("INVENTORY & PERFORMANCE REPORT", 50, 50);

          doc
            .fontSize(9)
            .font("Helvetica")
            .fillColor(secondaryColor)
            .text(`Generated (Caracas Time): ${timestamp}`, 50, 75);

          doc
            .moveTo(50, 95)
            .lineTo(562, 95)
            .strokeColor(borderLight)
            .lineWidth(1)
            .stroke();

          doc
            .fillColor(primaryColor)
            .font("Helvetica-Bold")
            .fontSize(12)
            .text("STATIC CATALOG METRICS", 50, 115);

          doc
            .roundedRect(50, 135, 150, 65, 4)
            .fillAndStroke(bgLight, borderLight);
          doc
            .fillColor(secondaryColor)
            .font("Helvetica")
            .fontSize(8)
            .text("INVESTED CAPITAL", 60, 145);
          doc
            .fillColor(primaryColor)
            .font("Helvetica-Bold")
            .fontSize(13)
            .text(
              `$${metrics.investedCapital.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              60,
              160,
            );
          doc
            .fillColor(secondaryColor)
            .font("Helvetica")
            .fontSize(8)
            .text(
              `Total Stock: ${metrics.totalStock.toLocaleString("en-US", { maximumFractionDigits: 4 })}`,
              60,
              180,
            );

          doc
            .roundedRect(218, 135, 150, 65, 4)
            .fillAndStroke(bgLight, borderLight);
          doc
            .fillColor(secondaryColor)
            .font("Helvetica")
            .fontSize(8)
            .text("PROJECTED REVENUE", 228, 145);
          doc
            .fillColor(primaryColor)
            .font("Helvetica-Bold")
            .fontSize(13)
            .text(
              `$${metrics.potentialRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              228,
              160,
            );

          doc
            .roundedRect(386, 135, 176, 65, 4)
            .fillAndStroke(bgLight, borderLight);
          doc
            .fillColor(secondaryColor)
            .font("Helvetica")
            .fontSize(8)
            .text("PROJECTED GROSS MARGIN", 396, 145);

          const marginColor =
            metrics.potentialMargin >= 0 ? accentGreen : "#b91c1c";
          const marginPercent =
            metrics.potentialRevenue > 0
              ? (metrics.potentialMargin / metrics.potentialRevenue) * 100
              : 0;

          doc
            .fillColor(marginColor)
            .font("Helvetica-Bold")
            .fontSize(13)
            .text(
              `$${metrics.potentialMargin.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              396,
              160,
            );
          doc
            .fillColor(secondaryColor)
            .font("Helvetica-Oblique")
            .fontSize(8)
            .text(`Est. Margin: ${marginPercent.toFixed(2)}%`, 396, 180);

          const periodTypeUpper = (periodType || 'MONTHLY').toUpperCase();
          let periods = metrics.periods.monthly;
          let periodLabel = "Monthly";

          if (periodTypeUpper === "DAILY") {
            periods = metrics.periods.daily;
            periodLabel = "Daily";
          } else if (periodTypeUpper === "WEEKLY") {
            periods = metrics.periods.weekly;
            periodLabel = "Weekly";
          } else if (periodTypeUpper === "QUARTERLY") {
            periods = metrics.periods.quarterly;
            periodLabel = "Quarterly";
          } else if (
            periodTypeUpper === "SEMESTRALLY" ||
            periodTypeUpper === "SEMESTRAL"
          ) {
            periods = metrics.periods.semestral;
            periodLabel = "Semestral";
          } else if (
            periodTypeUpper === "ANNUALLY" ||
            periodTypeUpper === "ANNUAL"
          ) {
            periods = metrics.periods.annual;
            periodLabel = "Annual";
          }

          let currentY = 225;
          doc
            .fillColor(primaryColor)
            .font("Helvetica-Bold")
            .fontSize(12)
            .text(
              `HISTORICAL SALES SUMMARY (${(periodLabel || 'MONTHLY').toUpperCase()})`,
              50,
              currentY,
            );

          currentY += 20;

          doc.fillColor(secondaryColor).font("Helvetica-Bold").fontSize(8);
          doc.text("Period", 50, currentY, { width: 100, align: "left" });
          doc.text("Revenue", 170, currentY, { width: 100, align: "right" });
          doc.text("Historical Profit", 290, currentY, {
            width: 100,
            align: "right",
          });
          doc.text("Profit %", 410, currentY, { width: 70, align: "right" });
          doc.text("Sales Count", 500, currentY, { width: 62, align: "right" });

          currentY += 12;
          doc
            .moveTo(50, currentY)
            .lineTo(562, currentY)
            .strokeColor(primaryColor)
            .lineWidth(1)
            .stroke();

          currentY += 4;

          doc.font("Helvetica").fontSize(8).fillColor(textDark);

          if (periods.length === 0) {
            doc
              .font("Helvetica-Oblique")
              .text(
                "No completed sales found for the selected period.",
                50,
                currentY + 10,
              );
            currentY += 25;
          } else {
            periods.forEach((p, idx) => {
              if (currentY > 700) {
                doc.addPage();
                currentY = 50;
              }

              if (idx % 2 === 0) {
                doc
                  .rect(50, currentY - 2, 512, 14)
                  .fillColor("#f1f5f9") // Slate 100
                  .fill();
              }

              const profitPct =
                p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;

              doc
                .fillColor(textDark)
                .text(p.period, 50, currentY, { width: 100, align: "left" })
                .text(
                  `$${p.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  170,
                  currentY,
                  { width: 100, align: "right" },
                )
                .text(
                  `$${p.profit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  290,
                  currentY,
                  { width: 100, align: "right" },
                )
                .text(`${profitPct.toFixed(1)}%`, 410, currentY, {
                  width: 70,
                  align: "right",
                })
                .text(String(p.salesCount), 500, currentY, {
                  width: 62,
                  align: "right",
                });

              currentY += 14;
            });
          }

          currentY += 25;
          if (currentY > 620) {
            doc.addPage();
            currentY = 50;
          }

          doc
            .fillColor(primaryColor)
            .font("Helvetica-Bold")
            .fontSize(12)
            .text("TOP SELLING ITEMS IN CONTEXT", 50, currentY);

          currentY += 20;

          doc.fillColor(secondaryColor).font("Helvetica-Bold").fontSize(8);
          doc.text("Product ID", 50, currentY, { width: 150, align: "left" });
          doc.text("Product Name", 180, currentY, {
            width: 180,
            align: "left",
          });
          doc.text("Qty Sold", 370, currentY, { width: 90, align: "right" });
          doc.text("Revenue Generated", 470, currentY, {
            width: 92,
            align: "right",
          });

          currentY += 12;
          doc
            .moveTo(50, currentY)
            .lineTo(562, currentY)
            .strokeColor(primaryColor)
            .lineWidth(1)
            .stroke();

          currentY += 4;

          doc.font("Helvetica").fontSize(8).fillColor(textDark);

          if (metrics.topSellers.length === 0) {
            doc
              .font("Helvetica-Oblique")
              .text("No top selling products found.", 50, currentY + 10);
          } else {
            metrics.topSellers.forEach((ts, idx) => {
              if (currentY > 720) {
                doc.addPage();
                currentY = 50;
              }

              if (idx % 2 === 0) {
                doc
                  .rect(50, currentY - 2, 512, 14)
                  .fillColor("#f1f5f9")
                  .fill();
              }

              doc
                .fillColor(textDark)
                .text(ts.productId, 50, currentY, { width: 150, align: "left" })
                .text(ts.productName, 180, currentY, {
                  width: 180,
                  align: "left",
                })
                .text(
                  ts.quantitySold.toLocaleString("en-US", {
                    maximumFractionDigits: 4,
                  }),
                  370,
                  currentY,
                  { width: 90, align: "right" },
                )
                .text(
                  `$${ts.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  470,
                  currentY,
                  { width: 92, align: "right" },
                );

              currentY += 14;
            });
          }

          doc.end();
        } catch (err) {
          reject(err);
        }
      });
    },
  };
};
