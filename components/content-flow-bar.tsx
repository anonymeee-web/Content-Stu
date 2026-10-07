"use client";
import { ExportNewsDocx } from "@/components/export-news-docx";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { canGenerate, stageLabels, type ContentFlow, type ContentStage } from "@/lib/content-flow";

export function ContentFlowBar({ flow, busy, hasSource, selectStage, generate, approve, projectName }: {
  projectName: string; flow: ContentFlow; busy: boolean; hasSource: boolean;
  selectStage: (stage: ContentStage) => void;
  generate: () => void; approve: () => void;
}) {
  const approved = flow.active === "outline" ? flow.outlineApproved : flow.active === "vietnamese" ? flow.vietnameseApproved : flow.active === "english" ? flow.englishApproved : flow.socialApproved;
  const labels = { outline: "Tạo outline", vietnamese: "Tạo draft news tiếng Việt", english: "Viết news tiếng Anh", social: "Tạo social caption" };
  return <section className="mb-5 rounded-2xl border bg-white p-5">
    <h2 className="font-semibold">Quy trình viết news blog</h2>
    <p className="mt-1 text-sm text-slate-500">Outline có support idea → duyệt → news tiếng Việt → duyệt → news tiếng Anh → hoàn tất news → social caption.</p>
    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="tablist" aria-label="Phiên bản bài viết">
      {(["outline", "vietnamese", "english", "social"] as ContentStage[]).map((stage, index) => <button key={stage} role="tab" aria-selected={flow.active === stage} disabled={busy} onClick={() => selectStage(stage)} className={`rounded-xl border p-3 text-left text-sm disabled:opacity-50 ${flow.active === stage ? "border-slate-950 bg-slate-950 text-white" : "bg-slate-50 text-slate-600"}`}>
        <strong>{index + 1}. {stageLabels[stage]}</strong>
        <span className="mt-1 block text-xs opacity-75">{stage === "outline" ? flow.outlineApproved ? "Đã duyệt outline" : "Chờ duyệt outline" : stage === "vietnamese" ? flow.vietnameseApproved ? "Đã duyệt tiếng Việt" : flow.outlineApproved ? "Chờ viết / duyệt tiếng Việt" : "Cần duyệt outline" : stage === "english" ? flow.englishApproved ? "News đã hoàn tất" : flow.vietnameseApproved ? "Sẵn sàng viết news tiếng Anh" : "Cần duyệt tiếng Việt" : flow.socialApproved ? "Nội dung đã hoàn tất" : flow.englishApproved ? "Tạo caption từ news hoàn tất" : "Cần hoàn tất news trước"}</span>
      </button>)}
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <Button onClick={generate} disabled={busy || !hasSource || !canGenerate(flow, flow.active)}><Sparkles size={16}/>{busy ? "AI đang viết…" : labels[flow.active]}</Button>
      {<Button variant="outline" onClick={approve} disabled={busy || approved || !flow[flow.active].trim() || (!canGenerate(flow, flow.active))}><Check size={16}/>{flow.active === "outline" ? "Duyệt outline" : flow.active === "vietnamese" ? "Duyệt bản tiếng Việt" : flow.active === "english" ? "Hoàn tất news" : "Hoàn tất nội dung"}</Button>}
      <ExportNewsDocx name={projectName} flow={flow} busy={busy}/>
      <span className="text-xs text-slate-500">News là bài blog đầy đủ. Caption được tạo riêng ở bước cuối. Sửa news sẽ yêu cầu duyệt lại trước khi tạo caption.</span>
    </div>
  </section>;
}
