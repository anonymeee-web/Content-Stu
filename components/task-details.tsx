"use client";
import {useId, useState} from "react";
import {Clock3, FileText, FolderOpen, Plus} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {stageLabels, type ContentFlow} from "@/lib/content-flow";
import type {TaskInput} from "@/components/task-form";

export type TaskProject = {id: string; name: string; contentFlow: ContentFlow};
export function TaskDetails({task, projects, linkProject, openProject, createProject}: {
  task: TaskInput;
  projects: TaskProject[];
  linkProject: (id?: string) => void;
  openProject: (id: string) => void;
  createProject: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState("");
  const id = useId();
  const project = projects.find(item=>item.id===task.projectId);
  const flow = project?.contentFlow;
  const dirty = selection !== (task.projectId || "");
  return <Dialog open={open} onOpenChange={value=>{setOpen(value);if(value)setSelection(task.projectId || "")}}>
    <DialogTrigger asChild><button className="block w-full rounded-lg text-left outline-none hover:text-violet-700 focus-visible:ring-2 focus-visible:ring-violet-500" aria-label={`Xem task ${task.title}`}><h3 className="font-medium">{task.title}</h3><div className="mt-4 flex justify-between gap-2 text-xs text-slate-500"><span>{task.owner}</span><span className="flex gap-1"><Clock3 size={13}/>{task.due}</span></div><span className="mt-3 flex items-center gap-1 text-xs text-violet-600"><FileText size={13}/>{project ? project.name : "Xem chi tiết và liên kết bài"}</span></button></DialogTrigger>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>{task.title}</DialogTitle><DialogDescription>Thông tin công việc và bài viết liên kết trong Content Studio.</DialogDescription></DialogHeader>
      <dl className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm"><div><dt className="text-slate-500">Người phụ trách</dt><dd className="mt-1 font-medium">{task.owner}</dd></div><div><dt className="text-slate-500">Kênh nội dung</dt><dd className="mt-1 font-medium">{task.channel}</dd></div><div><dt className="text-slate-500">Deadline</dt><dd className="mt-1 font-medium">{task.due}</dd></div><div><dt className="text-slate-500">Trạng thái</dt><dd className="mt-1"><Badge variant="outline">{task.status}</Badge></dd></div></dl>
      <div className="space-y-2"><label htmlFor={id} className="text-sm font-medium">Bài trong Content Studio</label><div className="flex flex-col gap-2 sm:flex-row"><select id={id} value={selection} onChange={event=>setSelection(event.target.value)} className="h-10 min-w-0 flex-1 rounded-md border bg-white px-3 text-sm"><option value="">Chưa liên kết</option>{task.projectId && !project && <option value={task.projectId}>Project không còn tồn tại</option>}{projects.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><Button variant="outline" disabled={!dirty} onClick={()=>linkProject(selection || undefined)}>Lưu liên kết</Button></div>{task.projectId && !project && <p className="text-xs text-amber-700">Bài đã liên kết không còn tồn tại. Chọn bài khác hoặc bỏ liên kết.</p>}</div>
      {project && flow ? <section className="space-y-3 rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">{project.name}</h3><p className="mt-1 text-sm text-slate-500">Bước hiện tại: {stageLabels[flow.active]}</p><p className="mt-1 text-xs text-slate-500">{flow.socialApproved ? "Nội dung đã hoàn tất" : flow.englishApproved ? "News đã hoàn tất" : "Đang biên tập"}</p></div><Button onClick={()=>{setOpen(false);openProject(project.id)}}><FolderOpen size={16}/>Mở bài trong Content Studio</Button></div><div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-6">{flow[flow.active].trim() || "Chưa có nội dung ở bước này. Mở Content Studio để tiếp tục viết."}</div></section> : <div className="rounded-xl border border-dashed p-5 text-sm text-slate-500">Chọn project hiện có để liên kết hoặc tạo một bài mới cho task này.</div>}
      {!project && <Button variant="outline" onClick={()=>{setOpen(false);createProject()}}><Plus size={16}/>Tạo bài cho task</Button>}
    </DialogContent>
  </Dialog>;
}
