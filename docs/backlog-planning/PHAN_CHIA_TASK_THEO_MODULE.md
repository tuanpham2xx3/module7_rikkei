# BẢNG PHÂN CHIA NHIỆM VỤ THEO MODULE DỰ ÁN DOODLY (NHÓM 2)
> **Tài liệu phân công trách nhiệm & theo dõi tiến độ đồ án Final Module**  
> **Dự án:** Doodly – AI-Powered Visual Journal & Endless Social Canvas  
> **Nhóm thực hiện:** Nhóm 2 (Thành viên 1 - TV1, Thành viên 2 - TV2, Thành viên 3 - TV3)  
> **File Excel gốc:** `DoodleLife_Task_Backlog.xlsx` (40 Tasks, 4 Sprints, 20 Ngày)

---

## I. MA TRẬN PHÂN VAI & PHỤ TRÁCH MODULE (RACI MATRIX)

| Vai trò | Phụ trách chính | Trách nhiệm trọng tâm | Công nghệ chủ đạo |
| :--- | :--- | :--- | :--- |
| **Module 1** | **Thành viên 1 (TV1)**<br>*(Frontend & Creative Canvas Lead)* | • Xây dựng Endless Canvas 60 FPS (Konva.js)<br>• Thuật toán toán học S-Curve Packing né va chạm<br>• Xử lý cử chỉ cảm ứng Mobile (Pinch-to-zoom)<br>• Chế độ ghé thăm bạn bè & Thả Doodle Reaction<br>• Bộ xuất ảnh Milestone 9:16 Story | Next.js 14, React, `react-konva`, TailwindCSS, Web Workers, PWA |
| **Module 2** | **Thành viên 2 (TV2)**<br>*(Backend Core & Social Architecture Lead)* | • Thiết kế Clean Architecture NestJS<br>• Quản trị CSDL PostgreSQL & Migration<br>• Module Authentication & Phân quyền RBAC Guard<br>• Module Friendship & Social Privacy (Private/Friends/Public)<br>• Kiểm thử tải & Bảo mật Rate Limiting | NestJS, TypeScript, PostgreSQL, Prisma/TypeORM, JWT, Class-validator |
| **Module 3** | **Thành viên 3 (TV3)**<br>*(AI Pipeline & Cloud/DevOps Lead)* | • Điều phối AI: Gemini 1.5 Flash (NER & JSON Parser)<br>• Tích hợp Image Diffusion Model & Prompt Engineering<br>• Xử lý hậu kỳ: Service bóc tách nền Rembg tự động<br>• Hàng đợi bất đồng bộ BullMQ + Redis Cache<br>• Hạ tầng Cloudflare R2 & CI/CD Production | Google Gemini API, Diffusion API, Python/Rembg, Redis, BullMQ, Cloudflare R2, Docker |

---

## II. CHI TIẾT CÔNG VIỆC TỪNG MODULE

### 🎨 MODULE 1: FRONTEND & CREATIVE CANVAS (Phụ trách: Thành viên 1 - TV1)
*Mục tiêu: Đảm bảo toàn bộ trải nghiệm người dùng, đồ họa tương tác 2D mượt mà 60 FPS, thuật toán bố trí sticker và tính năng xuất Story.*

| STT (Excel) | Ngày | Sprint | Tên công việc | Điểm | Yêu cầu nộp | Mô tả chi tiết |
| :---: | :---: | :---: | :--- | :---: | :---: | :--- |
| **4** | 2 | 1 | Khởi tạo dự án Next.js và cấu hình base Frontend | 7 | Link | Setup Next.js 14 App Router, TypeScript, TailwindCSS, cấu trúc thư mục, theme đen trắng doodle và font chữ hoạt hình. |
| **12** | 7 | 2 | Xây dựng giao diện Check-in siêu tốc (Quick Prompt) | 8 | Link | Giao diện nhập liệu tối giản mobile-first, gợi ý hoạt động nhanh, date picker ghi bù nhật ký và toggle chọn quyền riêng tư. |
| **17** | 9 | 2 | Tích hợp Konva.js và dựng Viewport Endless Canvas cơ bản | 10 | Link | Tích hợp `react-konva` vào Next.js; xây dựng Viewport vô cực hỗ trợ thao tác Pan 2D không biên và Zoom từ 20% đến 200%. |
| **18** | 10 | 2 | Render danh sách sticker lên Canvas và hỗ trợ Drag-Drop | 9 | Link | Hiển thị sticker từ CSDL lên tọa độ Canvas, hỗ trợ kéo thả tự do, xoay nhẹ góc và cập nhật vị trí mới về backend. |
| **19** | 10 | 2 | [Bonus] Hiệu ứng nét vẽ phác thảo (Pencil Sketch Animation) | 5 | Link (x) | Tạo hiệu ứng animation nét chì đang phác họa doodle vui nhộn trên giao diện trong lúc chờ worker AI sinh ảnh hoàn tất. |
| **23** | 12 | 3 | Phát triển thuật toán sắp xếp S-Curve Packing | 10 | Link | Viết thuật toán tự động tính toán tọa độ $(x, y)$ của sticker mới uốn lượn theo hình chữ S, chống đè lấn (collision detection). |
| **24** | 12 | 3 | Xây dựng Dynamic Connectors nối các ngày trên Canvas | 9 | Link | Tự động vẽ các chi tiết nối giữa sticker ngày $N$ và ngày $N+1$: đường nét đứt Bézier uốn lượn, mũi tên tay vẽ, chùm sao nhỏ. |
| **25** | 13 | 3 | Tối ưu cử chỉ cảm ứng đa điểm trên thiết bị di động | 9 | Link | Xử lý touch gestures trên mobile: thuật toán 2 ngón tay pinch-to-zoom mượt mà, lướt 1 ngón để cuộn camera không bị khựng. |
| **26** | 13 | 3 | Xây dựng chế độ xem Canvas bạn bè (Visitor View-Only Mode) | 8 | Link | Giao diện ghé thăm Canvas của bạn bè: khóa chế độ chỉnh sửa, chỉ cho phép zoom, pan và xem thông tin nhật ký chia sẻ. |
| **27** | 14 | 3 | Xây dựng tính năng thả cảm xúc Doodle Reactions | 9 | Link | Bộ sticker cảm xúc nhỏ (tim, cụng ly, ôm, lửa); cho phép bạn bè ghim reaction trực tiếp cạnh sticker và hiển thị thời gian thực. |
| **28** | 14 | 3 | Xây dựng trang Canvas công khai theo URL cá nhân | 7 | Link | Trang web xem Canvas công khai `doodlelife.app/@username`, tối ưu OpenGraph metadata hiển thị thumbnail đẹp khi gửi link. |
| **32** | 16 | 4 | Thiết kế Component Milestone Recap trên Canvas | 8 | Link | Hiển thị khung viền nghệ thuật quanh cụm sticker mốc thời gian kèm typography doodle độc bản (vd: 7-DAY SPRINT, OCTOBER RECAP). |
| **33** | 17 | 4 | Xây dựng bộ xuất ảnh đa tỷ lệ 9:16 và 16:9 | 10 | Link | Sử dụng `stage.toDataURL` kết hợp Web Workers để render cụm sticker ra ảnh độ phân giải cao; tỷ lệ 9:16 cho Story và 16:9 cho Wallpaper. |
| **34** | 17 | 4 | Tích hợp Watermark cá nhân hóa và Dynamic QR Code | 7 | Link | Tự động gắn watermark `@username` và mã QR dẫn về trang cá nhân vào góc ảnh xuất Story để tạo vòng lặp lan tỏa tự nhiên. |
| **35** | 18 | 4 | Tối ưu hiệu năng đồ họa Canvas 60 FPS | 9 | Link | Áp dụng kỹ thuật Batch Layering (chia 3 layer: Background, Connectors, Interactive Stickers); chống giật lag khi có hàng trăm sticker. |
| **39** | 20 | 4 | [Bonus] Cấu hình PWA (Progressive Web App) | 5 | Link (x) | Thiết lập manifest, service worker cho phép cài đặt Doodly trực tiếp lên màn hình chính điện thoại như ứng dụng native. |

---

### 🛡️ MODULE 2: BACKEND ARCHITECTURE & SOCIAL CORE (Phụ trách: Thành viên 2 - TV2)
*Mục tiêu: Đảm bảo sự ổn định của hệ thống lõi NestJS, thiết kế CSDL chuẩn mực, logic phân quyền mạng xã hội chặt chẽ và API non-blocking.*

| STT (Excel) | Ngày | Sprint | Tên công việc | Điểm | Yêu cầu nộp | Mô tả chi tiết |
| :---: | :---: | :---: | :--- | :---: | :---: | :--- |
| **2** | 1 | 1 | Thiết kế kiến trúc hệ thống và luồng dữ liệu (DFD) | 8 | File | Vẽ sơ đồ kiến trúc tổng thể Client-Server, luồng xử lý bất đồng bộ BullMQ và luồng dữ liệu AI Pipeline. |
| **3** | 2 | 1 | Thiết kế CSDL PostgreSQL và viết migration script | 10 | File | Thiết kế ERD chuẩn hóa gồm các bảng users, journal_entries, canvas_stickers, friendships, reactions, milestones; chạy migration tạo schema. |
| **5** | 3 | 1 | Khởi tạo dự án NestJS và cấu hình Clean Architecture | 8 | Link | Setup NestJS, cấu trúc Controllers, Services, Repositories, DTOs, tích hợp Prisma/TypeORM và global validation pipe. |
| **10** | 6 | 2 | Xây dựng Module Authentication & User Profile | 8 | Link | Đăng ký, đăng nhập với JWT, phân quyền tier (Free/Pro), API cập nhật profile và username cá nhân hóa. |
| **11** | 6 | 2 | Xây dựng Module Journal Entry Backend | 8 | Link | API tạo mới, xem danh sách và cập nhật nhật ký hàng ngày; validate độ dài 15-150 ký tự; kiểm tra giới hạn 1 entry/ngày. |
| **16** | 9 | 2 | Tích hợp thông báo trạng thái sinh ảnh qua SSE | 7 | Link | Xây dựng endpoint Server-Sent Events (SSE) để thông báo cho client trạng thái sticker đã tạo xong kèm URL ảnh. |
| **21** | 11 | 3 | Xây dựng Module Friendships và kết bạn hai chiều | 8 | Link | API gửi lời mời kết bạn, chấp nhận, từ chối, hủy kết bạn, danh sách bạn bè kèm trạng thái online/streak. |
| **22** | 11 | 3 | Xây dựng Guards kiểm soát quyền truy cập Canvas | 9 | Link | Triển khai RBAC Guard kiểm tra quyền truy cập Canvas theo 3 cấp độ: Private (chỉ chủ sở hữu), Friends (bạn bè), Public (công khai). |
| **31** | 16 | 4 | Xây dựng logic tự động gom cụm Milestone | 8 | Link | Thuật toán backend tự động phát hiện và gom nhóm sticker khi đạt các mốc 3 ngày, 7 ngày, 30 ngày, tính toán bounding box. |
| **36** | 18 | 4 | Viết Unit Test và Integration Test toàn diện | 8 | Link | Viết test cho NestJS Services, BullMQ Worker, Guard phân quyền và thuật toán tính tọa độ S-Curve; độ phủ test >75%. |
| **38** | 19 | 4 | Kiểm thử tải (Load Testing) và thiết lập Rate Limiter | 7 | Link | Chạy kiểm thử tải mô phỏng người dùng đồng loạt check-in, cấu hình Redis Rate Limiting chống spam và bot lạm dụng API. |

---

### ⚙️ MODULE 3: AI PIPELINE & DEVOPS INFRASTRUCTURE (Phụ trách: Thành viên 3 - TV3)
*Mục tiêu: Đảm bảo độ ổn định và chất lượng thẩm mỹ của quy trình sinh sticker AI, tối ưu thời gian phản hồi, quản lý hàng đợi và chi phí Cloud.*

| STT (Excel) | Ngày | Sprint | Tên công việc | Điểm | Yêu cầu nộp | Mô tả chi tiết |
| :---: | :---: | :---: | :--- | :---: | :---: | :--- |
| **6** | 3 | 1 | Thiết lập môi trường Docker Compose và Cloudflare R2 | 7 | Link | Cấu hình docker-compose cho PostgreSQL, Redis; tạo tài khoản Cloudflare R2, cấu hình bucket và chính sách cache CDN. |
| **7** | 4 | 1 | Nghiên cứu và tích hợp Google Gemini 1.5 Flash API | 8 | Link | Viết module kết nối Gemini SDK, tinh chỉnh System Prompt trích xuất thực thể ngữ nghĩa, cảm xúc và visual metaphor sang định dạng JSON. |
| **8** | 4 | 1 | Nghiên cứu Image Gen Engine và chuẩn hóa Base Prompt | 8 | Link | Thử nghiệm API sinh ảnh (Diffusion/Flux), chuẩn hóa prompt template tạo sticker die-cut viền dày đen trắng đồng nhất phong cách. |
| **13** | 7 | 2 | Xây dựng BullMQ Job Queue xử lý AI bất đồng bộ | 9 | Link | Thiết lập hàng đợi BullMQ với Redis, tạo producer đẩy task sinh sticker, quản lý trạng thái QUEUED, PROCESSING, COMPLETED, FAILED. |
| **14** | 8 | 2 | Xây dựng Worker AI Pipeline hoàn chỉnh | 10 | Link | Worker xử lý chuỗi: gọi Gemini trích xuất JSON $\rightarrow$ ghép Base Prompt gọi Diffusion Model sinh ảnh sticker raster. |
| **15** | 8 | 2 | Xây dựng dịch vụ tách nền Rembg và lưu trữ R2 | 9 | Link | Service tự động bóc tách nền trắng giữ viền die-cut, nén tối ưu sang định dạng PNG/WebP trong suốt (<150KB), đẩy asset lên R2. |
| **29** | 15 | 3 | [Bonus] Cơ chế Smart Prompt Caching giảm chi phí AI | 6 | Link (x) | Lưu hash các hoạt động phổ biến vào Redis, tái sử dụng sticker có sẵn trong kho thư viện chung nếu người dùng đồng ý. |
| **37** | 19 | 4 | Deploy toàn bộ hệ thống lên môi trường Production | 10 | Link | Deploy Frontend lên Vercel/Cloudflare Pages, Backend lên VPS/Render qua Docker, PostgreSQL & Redis Managed; cấu hình domain và HTTPS. |

---

### 🤝 CÔNG VIỆC CHUNG & HỌP NHÓM TỔNG KẾT (Cả nhóm TV1, TV2, TV3)
*Mục tiêu: Đồng bộ giao tiếp liên tục, kiểm soát tiến độ từng Sprint và chuẩn bị tốt nhất cho buổi bảo vệ đồ án trước hội đồng.*

| STT (Excel) | Ngày | Sprint | Tên công việc | Điểm | Yêu cầu nộp | Phối hợp thực hiện |
| :---: | :---: | :---: | :--- | :---: | :---: | :--- |
| **1** | 1 | 1 | Phân tích yêu cầu và hoàn thiện tài liệu SRS | 10 | Link | Cả 3 thành viên cùng ngồi lại làm rõ flow nghiệp vụ, chốt phạm vi tính năng. |
| **9** | 5 | 1 | Họp nhóm tổng kết Sprint 1 và nghiệm thu kiến trúc | 4 | Không | Họp chốt Interface dữ liệu và thống nhất Base Framework. |
| **20** | 10 | 2 | Họp nhóm tổng kết Sprint 2 và demo luồng sinh sticker | 4 | Không | Demo trực tiếp luồng Check-in $\rightarrow$ AI sinh ảnh $\rightarrow$ Konva Canvas. |
| **30** | 15 | 3 | Họp nhóm tổng kết Sprint 3 và nghiệm thu Social | 4 | Không | Kiểm thử liên thông kết bạn, phân quyền Canvas và thả reaction chéo. |
| **40** | 20 | 4 | Nghiệm thu toàn diện dự án và hoàn thiện Slide bảo vệ | 10 | File | Tổng duyệt E2E sản phẩm, hoàn thiện slide thuyết trình và chuẩn bị kịch bản live-demo. |

---

## III. KẾ HOẠCH PHỐI HỢP LIÊN THÔNG (DEPENDENCIES & HANDOFF)

1. **Sprint 1 (Ngày 1 - 5): Khởi tạo & Định hình chuẩn giao tiếp**
   * **TV2** (DB Schema) bàn giao mô hình dữ liệu cho **TV1** (FE Models) và **TV3** (Worker Schemas).
   * **TV3** cung cấp chuẩn JSON output từ Gemini để **TV1** và **TV2** nắm được cấu trúc `extracted_keywords`.

2. **Sprint 2 (Ngày 6 - 10): Nối luồng Core Pipeline**
   * **TV1** làm giao diện Check-in $\rightarrow$ gọi API của **TV2**.
   * **TV2** đẩy Job vào Redis $\rightarrow$ Worker của **TV3** tiếp nhận, gọi AI tạo ảnh, bóc tách nền và đẩy lên Cloudflare R2.
   * **TV2** bắn thông báo SSE về cho **TV1** $\rightarrow$ **TV1** đón lấy URL và vẽ sticker lên Konva Canvas.

3. **Sprint 3 (Ngày 11 - 15): Đồng bộ Phân quyền & Tương tác Bạn bè**
   * **TV2** làm RBAC Guard $\rightarrow$ **TV1** dựa vào quyền (Owner/Visitor) để bật tắt chế độ Edit hoặc View-Only trên Canvas.
   * **TV1** hoàn thiện thuật toán S-Curve và vẽ reaction $\rightarrow$ **TV2** cung cấp API lưu trữ tọa độ reaction.

4. **Sprint 4 (Ngày 16 - 20): Hoàn thiện, Tối ưu & Đưa lên Production**
   * **TV3** deploy Backend, Database, Redis lên Production.
   * **TV1** deploy Frontend lên Vercel/Cloudflare Pages và trỏ API domain.
   * Cả 3 thành viên cùng chạy kiểm thử tải, diễn tập demo và hoàn thiện Slide bảo vệ.
