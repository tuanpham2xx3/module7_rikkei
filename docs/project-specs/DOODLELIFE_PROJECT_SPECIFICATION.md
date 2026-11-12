# DOODLELIFE: AI-POWERED VISUAL JOURNAL & INFINITE SOCIAL CANVAS
> **Tài liệu Đặc tả Yêu cầu Kỹ thuật & Thiết kế Kiến trúc Toàn diện**  
> **Nhóm thực hiện:** Nhân, Tuấn, Tiến  
> **Phiên bản:** 2.0 (Bổ sung Kiến trúc Mạng xã hội & Cơ chế Phân quyền Canvas)

---

## 1. TỔNG QUAN DỰ ÁN & VẤN ĐỀ CỐT LÕI

### 1.1. Bối cảnh & Điểm nghẽn (Problem Statement)
Thói quen ghi chép nhật ký mang lại giá trị cảm xúc và phản tư cao, tuy nhiên đối tượng người dùng trẻ (Gen Z, Millennials) thường đối mặt với các rào cản lớn:
* **Hội chứng trang giấy trắng:** Áp lực phải viết dài, hành văn chỉnh chu khiến tỷ lệ rời bỏ (churn rate) sau 3 ngày vượt mức 70%.
* **Sự đơn điệu của Mood Tracker:** Các công cụ định lượng cảm xúc hiện tại (DailyBean, Year in Pixels) dựa trên các icon tĩnh hoặc bảng màu đơn sắc, thiếu tính cá nhân hóa và chiều sâu kỷ niệm.
* **Mạng xã hội độc hại & áp lực phô diễn (Toxic Social Media):** Người trẻ ngày càng ngại đăng bài dài trên Facebook hay đăng ảnh quá "hoàn hảo" trên Instagram, nhưng lại thiếu một không gian ấm cúng, nhẹ nhàng để chia sẻ nhịp sống chân thực hàng ngày cùng bạn bè thân thiết.

### 1.2. Tầm nhìn Sản phẩm (Product Vision)
**DoodleLife** tái định nghĩa trải nghiệm ghi nhật ký thông qua mô hình thị giác hóa micro-journaling kết hợp không gian xã hội thân mật:
* **Text-to-Doodle Sticker:** Biến 1–2 câu ghi chép ngắn thành một sticker doodle đen trắng phong cách hoạt hình ngộ nghĩnh, viền dày (die-cut sticker), tối ưu nhận diện trực quan tức thì.
* **Endless Canvas Paradigm:** Thay thế các trang sách rời rạc bằng một tấm bảng cuộn vô tận. Các sticker được kết nối tự động bằng đường dẫn uốn lượn, mũi tên, chùm sao, tạo nên "bản đồ dòng đời" sống động.
* **Intimate Social Canvas (Private - Friends - Public):** Cho phép bạn bè ghé thăm và lướt trên dòng đời của nhau, thả các sticker cảm xúc (reactions) cổ vũ mà không tạo áp lực câu view/câu like.

---

## 2. HỆ THỐNG TÍNH NĂNG CỐT LÕI (CORE FEATURES)

### 2.1. Check-in Siêu tốc (Micro-Journaling Input)
* Giao diện nhập liệu tối giản với một ô nhập duy nhất (15 – 150 ký tự), hỗ trợ gợi ý nhanh (thời tiết, cảm xúc, hoạt động).
* Hỗ trợ chọn quyền riêng tư ngay khi tạo: **Private** (Chỉ mình tôi), **Friends** (Chỉ bạn bè), hoặc **Public** (Công khai).
* Cho phép chọn ngày quá khứ để ghi bù nhật ký đã lỡ.

### 2.2. AI Doodle Generation Pipeline (Quy trình Sinh Sticker)
Quy trình chuyển đổi văn bản sang asset đồ họa hoạt động qua 3 bước khép kín:
1. **Bước 1 - LLM Orchestrator (Google Gemini 1.5 Flash):** Phân tích ngữ nghĩa câu chuyện, trích xuất 1–3 thực thể hình ảnh trọng tâm, tâm trạng chủ đạo, loại bỏ chi tiết thừa, xuất cấu trúc JSON chuẩn (`objects`, `emotion`, `visual_metaphor`).
2. **Bước 2 - Image Generation Engine (Diffusion Model / Flux / SDXL):** Ghép metadata từ JSON vào Base Style Prompt: `[visual_scene], bold black outline, cute doodle sticker, thick white border, cartoon style, flat 2D vector, black and white ink, minimalist, isolated on solid white background`.
3. **Bước 3 - Post-processing & Optimization (Rembg Service):** Tự động bóc tách nền trắng, giữ lại viền trắng die-cut sticker, nén sang WebP/PNG trong suốt 512x512 px (< 150 KB).

### 2.3. Endless Doodle Canvas (Tấm Bảng Vô Tận)
* **Thuật toán sắp xếp tự động (S-Curve Packing Layout):** Tự động bố trí sticker theo trục uốn lượn hình chữ S hoặc ziczac theo trục thời gian, chống va chạm đè lấn (collision detection).
* **Dynamic Connectors:** Tự động sinh đường nét đứt, mũi tên vẽ tay, cụm mây, ngôi sao lấp lánh để nối sticker ngày $N$ với ngày $N+1$.
* **Tương tác trực tiếp:** Hỗ trợ kéo thả (drag-and-drop), xoay góc nhẹ (-15° đến +15°), thay đổi kích thước và pinch-to-zoom (20% – 200%), pan 2D không giới hạn.

### 2.4. Đóng gói Cột mốc & Viral Share (Milestones)
* Tự động tổng hợp cột mốc 3 ngày, 7 ngày, 30 ngày kèm typography doodle ở trung tâm ("3 DAYS SPRINT", "OCTOBER RECAP").
* Xuất ảnh 1-chạm tỷ lệ **9:16** (Instagram Story, TikTok, Threads) và **16:9** (Desktop Wallpaper) kèm mã QR và URL cá nhân hóa `doodlelife.app/@username`.

---

## 3. TÍNH NĂNG MẠNG XÃ HỘI & PHÂN QUYỀN (SOCIAL CANVAS)

### 3.1. Ba Cấp độ Riêng tư (Privacy Modes)
| Cấp độ | Phạm vi hiển thị | Mô tả chi tiết |
| :--- | :--- | :--- |
| **Private (Mặc định)** | Chỉ chủ nhân Canvas | Mặc định áp dụng cho các nhật ký mang tính nhạy cảm, tâm sự riêng tư. Khách hay bạn bè vào Canvas sẽ không thấy sticker này. |
| **Friends** | Bạn bè kết nối 2 chiều | Chỉ những tài khoản có trạng thái bạn bè (`ACCEPTED`) mới có thể zoom/pan xem được các sticker và dòng đời này. |
| **Public** | Bất kỳ ai có liên kết | Bất kỳ ai ghé thăm `doodlelife.app/@username` đều có thể chiêm ngưỡng bảng Doodle nghệ thuật của bạn. |

### 3.2. Không gian Bạn bè (Friends Feed & Canvas Visit)
* **Chế độ ghé thăm (Visitor View-Only Mode):** Bạn bè hoặc khách mở Canvas ở chế độ xem an toàn (không kéo chỉnh sửa được sticker, chỉ có quyền pan, zoom và tương tác xã hội).
* **Friends River (Dòng bạn bè):** Tab danh sách bạn bè thân thiết kèm avatar doodle đại diện hôm nay và chuỗi ngày duy trì (Streak counter). Bấm vào bạn bè là chuyển cảnh camera lướt sang Canvas của người đó.
* **Hệ thống kết bạn:** Gửi lời mời qua username hoặc quét mã QR cá nhân trên Story.

### 3.3. Tương tác Cảm xúc Tinh tế (Doodle Reactions)
* Không dùng nút "Like" gây áp lực số liệu; thay vào đó là **Doodle Reaction Stickers**:
  * Hình trái tim vẽ tay (`heart_doodle`)
  * Ly bia/trà sữa chạm cốc (`cheers_doodle`)
  * Vòng tay ôm an ủi (`hug_doodle`)
  * Ngọn lửa cháy bùng cháy cổ vũ (`fire_doodle`)
* Bạn bè có thể chọn một reaction nhỏ và ghim trực tiếp cạnh sticker của bạn trên Canvas.

---

## 4. KIẾN TRÚC KỸ THUẬT CHI TIẾT (TECHNICAL ARCHITECTURE)

### 4.1. Sơ đồ Tổng thể Hệ thống

```
+-------------------------------------------------------------------------+
|                               Client Layer                              |
|                       Next.js (App Router) + React                      |
|  +-----------------------------------+-------------------------------+  |
|  |     Konva.js Engine (react-konva) |  Social UI & Friends Hub      |  |
|  |     - Layer 1: Background         |  - Privacy Toggle (P/F/Pub)   |  |
|  |     - Layer 2: Connectors         |  - Friend List & Streak Badge |  |
|  |     - Layer 3: Interactive Stk    |  - Doodle Reaction Tray       |  |
|  |     - Layer 4: Visitor Reactions  |  - Canvas Exporter (9:16)     |  |
|  +-----------------------------------+-------------------------------+  |
+------------------------------------+------------------------------------+
                                     | HTTP REST / SSE / WebSocket
+------------------------------------v------------------------------------+
|                               Backend Layer                             |
|                        NestJS Clean Architecture                        |
|  +-----------------------+----------------------+--------------------+  |
|  | Auth & Users Module   | Journal & Canvas Mod | Social & Friendship|  |
|  +-----------------------+----------------------+--------------------+  |
|  | Rate Limiter & Quota  | BullMQ Job Producer  | SSE Notification   |  |
|  +-----------------------+----------------------+--------------------+  |
+------------------+-----------------------------+------------------------+
                   |                             |
         +---------v---------+         +---------v---------+
         |    PostgreSQL     |         |    Redis Cache    |
         |  Users, Entries,  |         | Rate Limit, Quota |
         |  Stickers, Social |         | BullMQ Task Queue |
         +-------------------+         +---------+---------+
                                                 |
                                       +---------v---------+
                                       |   AI Worker Node  |
                                       | - Gemini 1.5 Fl.  |
                                       | - Image Gen API   |
                                       | - Rembg Service   |
                                       +---------+---------+
                                                 |
                                       +---------v---------+
                                       |   Cloudflare R2   |
                                       | Sticker Storage   |
                                       +-------------------+
```

### 4.2. Thiết kế Cơ sở Dữ liệu (Database Schema)

```sql
-- 1. Bảng người dùng
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    tier VARCHAR(20) DEFAULT 'FREE', -- 'FREE', 'PRO'
    canvas_privacy VARCHAR(20) DEFAULT 'FRIENDS', -- 'PRIVATE', 'FRIENDS', 'PUBLIC'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Bảng nhật ký hàng ngày (Journal Entries)
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    raw_prompt TEXT NOT NULL,
    privacy VARCHAR(20) DEFAULT 'FRIENDS', -- 'PRIVATE', 'FRIENDS', 'PUBLIC'
    extracted_keywords JSONB, -- { objects: [], emotion: '', visual_scene: '' }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_date UNIQUE(user_id, entry_date)
);

-- 3. Bảng tọa độ hiển thị Sticker trên Canvas
CREATE TABLE canvas_stickers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    pos_x FLOAT NOT NULL DEFAULT 0.0,
    pos_y FLOAT NOT NULL DEFAULT 0.0,
    rotation FLOAT NOT NULL DEFAULT 0.0,
    scale FLOAT NOT NULL DEFAULT 1.0,
    z_index INT NOT NULL DEFAULT 0,
    connector_type VARCHAR(50) DEFAULT 'DASHED_CURVE',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bảng Mạng xã hội & Bạn bè (Friendships)
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'BLOCKED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_friend_pair UNIQUE(requester_id, addressee_id)
);

-- 5. Bảng Tương tác cảm xúc trên Sticker (Doodle Reactions)
CREATE TABLE sticker_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sticker_id UUID REFERENCES canvas_stickers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(50) NOT NULL, -- 'HEART', 'CHEERS', 'HUG', 'FIRE'
    offset_x FLOAT DEFAULT 0.0, -- Vị trí ghim so với tâm sticker
    offset_y FLOAT DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Bảng mốc tổng kết (Canvas Milestones)
CREATE TABLE canvas_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- '3_DAYS', '7_DAYS', '30_DAYS'
    summary_title VARCHAR(100),
    bounding_box JSONB, -- { x, y, width, height }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.3. Phân chia Vai trò Triển khai (Team 3 Người)

| Thành viên | Trách nhiệm chính (Domain Ownership) | Công nghệ trọng tâm |
| :--- | :--- | :--- |
| **Nhân** | **Frontend Lead & Canvas Engineering:**<br>• Dựng cấu trúc Next.js App Router, TailwindCSS.<br>• Tích hợp Konva.js xử lý đa tầng (Background, Path, Sticker, Reaction).<br>• Thuật toán sắp xếp S-Curve Packing, cử chỉ chạm đa điểm (Pinch-to-zoom, Pan 60 FPS).<br>• Chế độ tương tác xem Canvas bạn bè (Visitor View Mode) & Xuất ảnh 9:16. | Next.js, React, `react-konva`, HTML5 Canvas API, Web Workers |
| **Anh Tuấn** | **Backend Core & Real-time Services:**<br>• Thiết kế cấu trúc NestJS (Clean Architecture: Controller, Service, Repository).<br>• Thiết kế CSDL PostgreSQL (Prisma/TypeORM) bao gồm các bảng User, Journal, Canvas, Friendships, Reactions.<br>• Quản lý tác vụ bất đồng bộ BullMQ + Redis, Rate limiting.<br>• Cơ chế xác thực Auth (JWT/OAuth2) và phân quyền dữ liệu (Guard RBAC: Private/Friends/Public). | NestJS, PostgreSQL, Redis, BullMQ, Class-Validator, JWT |
| **Anh Tiến** | **AI Pipeline, Asset Infrastructure & DevOps:**<br>• Xây dựng Worker xử lý AI: Tích hợp Gemini 1.5 Flash trích xuất thực thể ngữ nghĩa chuẩn JSON.<br>• Tích hợp Image Generation API sinh sticker đồng nhất phong cách die-cut doodle.<br>• Xây dựng microservice bóc tách nền Rembg tự động.<br>• Cấu hình lưu trữ và CDN Cloudflare R2 (Zero Egress Fees), Dockerize và CI/CD deployment. | Google Gemini SDK, Image Gen API, Python/Rembg, Cloudflare R2, Docker |

---

## 5. BẢO MẬT PHÂN QUYỀN & CHIẾN LƯỢC CHI PHÍ PRODUCTION

### 5.1. Phân quyền Truy cập Canvas (Authorization Logic)
Khi một client gửi yêu cầu `GET /api/canvas/:username`:
1. **Nếu là chủ sở hữu (Owner):** Trả về toàn bộ stickers (bao gồm cả Private, Friends, Public) với đầy đủ quyền chỉnh sửa (Edit Mode).
2. **Nếu là khách có quan hệ Bạn bè (`ACCEPTED`):** Trả về các stickers có trạng thái `FRIENDS` và `PUBLIC`. Chế độ hiển thị là `VIEW_ONLY`, cho phép thả `Doodle Reaction`.
3. **Nếu là khách vãng lai hoặc chưa kết bạn:** Chỉ trả về các stickers được đánh dấu `PUBLIC`. Nếu toàn bộ Canvas là Private/Friends, hiển thị màn hình chờ mờ ảo "Hãy kết bạn để xem hành trình Doodle của @username".

### 5.2. Quản trị Chi phí & Tài nguyên
* **Hạn mức tài khoản:** 1 sticker chính/ngày + tối đa 2 lần tạo lại (re-roll).
* **Prompt Caching:** Lưu hash nội dung các hoạt động phổ biến (như đi làm, tập gym, uống cafe) để tái sử dụng sticker mẫu từ kho thư viện chung, giúp cắt giảm 30% chi phí gọi Image Gen API.
* **Tối ưu Băng thông với R2:** Tất cả asset ảnh sticker và reaction đều lưu trên Cloudflare R2 và kích hoạt CDN Cache vĩnh viễn (`Cache-Control: public, max-age=31536000, immutable`), loại bỏ 100% chi phí egress data transfer.

---

## 6. ĐÓNG GÓI DỰ ÁN VÀO CV THEO CHUẨN STAR

* **Situation (Bối cảnh):** Người trẻ gặp rào cản lớn khi viết nhật ký truyền thống do "hội chứng trang trắng", trong khi các mạng xã hội hiện nay tạo nhiều áp lực phô diễn và thiếu không gian chia sẻ nhịp sống nhẹ nhàng.
* **Task (Nhiệm vụ):** Cùng đội ngũ 3 người thiết kế, xây dựng và đưa lên Production một nền tảng Web App Mobile-First biến dòng nhật ký ngắn hàng ngày thành các sticker doodle nghệ thuật, tự động sắp xếp trên một tấm bảng vô tận (Endless Canvas) kèm tính năng chia sẻ bạn bè thân mật.
* **Action (Hành động):**
  * Thiết kế hệ thống Backend NestJS với mô hình Clean Architecture, xử lý hàng đợi tạo ảnh bất đồng bộ qua Redis/BullMQ, kiểm soát chặt chẽ phân quyền hiển thị (Private, Friends, Public) bằng Custom Guards.
  * Tích hợp engine đồ họa Konva.js với kỹ thuật Batch Layering đạt tần số quét 60 FPS mượt mà trên thiết bị di động, hỗ trợ pinch-to-zoom, pan 2D không giới hạn và ghim reaction cảm xúc trực tiếp lên Canvas.
  * Tối ưu hóa chuỗi AI Pipeline (Gemini 1.5 Flash trích xuất JSON $\rightarrow$ Diffusion Model sinh sticker $\rightarrow$ Rembg bóc nền tự động) và lưu trữ trên Cloudflare R2 với chi phí truyền tải 0 đồng.
* **Result (Kết quả):** Hệ thống vận hành ổn định trên Production với tỉ lệ lỗi dưới 0.5%, khả năng mở rộng tốt và tạo ra vòng lặp lan tỏa tự nhiên thông qua tính năng xuất Story 9:16 và kết nối bạn bè thân thiết.
