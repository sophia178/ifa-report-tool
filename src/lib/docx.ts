import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
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

export async function buildReportDocx(
  reportText: string,
  title: string,
  whiteLabel?: {
    firm_name: string;
    firm_address?: string | null;
    fca_number?: string | null;
    logo_url?: string | null;
    footer_message?: string | null;
  }
) {
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

  // Prepare header children
  const headerChildren: any[] = [];

  if (whiteLabel) {
    if (whiteLabel.logo_url) {
      try {
        const imageRes = await fetch(whiteLabel.logo_url);
        const imageBuffer = await imageRes.arrayBuffer();
        headerChildren.push(
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: { width: 100, height: 100 },
                type: "png",
              } as any),
            ],
          })
        );
      } catch (e) {
        console.error("Failed to load logo for docx", e);
      }
    }

    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: whiteLabel.firm_name, bold: true, size: 24 }),
        ],
      })
    );

    if (whiteLabel.firm_address) {
      headerChildren.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: whiteLabel.firm_address, size: 16 })],
        })
      );
    }

    if (whiteLabel.fca_number) {
      headerChildren.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: `FCA Number: ${whiteLabel.fca_number}`, size: 16 }),
          ],
        })
      );
    }
  } else {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: "Suitance Professional", bold: true, color: "C1A362" }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        children: [
          ...headerChildren,
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({
                text: title,
                bold: true,
              }),
            ],
            spacing: { before: 480, after: 240 },
          }),
          ...content,
          ...(whiteLabel?.footer_message 
            ? [
                new Paragraph({
                  spacing: { before: 480 },
                  children: [
                    new TextRun({
                      text: whiteLabel.footer_message,
                      size: 14,
                      italics: true,
                      color: "666666",
                    }),
                  ],
                })
              ]
            : []),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export async function buildSuitabilityReportDocx(
  reportText: string,
  whiteLabel?: {
    firm_name: string;
    firm_address?: string | null;
    fca_number?: string | null;
    logo_url?: string | null;
    footer_message?: string | null;
  }
) {
  return buildReportDocx(reportText, "FCA Suitability Report", whiteLabel);
}
