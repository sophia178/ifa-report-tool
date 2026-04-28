import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

function sectionHeading(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 120 },
  });
}

function toParagraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean)
    .map(
      (paragraph) =>
        new Paragraph({
          text: paragraph,
          spacing: { after: 120 },
        }),
    );
}

export async function buildSuitabilityReportDocx(reportText: string) {
  const normalizedText = reportText.replace(/\r/g, "").trim();
  const sections = normalizedText
    .split(/(?=^SECTION\s+\d+\s*[-—:])/im)
    .map((section) => section.trim())
    .filter(Boolean);

  const content =
    sections.length > 0
      ? sections.flatMap((section) => {
          const [headerLine, ...bodyLines] = section.split("\n");
          const body = bodyLines.join("\n").trim();

          return [
            sectionHeading(headerLine.trim().replace(/:\s*$/, "")),
            ...(body
              ? toParagraphs(body)
              : [
                  new Paragraph({
                    text: "[NO CONTENT PROVIDED]",
                    spacing: { after: 120 },
                  }),
                ]),
          ];
        })
      : toParagraphs(normalizedText);

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
          ...content,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
