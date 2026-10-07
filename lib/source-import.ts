import mammoth from "mammoth";
import * as XLSX from "xlsx";

export const IMPORT_EXTENSIONS = ["docx", "pdf", "xlsx", "xls"];
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 200_000;
export class ImportError extends Error {
  constructor(message: string, public status = 422) { super(message); }
}
export async function extractSource(file: File): Promise<{title: string; text: string; warnings: string[]}> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!IMPORT_EXTENSIONS.includes(extension)) throw new ImportError("Hỗ trợ Word (.docx), PDF, Excel (.xlsx, .xls)", 400);
  if (file.size > MAX_IMPORT_BYTES) throw new ImportError("File vượt quá 10 MB", 413);
  if (!file.size) throw new ImportError("File không có nội dung");
  const buffer = Buffer.from(await file.arrayBuffer());
  let text = "";
  const warnings: string[] = [];
  let title = file.name.replace(/\.(docx|pdf|xlsx|xls)$/i, "");
  if (extension === "docx") {
    const result = await mammoth.extractRawText({buffer});
    text = result.value;
    warnings.push(...result.messages.map(message => message.message));
    title = text.split("\n").find(line => line.trim().length > 2)?.trim().slice(0, 80) || title;
  } else if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    // Supply the local worker explicitly for Vite SSR.
    const worker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
    (globalThis as typeof globalThis & {pdfjsWorker?: unknown}).pdfjsWorker = worker;
    const loading = pdfjs.getDocument({data: new Uint8Array(buffer), useSystemFonts: true});
    try {
      const pdf = await loading.promise;
      if (pdf.numPages > 200) throw new ImportError("PDF vượt quá 200 trang. Hãy chia thành các file nhỏ hơn.", 413);
      const pages: string[] = [];
      let characters = 0;
      let emptyPages = 0;
      for (let index = 1; index <= pdf.numPages; index++) {
        const page = await pdf.getPage(index);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => "str" in item ? `${item.str}${item.hasEOL ? "\n" : " "}` : "").join("").trim();
        page.cleanup();
        if (!pageText) { emptyPages++; continue; }
        const section = `[Trang ${index}]\n${pageText}`;
        characters += section.length;
        if (characters > MAX_TEXT_LENGTH) throw new ImportError("Nội dung quá dài. Hãy chia thành các file nhỏ hơn.", 413);
        pages.push(section);
      }
      text = pages.join("\n\n");
      if (!text) throw new ImportError("PDF không có văn bản đọc được. Nếu là ảnh scan, hãy OCR trước khi import.");
      if (emptyPages) warnings.push(`${emptyPages} trang không có văn bản đọc được; có thể cần OCR để lấy nội dung ảnh scan.`);
    } catch (error) {
      if (error instanceof Error && error.name === "PasswordException") throw new ImportError("PDF được bảo vệ bằng mật khẩu. Hãy mở khóa trước khi import.");
      throw error;
    } finally { await loading.destroy(); }
  } else {
    const zip = buffer[0] === 0x50 && buffer[1] === 0x4b;
    const ole = buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
    const xml = /<\?xml|<Workbook[\s>]/i.test(buffer.subarray(0, 1024).toString("utf8"));
    if (extension === "xlsx" ? !zip : !ole && !xml) throw new ImportError("File không đúng định dạng Excel. Hãy lưu lại dưới dạng .xlsx hoặc .xls.");
    const workbook = XLSX.read(buffer, {type: "buffer", cellDates: true});
    const sheets: string[] = [];
    let cells = 0;
    let characters = 0;
    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      if (!sheet["!ref"]) continue;
      const range = XLSX.utils.decode_range(sheet["!ref"]);
      cells += (range.e.r - range.s.r + 1) * (range.e.c - range.s.c + 1);
      if (cells > 100_000) throw new ImportError("Excel vượt quá 100.000 ô. Hãy tách các sheet hoặc thu gọn vùng dữ liệu.", 413);
      for (const [address, cell] of Object.entries(sheet)) {
        if (address.startsWith("!")) continue;
        const value = cell as XLSX.CellObject;
        if (value.f && value.v == null) {
          sheet[address] = {t: "s", v: `[Công thức chưa có giá trị: =${value.f}]`};
          if (!warnings.length) warnings.push("Một số công thức chưa có giá trị lưu sẵn. Hãy tính lại và lưu file trong Excel để import kết quả.");
        }
      }
      const rows = XLSX.utils.sheet_to_csv(sheet, {FS: "\t", RS: "\n", blankrows: false}).trim();
      if (!rows) continue;
      const section = `[Sheet: ${name}]\n${rows}`;
      characters += section.length;
      if (characters > MAX_TEXT_LENGTH) throw new ImportError("Nội dung quá dài. Hãy chia thành các file nhỏ hơn.", 413);
      sheets.push(section);
    }
    text = sheets.join("\n\n");
  }
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  if (!text) throw new ImportError("File không có nội dung văn bản hoặc dữ liệu đọc được");
  if (text.length > MAX_TEXT_LENGTH) throw new ImportError("Nội dung quá dài. Hãy chia thành các file nhỏ hơn.", 413);
  return {title, text, warnings};
}
