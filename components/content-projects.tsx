"use client";
import { useId, useState } from "react";
import { FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { stageLabels, type ContentFlow } from "@/lib/content-flow";

export function ContentProjects({projects,sources,defaultSourceId,openProject,createProject}: {
  projects: {id:string;name:string;updatedAt:string;contentFlow:ContentFlow;sourceIds:number[]}[];
  sources: {id:number;name:string;kind:"event"|"c-level"}[];
  defaultSourceId?:number;
  openProject:(id:string)=>void;
  createProject:(name:string,sourceIds:number[])=>void;
}) {
  const [open,setOpen]=useState(false),[name,setName]=useState(""),[ids,setIds]=useState<number[]>([]);
  const fieldId=useId();
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-semibold">Content Studio</h2><p className="mt-1 text-sm text-slate-500">Mở project để tiếp tục viết news hoặc tạo project mới.</p></div>
      <Dialog open={open} onOpenChange={value=>{setOpen(value);if(value){setName("");setIds(defaultSourceId?[defaultSourceId]:[])}}}>
        <DialogTrigger asChild><Button><Plus size={16}/>Tạo project mới</Button></DialogTrigger>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Tạo project mới</DialogTitle><DialogDescription>Đặt tên và chọn nguồn sự kiện, C-level cho bài news. Có thể bổ sung nguồn khi làm việc.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={event=>{event.preventDefault();if(!name.trim())return;createProject(name.trim(),ids);setOpen(false)}}>
            <div className="space-y-2"><label htmlFor={fieldId} className="text-sm font-medium">Tên project</label><Input id={fieldId} value={name} onChange={event=>setName(event.target.value)} placeholder="VD: Recap sự kiện AVSTC" required/></div>
            <div className="max-h-72 space-y-4 overflow-y-auto rounded-xl border p-3">{(["event","c-level"] as const).map(kind=><section key={kind}><h3 className="mb-2 text-sm font-semibold">{kind==="event"?"Dữ liệu sự kiện":"C-level công ty"}</h3>{sources.filter(source=>source.kind===kind).map(source=><label key={source.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50"><input type="checkbox" checked={ids.includes(source.id)} onChange={()=>setIds(current=>current.includes(source.id)?current.filter(id=>id!==source.id):[...current,source.id])}/>{source.name}</label>)}{!sources.some(source=>source.kind===kind)&&<p className="text-xs text-slate-400">Chưa có dữ liệu trong mục này.</p>}</section>)}</div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>setOpen(false)}>Hủy</Button><Button type="submit" disabled={!name.trim()}>Tạo và bắt đầu viết</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    {projects.length?<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[...projects].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(project=><button key={project.id} onClick={()=>openProject(project.id)} aria-label={`Mở project ${project.name}`} className="rounded-2xl border bg-white p-5 text-left transition hover:border-slate-400 hover:shadow-sm"><FolderOpen size={24} className="mb-4 text-violet-600"/><h3 className="text-lg font-semibold">{project.name}</h3><p className="mt-2 text-sm text-slate-500">Bước hiện tại: {stageLabels[project.contentFlow.active]}</p><p className="mt-1 text-xs text-slate-400">{project.sourceIds.filter(id=>sources.some(source=>source.id===id)).length} nguồn dữ liệu · {project.contentFlow.englishApproved?"News hoàn tất":"Đang biên tập"}</p><p className="mt-4 border-t pt-3 text-xs text-slate-400">Cập nhật {new Date(project.updatedAt).toLocaleString("vi-VN")}</p><span className="mt-3 block text-sm font-semibold">Mở project →</span></button>)}</div>:<div className="rounded-2xl border border-dashed bg-white px-6 py-16 text-center"><FolderOpen size={36} className="mx-auto mb-3 text-slate-300"/><h3 className="font-semibold">Chưa có project</h3><p className="mt-2 text-sm text-slate-500">Tạo project mới để bắt đầu từ outline và support idea.</p></div>}
  </div>;
}
