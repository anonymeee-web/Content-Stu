"use client";
import { useId, useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export type TextSourceInput = { name: string; text: string; role: string; company: string };
export function SourceTextImport({ kind, onSave }: {
  kind: "event" | "c-level";
  onSave: (input: TextSourceInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const id = useId();
  const isEvent = kind === "event";
  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !text.trim()) return;
    onSave({ name: name.trim(), text: text.trim(), role: role.trim(), company: company.trim() });
    setName(""); setText(""); setRole(""); setCompany(""); setOpen(false);
  }
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="outline"><FileText size={16}/>Nhập text trực tiếp</Button></DialogTrigger>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{isEvent ? "Nhập dữ liệu sự kiện" : "Nhập hồ sơ C-level"}</DialogTitle>
        <DialogDescription>Dán nội dung để lưu vào mục {isEvent ? "Dữ liệu sự kiện" : "C-level công ty"} và dùng làm nguồn viết, kiểm tra content.</DialogDescription>
      </DialogHeader>
      <form onSubmit={save} className="space-y-4">
        <div className="space-y-2"><label htmlFor={`${id}-name`} className="text-sm font-medium">{isEvent ? "Tên sự kiện / tài liệu" : "Tên C-level / tài liệu"}</label><Input id={`${id}-name`} value={name} onChange={event => setName(event.target.value)} required placeholder={isEvent ? "VD: Thông tin sự kiện AVSTC" : "VD: Hồ sơ CEO Nguyễn Văn A"}/></div>
        {!isEvent && <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><label htmlFor={`${id}-role`} className="text-sm font-medium">Chức danh (không bắt buộc)</label><Input id={`${id}-role`} value={role} onChange={event => setRole(event.target.value)} placeholder="VD: CEO"/></div>
          <div className="space-y-2"><label htmlFor={`${id}-company`} className="text-sm font-medium">Công ty (không bắt buộc)</label><Input id={`${id}-company`} value={company} onChange={event => setCompany(event.target.value)} placeholder="VD: Savvycom"/></div>
        </div>}
        <div className="space-y-2"><label htmlFor={`${id}-text`} className="text-sm font-medium">Nội dung nguồn</label><Textarea id={`${id}-text`} value={text} onChange={event => setText(event.target.value)} required className="min-h-64" placeholder={isEvent ? "Dán thông tin, agenda, note hoặc nội dung phát biểu tại sự kiện…" : "Dán tiểu sử, kinh nghiệm, quan điểm và thông tin lãnh đạo…"}/><p className="text-xs text-slate-500">Giữ đầy đủ nội dung và xuống dòng. Tự động lưu trên trình duyệt này.</p></div>
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={!name.trim() || !text.trim()}>Lưu vào kho dữ liệu</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
