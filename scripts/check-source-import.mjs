import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import {Document, Packer, Paragraph} from "docx";

const origin = process.env.IMPORT_TEST_ORIGIN || "http://127.0.0.1:5173";
async function upload(name, bytes, status = 200, endpoint = "import-source") {
  const form = new FormData();
  form.append("file", new File([bytes], name));
  const response = await fetch(`${origin}/api/${endpoint}`, {method: "POST", body: form});
  const body = await response.text();
  let data;
  try { data = JSON.parse(body); } catch { data = {error: body}; }
  assert.equal(response.status, status, `${name}: ${JSON.stringify(data)}`);
  return data;
}
// Small PDFs generated in memory; no user documents or browser storage are touched.
function pdf(texts) {
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  const kids = [];
  for (const text of texts) {
    const page = objects.length + 1;
    kids.push(`${page} 0 R`);
    const stream = text ? `BT /F1 12 Tf 72 720 Td (${text}) Tj ET` : "";
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${page + 1} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }
  objects[1] = `<< /Type /Pages /Count ${kids.length} /Kids [${kids.join(" ")}] >>`;
  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index++) {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(body);
  body += `xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(body);
}
const workbook = XLSX.utils.book_new();
const event = XLSX.utils.aoa_to_sheet([["Sự kiện", "Khách", "Giá trị"], ["Hội nghị Savvycom", "Đặng Thị Thanh Vân", 42], ["Kết quả", "", 0]]);
event.D1 = {t: "n", f: "C2*2", v: 84};
event.D2 = {t: "n", f: "C2*3"};
event["!ref"] = "A1:D3";
XLSX.utils.book_append_sheet(workbook, event, "Sự kiện");
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Tên", "Chức danh"], ["Van Dang", "CEO"]]), "C-level");
for (const type of ["xlsx", "xls"]) {
  const result = await upload(`event.${type}`, XLSX.write(workbook, {type: "buffer", bookType: type}));
  assert.match(result.text, /\[Sheet: Sự kiện\]/);
  assert.match(result.text, /\[Sheet: C-level\]/);
  assert.match(result.text, /Đặng Thị Thanh Vân/);
  assert.match(result.text, /42/);
  assert.match(result.text, /84/);
  assert.match(result.text, /Kết quả\t\t0/);
  if (type === "xlsx") {
    assert.match(result.text, /Công thức chưa có giá trị/);
    assert.ok(result.warnings.length);
  }
}
const extracted = await upload("event.PDF", pdf(["Event recap page one", "Business outcomes page two"]));
assert.match(extracted.text, /Event recap page one/);
assert.match(extracted.text, /Business outcomes page two/);
assert.match(extracted.text, /\[Trang 2\]/);
const partial = await upload("partial.pdf", pdf(["Event recap", ""]));
assert.ok(partial.warnings.length);
const empty = await upload("scan.pdf", pdf([""]), 422);
assert.match(empty.error, /OCR/);
const word = await Packer.toBuffer(new Document({sections: [{children: [new Paragraph("Bài mẫu tiếng Việt"), new Paragraph("Nội dung nguồn sự kiện")]}]}));
assert.match((await upload("source.docx", word)).text, /Nội dung nguồn sự kiện/);
assert.match((await upload("source.docx", word, 200, "import-docx")).text, /Bài mẫu tiếng Việt/);
await upload("unsupported.txt", "text", 400);
await upload("empty.xlsx", "", 422);
await upload("broken.xlsx", "not an Excel workbook", 422);
await upload("broken.pdf", "not a PDF", 422);
await upload("oversize.pdf", new Uint8Array(10 * 1024 * 1024 + 1), 413);
console.log("PASS: PDF pages, empty/scanned PDF, XLSX/XLS multiple sheets, Unicode, numbers/formulas, Word compatibility and invalid/oversized files");
