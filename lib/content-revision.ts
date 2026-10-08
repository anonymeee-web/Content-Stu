import {stageLabels, type ContentStage} from "@/lib/content-flow";

export function revisionPrompt(stage: ContentStage, draft: string, feedback: string): string {
  const language = stage === "english" ? "Toàn bộ bản sửa phải bằng formal business American English, kể cả khi feedback viết bằng tiếng Việt."
    : stage === "social" ? "Giữ ngôn ngữ của từng caption: bản Việt bằng tiếng Việt, bản Anh bằng tiếng Anh."
    : "Bản sửa phải bằng tiếng Việt.";
  return `NHIỆM VỤ: CHỈNH SỬA THEO FEEDBACK, KHÔNG TẠO BÀI MỚI.
Bạn đang sửa ${stageLabels[stage]} hiện tại. Bản nháp bên dưới là bản gốc duy nhất để chỉnh sửa.
Đọc từng yêu cầu trong feedback và áp dụng trực tiếp vào nội dung. Feedback cụ thể của người dùng được ưu tiên hơn guideline chung về giọng văn, độ dài, cấu trúc và angle. Không dùng outline hoặc bản ở ngôn ngữ khác để khôi phục những câu người dùng yêu cầu sửa/xóa.
Chỉ thay phần cần thiết để đáp ứng feedback; giữ các đoạn không liên quan. Nếu yêu cầu đổi mở bài, tiêu đề, thứ tự, rút gọn hoặc thay thuật ngữ, thực hiện thay đổi đó trong bản sửa. Không chỉ diễn giải góp ý, không đưa hướng dẫn cách sửa, không trả lại nguyên văn bản cũ.
Không bịa dữ kiện hoặc quote. Nếu feedback yêu cầu bổ sung thông tin chưa có căn cứ trong nguồn hoặc bản nháp, dùng [TBC: ...] tại vị trí cần bổ sung.
${language} Giữ định dạng Markdown # tiêu đề bài, ## heading chính, ### heading phụ nếu có. Chỉ trả toàn bộ phiên bản đã chỉnh sửa; không thêm lời chào, báo cáo thay đổi hoặc phần giải thích.

FEEDBACK CẦN ÁP DỤNG:
${feedback.trim()}

BẢN NHÁP CẦN CHỈNH SỬA:
${draft}`;
}
