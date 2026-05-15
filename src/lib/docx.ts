import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  ImageRun,
  WidthType,
  BorderStyle,
} from "docx";

function sectionHeading(text: string) {
  return new Paragraph({
    text: text.replace(/^#{1,6}\s+/, "").trim(),
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 120 },
  });
}

function runsFromMarkdown(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts
    .filter((p) => p !== "")
    .map((part, index) => {
      const isBold = index % 2 === 1;
      return new TextRun({ text: part, bold: isBold });
    });
}

function isHorizontalRule(line: string) {
  return /^---+$/.test(line.trim());
}

function isMarkdownTable(lines: string[]) {
  if (lines.length < 2) return false;
  const header = lines[0] || "";
  const divider = lines[1] || "";
  if (!header.includes("|")) return false;
  return /^\s*\|?\s*[:-]+[-| :]*\|?\s*$/.test(divider);
}

function splitTableRow(row: string) {
  const trimmed = row.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((c) => c.trim());
}

function buildTable(lines: string[]) {
  const headerCells = splitTableRow(lines[0] || "");
  const bodyRows = lines.slice(2).map(splitTableRow);
  const maxColumns = Math.max(
    headerCells.length,
    ...bodyRows.map((r) => r.length),
    1
  );

  const normalizeRow = (cells: string[]) => {
    const normalized = [...cells];
    while (normalized.length < maxColumns) normalized.push("");
    return normalized;
  };

  const headerRow = new TableRow({
    children: normalizeRow(headerCells).map(
      (cell) =>
        new TableCell({
          width: { size: 100 / maxColumns, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              children: [new TextRun({ text: cell.replace(/^#{1,6}\s+/, ""), bold: true })],
            }),
          ],
        })
    ),
  });

  const rows = [
    headerRow,
    ...bodyRows.map(
      (row) =>
        new TableRow({
          children: normalizeRow(row).map(
            (cell) =>
              new TableCell({
                width: { size: 100 / maxColumns, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: runsFromMarkdown(cell.replace(/^#{1,6}\s+/, "")),
                  }),
                ],
              })
          ),
        })
    ),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

function paragraphFromLine(line: string) {
  const trimmed = line.trim();

  const hashHeading = trimmed.match(/^(#{2,6})\s+(.*)$/);
  if (hashHeading) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: hashHeading[2].trim(), bold: true })],
    });
  }

  const numberedHeading = trimmed.match(/^\d+\.\s+(.*)$/);
  if (numberedHeading && numberedHeading[1]) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: numberedHeading[1].trim(), bold: true })],
    });
  }

  return new Paragraph({
    spacing: { after: 120 },
    children: runsFromMarkdown(trimmed.replace(/^#{1,6}\s+/, "")),
  });
}

function toBlocks(text: string) {
  const normalized = text.replace(/\r/g, "");
  const lines = normalized.split("\n");

  const blocks: Array<Paragraph | Table> = [];
  let buffer: string[] = [];

  const flush = () => {
    const chunk = buffer.map((l) => l.trimEnd()).filter((l) => l.trim() !== "");
    buffer = [];
    if (chunk.length === 0) return;

    if (isMarkdownTable(chunk)) {
      blocks.push(buildTable(chunk));
      return;
    }

    if (chunk.length === 1 && isHorizontalRule(chunk[0] || "")) {
      blocks.push(
        new Paragraph({
          spacing: { before: 180, after: 180 },
          border: {
            bottom: {
              color: "E5E7EB",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
        })
      );
      return;
    }

    const merged = chunk.join(" ").trim();
    if (!merged) return;
    blocks.push(paragraphFromLine(merged));
  };

  for (const line of lines) {
    if (line.trim() === "") {
      flush();
      continue;
    }
    buffer.push(line);
  }
  flush();

  return blocks;
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
  },
  meta?: {
    preparedBy?: string;
    preparedAt?: Date;
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
            ...(body ? toBlocks(body) : [new Paragraph({ text: "[NO CONTENT PROVIDED]", spacing: { after: 120 } })]),
          ];
        })
      : toBlocks(normalizedText);

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

  const preparedAt = meta?.preparedAt ?? new Date();
  const preparedBy = meta?.preparedBy;
  const preparedOn = preparedAt.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

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
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Prepared on: ${preparedOn}`, italics: true, color: "666666" })],
            spacing: { after: 120 },
          }),
          ...(preparedBy
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `Prepared by: ${preparedBy}`, italics: true, color: "666666" })],
                  spacing: { after: 240 },
                }),
              ]
            : [
                new Paragraph({
                  spacing: { after: 240 },
                }),
              ]),
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
