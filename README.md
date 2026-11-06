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

| Phụ trách | Vai trò | Trách nhiệm chính |
| :--- | :--- | :--- |
| **Bùi Phạm Chí Nhân** | **Module A: Frontend & UX Lead** | Giao diện người dùng, Wireframe/Prototype, Journey Timeline, Memory Recap Studio (Next.js 14, TailwindCSS). |
| **Anh Tuấn** | **Module B: Backend Core & DB** | Kiến trúc Clean Architecture, RESTful API, PostgreSQL CSDL, Auth JWT & Phân quyền dữ liệu (NestJS). |
| **Anh Tiến** | **Module C: AI Pipeline & Storage** | Prompt Engineering, Cloudflare AI Image Gen, Quản lý Quota, Private Storage & Xuất ảnh (Cloudflare Workers/R2). |

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

* **Frontend:** Next.js 14 (App Router), TypeScript, TailwindCSS.
* **Backend:** NestJS / Node.js, RESTful API.
* **Database & Storage:** PostgreSQL, Cloudflare R2 / S3.
* **AI & Media:** Cloudflare Workers AI / Image Diffusion, Canvas/HTML-to-Image.

---

## 📂 Tài liệu Dự án

Toàn bộ tài liệu phân tích, đặc tả yêu cầu và hợp đồng kỹ thuật được lưu trữ trong thư mục `docs/`:
* `docs/tasks/module-a/`: Đặc tả phạm vi MVP (`A01`), Thiết kế UI/UX Spec & User Flow (`A02`).
* `docs/backlog-planning/`: Kế hoạch Backlog 15 ngày chi tiết của cả 3 Module.
* `docs/project-specs/`: Yêu cầu nghiệp vụ và tài liệu đề tài gốc.

---

## 🚀 Cài đặt & Khởi chạy (Đang cập nhật)

Dự án đang trong giai đoạn Sprint 1 (Khởi tạo nền tảng). Hướng dẫn cài đặt môi trường và khởi chạy local sẽ được cập nhật tại Task `B01` / `A03`.
