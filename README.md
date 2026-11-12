# DoodleLife (Doodly) — AI-Powered Visual Journal

> **"Little Moments - Little Doodles"**  
> *Đồ án tốt nghiệp Final Module — Rikkei Academy*

---

## 📖 Giới thiệu Dự án

**DoodleLife** là ứng dụng web nhật ký trực quan tích hợp trí tuệ nhân tạo (AI). Thay vì phải viết những trang nhật ký dài dòng, người dùng chỉ cần ghi lại 1–2 câu ngắn (tối đa 300 ký tự) mỗi ngày. Hệ thống sẽ tự động biến các khoảnh khắc thường nhật thành những chiếc **sticker phong cách doodle độc bản** và sắp xếp chúng trên dòng thời gian (Journey Timeline) tương tác.

### ✨ Tính năng nổi bật
* **Micro-journaling:** Ghi chép siêu tốc, tự động nhận diện múi giờ và buổi trong ngày (`Asia/Ho_Chi_Minh`).
* **AI Doodle Stickers:** Tự động tạo sticker viền dày nét vẽ hoạt hình ngộ nghĩnh dựa trên ngữ cảnh và cảm xúc người dùng.
* **Journey Timeline:** Trục thời gian dọc kết nối các ngày, hiển thị trực quan các cột mốc đã qua.
* **Memory Recap 9:16:** Tự động gom cụm các mốc 3 ngày, 7 ngày, 30 ngày thành poster ảnh Story độ phân giải cao để tải về và chia sẻ mạng xã hội.

---

## 👥 Thành viên & Phân công Module

Dự án được phát triển theo mô hình nhóm 3 thành viên:

| Phụ trách | Vai trò | Trách nhiệm chính | Tiến độ Module |
| :--- | :--- | :--- | :---: |
| **Bùi Phạm Chí Nhân** | **Module A: Frontend & UX Lead** | Giao diện người dùng, Wireframe/Prototype, Journey Timeline, Memory Recap Studio (React 18, Vite, TailwindCSS). | **100% Hoàn thành (53/50 pts)** |
| **Anh Tuấn** | **Module B: Backend Core & DB** | Kiến trúc Clean Architecture, RESTful API, PostgreSQL CSDL, Auth JWT & Phân quyền dữ liệu (NestJS). | Đang phối hợp tích hợp |
| **Anh Tiến** | **Module C: AI Pipeline & Storage** | Prompt Engineering, Cloudflare AI Image Gen, Quản lý Quota, Private Storage & Xuất ảnh (Cloudflare Workers/R2). | Đang phối hợp tích hợp |

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

* **Frontend:** React 18, Vite 8, TypeScript, TailwindCSS (Doodle & Neobrutalism UI), Lucide Icons, Oxlint.
* **Backend:** NestJS / Node.js, RESTful API, PostgreSQL.
* **Database & Auth:** Supabase PostgreSQL & Supabase Authentication (OAuth 2.0 & Email/Password).
* **AI & Media:** Cloudflare Workers AI / Image Diffusion, HTML-to-Image / Canvas.

---

## 📂 Tài liệu Dự án & Case Study Frontend

Toàn bộ tài liệu phân tích, đặc tả yêu cầu và hợp đồng kỹ thuật được lưu trữ trong thư mục `docs/`:
* 🌟 **[Case Study & Minh chứng Đóng góp Module A (A12)](docs/tasks/module-a/A12_CASE_STUDY_FRONTEND_CONTRIBUTIONS.md)** — Báo cáo tổng kết toàn diện kiến trúc, chỉ số kiểm thử và danh sách 13 PRs/Tasks do Bùi Phạm Chí Nhân phụ trách.
* `docs/tasks/module-a/`: Toàn bộ biên bản nghiệm thu từ `A01` đến `A12` và `AX1`.
* `docs/backlog-planning/`: Kế hoạch Backlog 15 ngày chi tiết của cả 3 Module (`task-de-tai.xlsx`).
* `docs/project-specs/`: Yêu cầu nghiệp vụ và tài liệu đề tài gốc.

---

## 🚀 Cài đặt & Khởi chạy Frontend

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Chạy kiểm tra lint (0 warnings, 0 errors)
npm run lint

# 4. Biên dịch kiểm tra TypeScript & Vite
npm run build

# 5. Khởi chạy máy chủ phát triển local
npm run dev
```
