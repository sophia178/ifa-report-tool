import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

import type { SuitabilityReport } from "@/types/report";

function sectionHeading(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 120 },
  });
}

function bulletItems(items: string[]) {
  return items.map(
    (item) =>
      new Paragraph({
        text: item,
        bullet: { level: 0 },
        spacing: { after: 80 },
      }),
  );
}

export async function buildSuitabilityReportDocx(report: SuitabilityReport) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({
                text: "FCA Suitability Report",
                bold: true,
              }),
            ],
            spacing: { after: 240 },
          }),
          sectionHeading("Client Details"),
          ...bulletItems([
            `Client: ${report.clientDetails.fullName}`,
            `Email: ${report.clientDetails.email}`,
            `Date of birth: ${report.clientDetails.dateOfBirth || "Not provided"}`,
            `Adviser: ${report.clientDetails.adviserName}`,
            `Firm: ${report.clientDetails.adviserFirm}`,
            `Meeting date: ${report.clientDetails.meetingDate}`,
          ]),
          new Paragraph({
            text: "Objectives",
            heading: HeadingLevel.HEADING_2,
          }),
          ...bulletItems(report.clientDetails.objectives),
          sectionHeading("Suitability Summary"),
          new Paragraph({
            text: report.suitabilitySummary,
            spacing: { after: 120 },
          }),
          sectionHeading("Attitude to Risk Assessment"),
          new Paragraph({
            text: `${report.attitudeToRisk.riskLevel}: ${report.attitudeToRisk.summary}`,
            spacing: { after: 120 },
          }),
          ...bulletItems(report.attitudeToRisk.rationale),
          sectionHeading("Capacity for Loss Assessment"),
          new Paragraph({
            text: `${report.capacityForLoss.capacityLevel}: ${report.capacityForLoss.summary}`,
            spacing: { after: 120 },
          }),
          ...bulletItems(report.capacityForLoss.rationale),
          sectionHeading("Recommended Products"),
          ...report.recommendedProducts.flatMap((product) => [
            new Paragraph({
              text: `${product.name} (${product.type})`,
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: product.justification,
              spacing: { after: 120 },
            }),
            new Paragraph({
              text: "Key risks",
              spacing: { after: 60 },
            }),
            ...bulletItems(product.keyRisks),
          ]),
          sectionHeading("Charges Disclosure"),
          ...bulletItems([
            `Initial charges: ${report.chargesDisclosure.initialCharges}`,
            `Ongoing adviser charges: ${report.chargesDisclosure.ongoingCharges}`,
            `Product charges: ${report.chargesDisclosure.productCharges}`,
            `Platform charges: ${report.chargesDisclosure.platformCharges}`,
          ]),
          sectionHeading("Compliance Notes"),
          ...bulletItems(report.complianceNotes),
          sectionHeading("Next Review Date"),
          new Paragraph({
            text: report.nextReviewDate,
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
