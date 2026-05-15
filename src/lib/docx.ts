import {
  AlignmentType,
  Document,
  HeadingLevel,
  Header,
  PageBreak,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  ImageRun,
  WidthType,
  BorderStyle,
  ShadingType,
} from "docx";

function sectionHeading(text: string) {
  return new Paragraph({
    text: text.replace(/^#{1,6}\s+/, "").trim(),
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 120 },
  });
}

function isAllCapsHeading(line: string) {
  const normalized = line.replace(/\s+/g, " ").trim();
  const withoutNumbering = normalized.replace(/^\d{1,2}\.\s+/, "");
  if (!withoutNumbering) return false;
  if (!/[A-Z]/.test(withoutNumbering)) return false;
  if (/[a-z]/.test(withoutNumbering)) return false;
  if (withoutNumbering.length < 3) return false;
  if (withoutNumbering.length > 140) return false;
  return /^[A-Z0-9][A-Z0-9 \-&,()'/.:%]+$/.test(withoutNumbering);
}

function sanitizeText(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*/g, "")
    .trim();
}

function runsFromText(text: string) {
  const cleaned = sanitizeText(text);
  if (!cleaned) return [new TextRun({ text: "", size: 22 })];
  return [new TextRun({ text: cleaned, size: 22 })];
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

function isPipeTable(lines: string[]) {
  if (lines.length < 2) return false;
  const firstTwoHavePipes = (lines[0] || "").includes("|") && (lines[1] || "").includes("|");
  if (!firstTwoHavePipes) return false;
  return lines.every((l) => (l || "").includes("|"));
}

function splitTableRow(row: string) {
  const trimmed = row.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((c) => c.trim());
}

function buildTable(lines: string[]) {
  const hasDivider = isMarkdownTable(lines);
  const headerCells = splitTableRow(lines[0] || "");
  const bodyRows = hasDivider ? lines.slice(2).map(splitTableRow) : lines.slice(1).map(splitTableRow);
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
          shading: { type: ShadingType.CLEAR, fill: "F8FAFC", color: "auto" },
          children: [
            new Paragraph({
              children: [new TextRun({ text: sanitizeText(cell), bold: true, size: 22 })],
            }),
          ],
        })
    ),
  });

  const rows = [
    headerRow,
    ...bodyRows.map(
      (row, rowIndex) =>
        new TableRow({
          children: normalizeRow(row).map(
            (cell) =>
              new TableCell({
                width: { size: 100 / maxColumns, type: WidthType.PERCENTAGE },
                shading: {
                  type: ShadingType.CLEAR,
                  fill: rowIndex % 2 === 0 ? "FFFFFF" : "F8FAFC",
                  color: "auto",
                },
                children: [
                  new Paragraph({
                    children: runsFromText(cell),
                  }),
                ],
              })
          ),
        })
    ),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "E5E7EB" },
    },
    rows,
  });
}

function paragraphFromLine(line: string) {
  const trimmed = line.trim();
  const cleaned = sanitizeText(trimmed);

  if (isAllCapsHeading(cleaned)) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 300, after: 120 },
      children: [new TextRun({ text: cleaned, bold: true })],
    });
  }

  const numberedHeading = cleaned.match(/^\d+\.\s+(.*)$/);
  if (numberedHeading && numberedHeading[1]) {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: numberedHeading[1].trim(), bold: true })],
    });
  }

  return new Paragraph({
    spacing: { after: 120 },
    children: runsFromText(cleaned),
  });
}

function toBlocks(text: string) {
  const normalized = text.replace(/\r/g, "");
  const lines = normalized.split("\n");

  const blocks: Array<Paragraph | Table> = [];

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i] ?? "";
    const trimmed = raw.trimEnd();
    const cleaned = trimmed.trim();

    if (!cleaned) {
      blocks.push(new Paragraph({ spacing: { after: 120 } }));
      i += 1;
      continue;
    }

    if (isHorizontalRule(cleaned)) {
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
      i += 1;
      continue;
    }

    if (cleaned.includes("|")) {
      const tableLines: string[] = [];
      while (i < lines.length) {
        const candidate = (lines[i] ?? "").trim();
        if (!candidate || !candidate.includes("|")) break;
        tableLines.push(candidate);
        i += 1;
      }

      const normalizedTableLines = tableLines
        .filter((l) => l.trim() !== "")
        .map((l) => l.trimEnd());

      if (normalizedTableLines.length >= 2 && (isMarkdownTable(normalizedTableLines) || isPipeTable(normalizedTableLines))) {
        blocks.push(buildTable(normalizedTableLines));
        continue;
      }

      for (const l of normalizedTableLines) {
        blocks.push(paragraphFromLine(l));
      }
      continue;
    }

    blocks.push(paragraphFromLine(cleaned));
    i += 1;
  }

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
    clientName?: string;
  }
) {
  const normalizedText = sanitizeText(reportText);
  const hasSectionHeadings = /^SECTION\s+\d+\s*[-—:]/im.test(normalizedText);

  const content = hasSectionHeadings
    ? normalizedText
        .split(/(?=^SECTION\s+\d+\s*[-—:])/im)
        .map((section) => section.trim())
        .filter(Boolean)
        .flatMap((section) => {
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
  const clientName = meta?.clientName;
  const preparedOn = preparedAt.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  const doc = new Document({
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "DRAFT",
                    bold: true,
                    color: "D9D9D9",
                    size: 144,
                  }),
                ],
                spacing: { after: 0 },
              }),
            ],
          }),
        },
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
          ...(clientName
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `Client: ${clientName}`, italics: true, color: "666666" })],
                  spacing: { after: 120 },
                }),
              ]
            : []),
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
          new Paragraph({ children: [new PageBreak()] }),
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
