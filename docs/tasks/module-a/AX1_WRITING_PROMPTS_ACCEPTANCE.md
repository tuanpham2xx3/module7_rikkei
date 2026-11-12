# BIÊN BẢN NGHIỆM THU TỰ ĐỘNG - TASK AX1: THÊM GỢI Ý VIẾT KHI CHƯA BIẾT BẮT ĐẦU

- **Mã Task LMS:** `T04FC70`
- **Mã Task Đề tài:** AX1 (Module A: Frontend & UX Lead - Bùi Phạm Chí Nhân)
- **Điểm:** 3 điểm (Bonus / Khuyến khích UX)
- **Thời gian hoàn thành:** 12/11/2026
- **Nhánh Git:** `feature/t04fc70-ax1-writing-prompts`

---

## 1. YÊU CẦU NGHIỆM THU & KẾT QUẢ ĐỐI SOÁT

| STT | Tiêu chí nghiệm thu | Hiện thực kỹ thuật | Đánh giá |
|:---:|:---|:---|:---:|
| 1 | **6 gợi ý tĩnh phong phú** | Cung cấp 6 mẫu câu tâm trạng thực tế: hoàn thành việc quan trọng, dạo ngắm hoàng hôn, uống trà nhìn mưa, gặp lại bạn cũ, nấu món mới, ngày bận rộn nhiều thành quả. | **ĐẠT** |
| 2 | **Chèn hoặc nối vào trường nội dung** | Khi ô nhập rỗng: chèn trực tiếp gợi ý. Khi ô nhập đã có nội dung: tự động nối tiếp vào đuôi (cách 1 khoảng trắng) và cắt giới hạn an toàn ở mức 300 ký tự. | **ĐẠT** |
| 3 | **Không ghi đè dữ liệu đang gõ dở** | Logic nối chuỗi (`${content.trim()} ${prompt}`) bảo toàn toàn bộ ký tự người dùng đã gõ trước đó, không xoá hay đè dữ liệu dở dang. | **ĐẠT** |
| 4 | **Không gọi thêm API / AI** | 100% xử lý phía client bằng state React, không tốn thêm token AI, không tăng độ trễ mạng. | **ĐẠT** |
| 5 | **Đồng bộ nháp tức thì** | Ngay khi bấm chèn gợi ý, hàm `saveJournalDraft` lưu cập nhật vào `sessionStorage` để chống mất dữ liệu khi vô tình reload. | **ĐẠT** |

---

## 2. FILE LIÊN QUAN & THAY ĐỔI
- `frontend/src/components/journal/JournalForm.tsx`:
  - Thêm danh sách hằng số 6 mẫu gợi ý `WRITING_PROMPTS`.
  - Bổ sung hàm xử lý an toàn `handleSelectPrompt(promptText)`.
  - Render cụm gợi ý trực quan với icon `Lightbulb`, hỗ trợ hiệu ứng active, hover và tự động disable khi đang submit form.

---

## 3. KIỂM THỬ TỰ ĐỘNG (CI / BUILD)
- `oxlint`: 0 warnings, 0 errors.
- `tsc -b && vite build`: Hoàn thành 100%, không phát sinh lỗi types.
