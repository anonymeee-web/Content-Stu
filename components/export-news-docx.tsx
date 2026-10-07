"use client";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ContentFlow } from "@/lib/content-flow";

export function ExportNewsDocx({ name, flow, busy }: { name: string; flow: ContentFlow; busy: boolean }) {
  const [exporting, setExporting] = useState(false);
  const complete = flow.outlineApproved && flow.vietnameseApproved && flow.englishApproved && flow.socialApproved;
  async function download() {
    if (!complete || busy || exporting) return;
    setExporting(true);
    try {
      const response = await fetch("/api/export-docx", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, flow }) });
      if (!response.ok) { const result = await response.json() as { error?: string }; throw new Error(result.error || "Không thể xuất Word"); }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || "savvycom-news.docx";
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Đã xuất news và social caption thành file Word");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể xuất Word"); }
    finally { setExporting(false); }
  }
  return <Button variant="outline" onClick={download} disabled={!complete || busy || exporting} title={complete ? "Tải file Word" : "Hoàn tất tất cả nội dung để xuất Word"}>{exporting ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}Xuất Word (.docx)</Button>;
}
