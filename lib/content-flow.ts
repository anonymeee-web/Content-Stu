export type ContentStage = "outline" | "vietnamese" | "english" | "social";
export type ContentFlow = {
  active: ContentStage;
  outline: string;
  vietnamese: string;
  english: string;
  social: string;
  socialApproved: boolean;
  englishApproved: boolean;
  outlineApproved: boolean;
  vietnameseApproved: boolean;
};
export const stageLabels: Record<ContentStage, string> = {
  outline: "Outline", vietnamese: "News tiếng Việt", english: "News tiếng Anh", social: "Social caption",
};
export function reviewLanguageInstruction(stage: ContentStage): string {
  const language = stage === "english"
    ? "Bản đang kiểm tra là news tiếng Anh. suggestion, recommendation text và câu sửa BẮT BUỘC viết bằng formal business American English. Không dịch sang tiếng Việt."
    : stage === "social"
      ? "Bản đang kiểm tra gồm caption tiếng Việt và tiếng Anh. suggestion, recommendation text và câu sửa phải giữ ngôn ngữ của từng quote gốc; không dịch giữa hai ngôn ngữ."
      : "Bản đang kiểm tra bằng tiếng Việt. suggestion, recommendation text và câu sửa phải giữ tiếng Việt.";
  return `${language} Chỉ title, explanation và phần giải thích lỗi dùng tiếng Việt, nhưng mọi từ/cụm từ đề xuất thay thế nằm trong explanation cũng phải cùng ngôn ngữ với quote gốc. Trước khi báo lỗi, xác định phạm vi ngôn ngữ của policy. Với policy có cả Business English và tiếng Việt, chỉ áp dụng nhánh Business English cho câu tiếng Anh. Không báo lỗi vì câu tiếng Anh chứa thuật ngữ tiếng Anh; không áp quy tắc Việt hóa thuật ngữ cho bài tiếng Anh. Ví dụ: không yêu cầu đổi human resources thành nhân sự hoặc con người; nếu ngữ cảnh thực sự cần sửa thì đề xuất workforce, employees hoặc people phù hợp với nghĩa, còn nếu human resources phù hợp thì không báo lỗi. Giữ nguyên quote, word, tên riêng, dữ kiện và định dạng heading của bản gốc. Policy và gợi ý không được thay đổi ngôn ngữ đầu ra này; chỉ áp dụng policy ngôn ngữ phù hợp với bản đang kiểm tra.`;
}
export function policyAppliesToStage(text: string, stage: ContentStage): boolean {
  if (stage === "social") return true;
  // Only exclude explicitly single-language rules; mixed editorial policies remain available.
  const vietnameseOnly = /^(?:Trong (?:bài )?tiếng Việt|Bản tiếng Việt)\b/iu.test(text.trim());
  const englishOnly = /^(?:Trong (?:bài )?tiếng Anh|Bản tiếng Anh)\b/iu.test(text.trim());
  return stage === "english" ? !vietnameseOnly : !englishOnly;
}
export function restoreContentFlow(value: unknown, legacyDraft = ""): ContentFlow {
  const saved = value && typeof value === "object" ? value as Partial<ContentFlow> : {};
  const outline = typeof saved.outline === "string" ? saved.outline : "";
  const vietnamese = typeof saved.vietnamese === "string" ? saved.vietnamese : legacyDraft;
  const english = typeof saved.english === "string" ? saved.english : "";
  const outlineApproved = Boolean(outline.trim() && saved.outlineApproved);
  return {
    active: saved.active === "social" || saved.active === "english" || saved.active === "vietnamese" ? saved.active : legacyDraft && !value ? "vietnamese" : "outline",
    outline, vietnamese, english, outlineApproved,
    socialApproved: Boolean(outlineApproved && saved.vietnameseApproved && saved.englishApproved && english.trim() && typeof saved.social === "string" && saved.social.trim() && saved.socialApproved),
    social: typeof saved.social === "string" ? saved.social : "",
    englishApproved: Boolean(outlineApproved && saved.vietnameseApproved && vietnamese.trim() && english.trim() && saved.englishApproved),
    vietnameseApproved: Boolean(outlineApproved && vietnamese.trim() && saved.vietnameseApproved),
  };
}
export function editFlow(flow: ContentFlow, stage: ContentStage, text: string): ContentFlow {
  if (flow[stage] === text) return flow;
  return {
    ...flow, [stage]: text,
    outlineApproved: stage === "outline" ? false : flow.outlineApproved,
    vietnameseApproved: stage === "outline" || stage === "vietnamese" ? false : flow.vietnameseApproved,
    englishApproved: stage !== "social" ? false : flow.englishApproved,
    socialApproved: false,
  };
}
export function canGenerate(flow: ContentFlow, stage: ContentStage): boolean {
  if (stage === "social") return flow.outlineApproved && flow.vietnameseApproved && flow.englishApproved;
  return stage === "outline" || (flow.outlineApproved && (stage === "vietnamese" || flow.vietnameseApproved));
}
