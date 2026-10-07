import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { restoreContentFlow, type ContentFlow } from "./content-flow";

export function canExportDocx(flow: ContentFlow): boolean {
  return flow.outlineApproved && flow.vietnameseApproved && flow.englishApproved && flow.socialApproved
    && [flow.outline, flow.vietnamese, flow.english, flow.social].every(text => Boolean(text.trim()));
}

function inlineRuns(text: string): TextRun[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map(part => new TextRun({
    text: part.replace(/^\*\*|\*\*$/g, "").replace(/^\*|\*$/g, ""),
    bold: part.startsWith("**"), italics: part.startsWith("*") && !part.startsWith("**"),
  }));
}

// Article headline → Title; ## / H2 sections → Heading 1;
// ### / H3 subsections → Heading 2. Explicit Word-style labels also work.
export function newsParagraphs(text: string, caption = false): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  let titleUsed = caption;
  let pending: string[] = [];
  const flush = () => {
    if (pending.length) paragraphs.push(new Paragraph({ children: inlineRuns(pending.join(" ")), spacing: { after: 160 } }));
    pending = [];
  };
  for (const original of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = original.trim();
    if (!line) { flush(); continue; }
    const markdown = line.match(/^(#{1,6})\s+(.+)$/);
    const label = line.match(/^(Title|Heading\s*1|Heading\s*2|H[123])\s*:\s*(.+)$/i);
    const boldHeading = line.match(/^\*\*([^*]+)\*\*$/);
    if (!titleUsed || markdown || label || boldHeading) {
      flush();
      const value = markdown?.[2] || label?.[2] || boldHeading?.[1] || line;
      let heading: typeof HeadingLevel.TITLE | typeof HeadingLevel.HEADING_1 | typeof HeadingLevel.HEADING_2;
      if (!titleUsed || label?.[1].toLowerCase() === "title") { heading = HeadingLevel.TITLE; titleUsed = true; }
      else if ((markdown && markdown[1].length >= 3) || /^heading\s*2$|^h3$/i.test(label?.[1] || "")) heading = HeadingLevel.HEADING_2;
      else heading = HeadingLevel.HEADING_1;
      paragraphs.push(new Paragraph({ children: inlineRuns(value), heading, keepNext: true }));
    } else if (/^[-*•]\s+/.test(line)) {
      flush(); paragraphs.push(new Paragraph({ children: inlineRuns(line.replace(/^[-*•]\s+/, "")), bullet: { level: 0 } }));
    } else if (/^>\s?/.test(line)) {
      flush(); paragraphs.push(new Paragraph({ children: [new TextRun({ text: line.replace(/^>\s?/, ""), italics: true })], spacing: { after: 160 } }));
    } else pending.push(line);
  }
  flush();
  return paragraphs;
}

export async function buildNewsDocx(name: string, value: unknown): Promise<Uint8Array<ArrayBuffer>> {
  const flow = restoreContentFlow(value);
  if (!canExportDocx(flow)) throw new Error("Hoàn tất news và social caption trước khi xuất Word");
  const document = new Document({
    title: name, creator: "Savvycom Editorial Team",
    styles: { default: {
      document: { run: { font: "Arial", size: 22, color: "000000" }, paragraph: { spacing: { after: 160, line: 276 } } },
      title: { run: { font: "Arial", size: 36, bold: true, color: "000000" }, paragraph: { spacing: { before: 160, after: 240 }, keepNext: true } },
      heading1: { run: { font: "Arial", size: 28, bold: true, color: "000000" }, paragraph: { spacing: { before: 240, after: 120 }, keepNext: true } },
      heading2: { run: { font: "Arial", size: 24, bold: true, color: "000000" }, paragraph: { spacing: { before: 180, after: 100 }, keepNext: true } },
    } },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } }, children: [
      new Paragraph({ text: "News tiếng Việt", spacing: { after: 120 } }),
      ...newsParagraphs(flow.vietnamese),
      new Paragraph({ text: "News tiếng Anh", pageBreakBefore: true, spacing: { after: 120 } }),
      ...newsParagraphs(flow.english),
      new Paragraph({ text: "Social caption", heading: HeadingLevel.TITLE, pageBreakBefore: true }),
      ...newsParagraphs(flow.social, true),
    ] }],
  });
  return new Uint8Array(await Packer.toBuffer(document));
}
