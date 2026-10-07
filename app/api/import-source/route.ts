import {NextResponse} from "next/server";
import {extractSource, ImportError} from "@/lib/source-import";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({error: "Vui lòng chọn file để import"}, {status: 400});
    return NextResponse.json(await extractSource(file));
  } catch (error) {
    return NextResponse.json({error: error instanceof ImportError ? error.message : "File bị lỗi hoặc không đọc được. Hãy kiểm tra định dạng và mật khẩu của file."}, {status: error instanceof ImportError ? error.status : 422});
  }
}
