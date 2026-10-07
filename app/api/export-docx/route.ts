import { buildNewsDocx } from "@/lib/news-docx";

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 500_000) return Response.json({ error: "Nội dung quá lớn để xuất Word" }, { status: 413 });
    const body = JSON.parse(raw) as { name?: unknown; flow?: unknown };
    const name = typeof body.name === "string" ? body.name.slice(0, 200) : "Savvycom News";
    const bytes = await buildNewsDocx(name, body.flow);
    const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "savvycom-news";
    return new Response(bytes, { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${slug}.docx"`,
      "Cache-Control": "no-store",
    } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Không thể tạo file Word" }, { status: 400 });
  }
}
