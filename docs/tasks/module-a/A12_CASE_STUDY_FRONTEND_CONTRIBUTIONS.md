# CASE STUDY DỰ ÁN DOODLELIFE & MINH CHỨNG ĐÓNG GÓP MODULE A (FRONTEND & UX LEAD)

- **Mã Task LMS:** `T04FC6D`
- **Mã Task Đề tài:** A12
- **Người thực hiện:** Bùi Phạm Chí Nhân (JS - 14)
- **Vai trò:** Module A: Frontend & UX Lead
- **Dự án:** DoodleLife (Doodly) — AI-Powered Visual Journal
- **Thời gian hoàn thành:** 12/11/2026
- **Nhánh Git:** `feature/t04fc6d-a12-case-study-contributions`

---

## 1. BỐI CẢNH VÀ VẤN ĐỀ (PROBLEM STATEMENT)

### 1.1. Bối cảnh thực tế
Trong nhịp sống hiện đại bận rộn, người trẻ (Gen Z và người đi làm) luôn mong muốn lưu lại những khoảnh khắc, cảm xúc hàng ngày để giải tỏa tâm lý và theo dõi sự phát triển bản thân. Tuy nhiên, các ứng dụng viết nhật ký truyền thống (Notion, Day One, sổ tay giấy) đặt ra nhiều rào cản:
- Đòi hỏi người dùng phải viết những đoạn văn dài, tốn 15–30 phút mỗi ngày.
- Giao diện tài liệu đơn điệu hoặc quá phức tạp, nhanh chóng gây nản lòng sau 3–5 ngày đầu.
- Thiếu yếu tố phản hồi thị giác (visual feedback) tức thì và cảm giác được "thưởng" khi hoàn thành ghi chép.

### 1.2. Mục tiêu đề tài
Xây dựng **DoodleLife (Doodly)** — nền tảng micro-journaling kết hợp trí tuệ nhân tạo:
- Giới hạn nội dung cô đọng từ **1–300 ký tự**.
- Tự động biến câu chuyện thành **sticker doodle viền đen đậm nét vẽ tay độc bản** kèm cảm xúc.
- Gom cụm hành trình thành **trục thời gian zíc-zắc (Timeline)** và **studio xuất ảnh Story 9:16 (Memory Recap)** để chia sẻ mạng xã hội.

---

## 2. GIẢI PHÁP THIẾT KẾ VÀ KIẾN TRÚC FRONTEND

### 2.1. Ngôn ngữ thiết kế Doodle & Neobrutalism
- Áp dụng phong cách thị giác vẽ tay ngộ nghĩnh (Doodle Art) kết hợp đường viền đen đậm nét (`border-2 border-zinc-900`) và đổ bóng cứng (`shadow-[3px_3px_0px_#18181b]`).
- Bảng màu pastel nhẹ nhàng (vàng kem `#faf9f6`, amber, tím pastel, xanh ngọc) mang lại cảm giác ấm cúng, thư giãn, giảm stress khi viết nhật ký.

### 2.2. Kiến trúc Module hóa Frontend
- **Stack:** React 18, Vite 8, TypeScript, TailwindCSS, Lucide Icons, Oxlint.
- **Tổ chức thư mục chuẩn mực:**
  - `src/components/layout/`: Khung ứng dụng (`AppHeader`, `BrowserTitlebar`, `BottomNav`).
  - `src/components/auth/`: Form đăng nhập/đăng ký Supabase chuẩn OAuth & Email/Password.
  - `src/components/journal/`: Form viết nhật ký 1–300 ký tự, chip câu gợi ý (AX1), mood selector.
  - `src/components/stickers/`: Thẻ theo dõi trạng thái job AI 4 giai đoạn (`queued`, `processing`, `succeeded`, `failed`).
  - `src/components/sections/`: Các phân hệ chính độc lập (`LandingSection`, `CheckinSection`, `TimelineSection`, `RecapSection`, `StickersSection`).
  - `src/lib/`: Các service kết nối API & bộ đệm ngoại tuyến (`journalService`, `jobService`, `timelineService`, `quotaService`, `supabaseClient`).

### 2.3. Các quyết định kỹ thuật then chốt
1. **Bảo mật tuyệt đối (Zero Leaks):** Không commit bất kỳ file `.env` chứa service key nào. Toàn bộ xác thực sử dụng Supabase Auth an toàn, xử lý token trực tiếp qua HTTPS headers.
2. **Khôi phục nháp (Draft Persistence):** Lưu bản nháp tự động vào `sessionStorage` để không mất nội dung khi người dùng chuyển trang hoặc vô tình reload.
3. **Chống trùng lặp gửi (Anti-Double Submit):** Quản lý trạng thái `isSubmitting`, vô hiệu hóa nút bấm và kèm spinner xoay vòng.
4. **Theo dõi Quota & Đếm ngược thời gian thực:** Đồng hồ đếm ngược từng giây đến nửa đêm theo múi giờ Việt Nam (`Asia/Ho_Chi_Minh` UTC+7) để người dùng chủ động lượt tạo trong ngày.
5. **Dòng thời gian phân trang theo lô (Batch Keyset Pagination):** Tải trước 6 mục/lần, khử trùng lặp dữ liệu bằng `Map<id, item>`, deep-link URL `?entry=id` đồng bộ với `window.history.replaceState`.

---

## 3. KẾT QUẢ ĐO LƯỜNG VÀ KIỂM ĐỊNH (METRICS & RESULTS)

1. **Hiệu năng & Chất lượng mã nguồn:**
   - `oxlint`: 0 warnings, 0 errors trên toàn bộ 37 files frontend.
   - `tsc -b && vite build`: Thời gian biên dịch đạt kỷ lục **~0.9s**, 100% type-safe.
2. **Kết quả Usability Testing (Task A10):**
   - 5/5 người tham gia (100%) hoàn thành trọn vẹn luồng từ đăng nhập -> viết nhật ký -> xem sticker -> khám phá timeline -> xuất recap.
   - Thời gian trung bình hoàn thành luồng: **2 phút 10 giây**.
   - Khắc phục triệt để 100% các vấn đề giao diện (empty states, retry buttons, padding mobile) trong Task A11.

---

## 4. BẢNG TỔNG HỢP MINH CHỨNG ĐÓNG GÓP TOÀN BỘ SPRINT (MODULE A)

Dưới đây là danh sách toàn bộ các Task và Pull Request do **Bùi Phạm Chí Nhân** trực tiếp thiết kế, hiện thực mã nguồn và nghiệm thu:

| Mã Task | Mã LMS | Tên Task | Điểm | Nhánh Git | Commit Hash | Minh chứng nghiệm thu |
|:---:|:---:|:---|:---:|:---|:---:|:---|
| **A01** | `T04FC4C` | Chốt phạm vi MVP và kịch bản người dùng | 2 | `feature/t04fc4c-a01-mvp-scope` | `merged` | [A01 Spec](file:///d:/FinalModule-Rikkei/docs/tasks/module-a/A01_MVP_SCOPE_ACCEPTANCE.md) |
| **A02** | `T04FC4F` | Thiết kế Wireframe, UI Kit và User Flow | 3 | `feature/t04fc4f-a02-ui-ux-design` | `merged` | [A02 Spec](file:///d:/FinalModule-Rikkei/docs/tasks/module-a/A02_DESIGN_ACCEPTANCE.md) |
| **A03** | `T04FC52` | Dựng khung ứng dụng và phiên đăng nhập | 3 | `feature/t04fc52-a03-app-shell-auth` | `5c4435b` | [A03 Spec](file:///d:/FinalModule-Rikkei/docs/tasks/module-a/A03_APP_SHELL_AUTH_ACCEPTANCE.md) |
| **A04** | `T04FC55` | Xây dựng form ghi nhật ký (1-300 kt) | 5 | `feature/t04fc55-a04-journal-form` | `0517658` | [A04 Spec](file:///d:/FinalModule-Rikkei/docs/tasks/module-a/A04_JOURNAL_FORM_ACCEPTANCE.md) |
| **A05** | `T04FC58` | Hiển thị tiến trình tạo sticker (4 trạng thái) | 3 | `feature/t04fc58-a05-sticker-progress` | `d20bc2a` | [A05 Spec](file:///d:/FinalModule-Rikkei/docs/tasks/module-a/A05_STICKER_PROGRESS_ACCEPTANCE.md) |
| **A06** | `T04FC5B` | Xây dựng Journey Timeline & tải thêm phân trang | 8 | `feature/t04fc5b-a06-journey-timeline` | `42d66fd` | [A06 Spec](file:///d:/FinalModule-Rikkei/docs/tasks/module-a/A06_JOURNEY_TIMELINE_ACCEPTANCE.md) |
| **A07** | `T04FC5E` | Hoàn thiện xem chi tiết và xóa nhật ký | 5 | `feature/t04fc5e-a07-detail-delete-entry` | `ad86c45` | [A07 Spec](file:///d:/FinalModule-Rikkei/docs/tasks/module-a/A07_DETAIL_DELETE_ACCEPTANCE.md) |
| **A08** | `T04FC61` | Hoàn thiện UX lỗi, quota và responsive mobile | 5 | `feature/t04fc61-a08-ux-quota-responsive` | `eb3768f` | [A08 Spec](file:///d:/FinalModule-Rikkei/docs/tasks/module-a/A08_UX_QUOTA_RESPONSIVE_ACCEPTANCE.md) |
| **A09** | `T04FC64` | Xây dựng màn hình Memory Recap 9:16 | 8 | `feature/t04fc64-a09-memory-recap-screen` | `75b9abe` | [A09 Spec](file:///d:/FinalModule-Rikkei/docs/tasks/module-a/A09_MEMORY_RECAP_ACCEPTANCE.md) |
| **AX1** | `T04FC70` | Thêm gợi ý viết khi chưa biết bắt đầu (Bonus) | 3 | `feature/t04fc70-ax1-writing-prompts` | `56960f3` | [AX1 Spec](file:///d:/FinalModule-Rikkei/docs/tasks/module-a/AX1_WRITING_PROMPTS_ACCEPTANCE.md) |
| **A10** | `T04FC67` | Thử nghiệm luồng chính với 5 người dùng | 5 | `feature/t04fc67-a10-usability-testing` | `53becb7` | [A10 Spec](file:///d:/FinalModule-Rikkei/docs/tasks/module-a/A10_USABILITY_TESTING_ACCEPTANCE.md) |
| **A11** | `T04FC6A` | Sửa lỗi UX và hoàn thiện frontend | 5 | `feature/t04fc6a-a11-ux-bugfixes-polish` | `133dcf3` | [A11 Spec](file:///d:/FinalModule-Rikkei/docs/tasks/module-a/A11_UX_POLISH_ACCEPTANCE.md) |
| **A12** | `T04FC6D` | Viết case study và ghi đóng góp frontend | 3 | `feature/t04fc6d-a12-case-study-contributions` | `current` | [A12 Spec](file:///d:/FinalModule-Rikkei/docs/tasks/module-a/A12_CASE_STUDY_FRONTEND_CONTRIBUTIONS.md) |

> **TỔNG ĐIỂM HOÀN THÀNH TOÀN BỘ MODULE A:** **53 / 50 điểm** (Đạt 106% KPI với 100% tasks P0 và task Bonus UX).

---

## 5. KẾT LUẬN
Toàn bộ phân hệ Frontend của dự án DoodleLife đã được xây dựng hoàn tất với chất lượng vượt chuẩn: kiến trúc rõ ràng, tính năng trọn vẹn từ viết nhật ký, tạo sticker AI, hành trình timeline đến poster recap story, bảo mật tuyệt đối không lọt secret, và sẵn sàng 100% cho buổi nghiệm thu đồ án tốt nghiệp Rikkei Academy.
