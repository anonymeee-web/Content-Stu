"use client";
import {useId, useState} from "react";
import {Pencil, Plus} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";

export type TaskInput = {title: string; owner: string; channel: string; status: "Đang làm" | "Chờ duyệt" | "Đã xong"; due: string; dueAt?: string; projectId?: string};
export function TaskForm({task, projects = [], onSave}: {task?: TaskInput; projects?: {id: string; name: string}[]; onSave: (values: TaskInput) => void}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("Bạn");
  const [channel, setChannel] = useState("News / Website");
  const [status, setStatus] = useState<TaskInput["status"]>("Đang làm");
  const [dueAt, setDueAt] = useState("");
  const [deadlineChanged, setDeadlineChanged] = useState(false);
  const [projectId, setProjectId] = useState("");
  const id = useId();
  function changeOpen(next: boolean) {
    if (next) {
      setTitle(task?.title || ""); setOwner(task?.owner || "Bạn");
      setChannel(task?.channel || "News / Website"); setStatus(task?.status || "Đang làm");
      setDueAt(task?.dueAt || ""); setDeadlineChanged(false);
      setProjectId(task?.projectId || "");
    }
    setOpen(next);
  }
  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !owner.trim() || !channel.trim()) return;
    const due = dueAt ? new Date(dueAt).toLocaleString("vi-VN", {day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"}) : !deadlineChanged && task ? task.due : "Chưa đặt";
    onSave({title: title.trim(), owner: owner.trim(), channel: channel.trim(), status, due, dueAt: dueAt || undefined, projectId: projectId || undefined});
    setOpen(false);
  }
  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger asChild>{task ? <Button variant="ghost" size="icon-sm" aria-label={`Sửa task ${task.title}`} title="Sửa thông tin task" className="text-slate-400"><Pencil size={16}/></Button> : <Button><Plus size={16}/>Thêm task</Button>}</DialogTrigger>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>{task ? "Sửa thông tin task" : "Tạo công việc mới"}</DialogTitle><DialogDescription>Nhập thông tin công việc để theo dõi trong pipeline. Deadline không bắt buộc.</DialogDescription></DialogHeader>
      <form onSubmit={save} className="space-y-4">
        <div className="space-y-2"><label htmlFor={`${id}-title`} className="text-sm font-medium">Tên công việc *</label><Input id={`${id}-title`} value={title} onChange={event=>setTitle(event.target.value)} required maxLength={200} placeholder="VD: Viết news recap sự kiện AVSTC" autoFocus/></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><label htmlFor={`${id}-owner`} className="text-sm font-medium">Người phụ trách *</label><Input id={`${id}-owner`} value={owner} onChange={event=>setOwner(event.target.value)} required maxLength={100} placeholder="Tên người phụ trách"/></div>
          <div className="space-y-2"><label htmlFor={`${id}-channel`} className="text-sm font-medium">Kênh nội dung *</label><Input id={`${id}-channel`} list={`${id}-channels`} value={channel} onChange={event=>setChannel(event.target.value)} required maxLength={100} placeholder="Chọn hoặc nhập kênh"/><datalist id={`${id}-channels`}>{["News / Website", "LinkedIn", "Facebook", "Email", "Khác"].map(value=><option key={value} value={value}/>)}</datalist></div>
        </div>
        <div className="space-y-2"><label htmlFor={`${id}-due`} className="text-sm font-medium">Deadline</label><Input id={`${id}-due`} type="datetime-local" value={dueAt} onChange={event=>{setDueAt(event.target.value);setDeadlineChanged(true)}}/>{task && !task.dueAt && task.due!=="Chưa đặt" && !deadlineChanged && <p className="text-xs text-slate-500">Deadline hiện tại: {task.due}. Được giữ lại nếu bạn không chọn ngày mới.</p>}</div>
        <div className="space-y-2"><label htmlFor={`${id}-status`} className="text-sm font-medium">Trạng thái</label><select id={`${id}-status`} value={status} onChange={event=>setStatus(event.target.value as TaskInput["status"])} className="h-10 w-full rounded-md border bg-white px-3 text-sm">{["Đang làm", "Chờ duyệt", "Đã xong"].map(value=><option key={value} value={value}>{value}</option>)}</select></div>
        <div className="space-y-2"><label htmlFor={`${id}-project`} className="text-sm font-medium">Bài trong Content Studio</label><select id={`${id}-project`} value={projectId} onChange={event=>setProjectId(event.target.value)} className="h-10 w-full rounded-md border bg-white px-3 text-sm"><option value="">Chưa liên kết</option>{projectId && !projects.some(project=>project.id===projectId) && <option value={projectId}>Project không còn tồn tại</option>}{projects.map(project=><option key={project.id} value={project.id}>{project.name}</option>)}</select><p className="text-xs text-slate-500">Chọn bài đang làm. Có thể liên kết hoặc tạo bài mới trong chi tiết task.</p></div>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>changeOpen(false)}>Hủy</Button><Button type="submit" disabled={!title.trim() || !owner.trim() || !channel.trim()}>{task ? "Lưu thay đổi" : "Tạo task"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
