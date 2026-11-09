# Backend Sprint 1 — B01–B05

## Phạm vi và quyết định

Nguồn: `docs/DoodleLife-backlog-upload (1).xlsx`, Sprint 1, B01–B05;
contract A01 trên `origin/feature/t04fc4c-a01-mvp-scope`.
Backend dùng NestJS, PostgreSQL, Supabase Auth email/password và private Storage.
Controller xử lý HTTP; service giữ nghiệp vụ; Database quản lý giao dịch/owner.
Không triển khai worker/retry/quota/cursor/idempotency của B06–B09.
Không triển khai AI hoặc upload của C03–C05.

Một entry/người/ngày; server tính ngày UTC+7 mặc định. Cho phép ngày quá khứ
đúng định dạng theo A01; cấm ngày tương lai. Nội dung trim, 1–300 Unicode code points.
A01 có các mục bổ sung nhiều sticker, cursor và recap: không thuộc B Sprint 1.
Danh sách hiện trả tối đa 50 entry mới nhất, chưa có cursor.

## Chạy local

Yêu cầu Node 22+, Docker/PostgreSQL 16 và project Supabase.

```powershell
npm ci
Copy-Item .env.example .env
docker compose up -d
# Điền .env bằng cấu hình thật của project Supabase, khóa ký >=32 ký tự.
npm run migrate
npm run migrate # chạy lại không áp dụng trùng
npm run dev
```

Dev theo dõi bản compiled trong dist; sau khi sửa source chạy `npm run build`
ở terminal khác để Node tự khởi động lại.

API: `http://localhost:3001/api/v1/health`. Dùng tài khoản test tạo trong Supabase
Auth, bật email/password. Không có tài khoản/password mặc định trong repo.
Chạy `deploy/supabase-storage.sql`; kiểm tra bucket private và không có policy
anon/authenticated nào cấp quyền cho `stickers`. Chỉ backend/C dùng service-role.
Ứng dụng production phải kết nối database bằng role riêng không SUPERUSER,
không BYPASSRLS; cấp CONNECT/USAGE và SELECT/INSERT/UPDATE/DELETE trên bốn bảng
nghiệp vụ và users. Chạy migration bằng role quản trị riêng.
RLS FORCE bảo vệ cả table owner thông thường; superuser/BYPASSRLS vẫn vượt RLS,
vì vậy API luôn có điều kiện user_id ngay cả khi local dùng postgres superuser.
Không bật public access/PostgREST grants cho các bảng này.

```powershell
npm run lint
npm run typecheck
npm run build
npm test
npm start
```

## API cho A

Mọi response: `{success:true,data:...}`; lỗi `{success:false,error:{code,message}}`.
Các route entries cần `Authorization: Bearer <access_token>`.
Không nhận user_id trong body. Tài nguyên không thuộc owner trả 404 để tránh lộ ID.

| Method /api/v1 | Body / kết quả |
| --- | --- |
| POST /auth/login | `{email,password}` → Supabase user/session |
| POST /auth/refresh | `{refresh_token}` → user/session mới |
| GET /auth/session | Bearer → `{user:{id}}` |
| POST /auth/logout | Bearer → thu hồi refresh sessions toàn bộ thiết bị |
| POST /entries | `{content,entry_date?,mood?,time_of_day?}` → entry, primary_sticker, job queued |
| GET /entries | `{items}` tối đa 50, entry_date DESC/id DESC |
| GET /entries/:id | entry, stickers, primary_sticker, job |
| DELETE /entries/:id | success/message, cascade sticker/job |
| GET /images/:id | URL ký từ detail, hết hạn sau 300 giây; trả bytes ảnh |

Lỗi 400: INVALID_CONTENT, INVALID_ENTRY_DATE, INVALID_METADATA, INVALID_FIELDS.
401: AUTH_REQUIRED, INVALID_SESSION. 409: DUPLICATE_ENTRY_FOR_DATE.
Danh tính xác minh trực tiếp với Supabase Auth; token hết hạn/giả bị từ chối.
Theo Supabase, JWT access đã phát có thể còn hiệu lực đến hết TTL sau logout;
frontend phải xóa access/refresh token, dùng TTL ngắn trên provider.
Không log body/token/provider error. Đặt rate limit tại gateway cho auth khi deploy.

## Hợp đồng tích hợp C

`entries` 1—N `stickers`, `generation_jobs`; user sở hữu cả ba qua composite FK.
Tạo entry/sticker/job trong một transaction. Nội dung, mood/time_of_day nằm ở sticker.
Job có status, attempt, provider, provider_reference, error_code và timestamps.
C chỉ upload vào `stickers/<user_id>/<entry_id>/<filename>` (bucket/path tách riêng).
Lưu object_path là `<user_id>/<entry_id>/<filename>`, mime_type, size_bytes,
width/height; không lưu URL provider. Database giới hạn MIME và kích thước 10 MiB;
C vẫn phải kiểm tra bytes thực theo C04.
C cập nhật metadata/job trong transaction, khóa entry bằng SELECT FOR UPDATE
và kiểm tra nó còn tồn tại; không upsert/tạo lại entry. FK chặn kết quả trả muộn
sau DELETE. Nếu upload xong nhưng entry đã xóa, C phải dọn object mồ côi.
Backend xóa metadata/job nguyên tử; URL ký cũ mất quyền ngay ở lần kiểm tra sau.
Bytes đã tải hoặc request đang tải trước DELETE không thể thu hồi.
Object vật lý chưa được xóa khỏi bucket trong B05; C cần cleanup orphan,
nhưng object không còn đường truy cập người dùng qua API hoặc bucket private.

## Staging và nghiệm thu

`render.yaml` là blueprint triển khai backend. Nhập các biến `sync:false` trong
dashboard, dùng PostgreSQL staging, chạy migration qua máy/CI có secret trước
khi deploy. PUBLIC_API_URL là URL HTTPS thật, CORS_ORIGIN là origin frontend.
Smoke test login → create → refresh → detail → delete bằng hai tài khoản;
kiểm tra health và URL ảnh trước/sau delete khi C04 tích hợp.
Không có staging URL hoặc secret được cung cấp trong phiên thực hiện này.

| Task | Phần đã triển khai | Còn để đạt DoD |
| --- | --- | --- |
| B01 | local app, env mẫu, CI, Docker/Render blueprint, PR template | deploy staging thật, CI remote, PR/review |
| B02 | schema, RLS, indexes, migration có version/transaction | chạy trên DB staging và review |
| B03 | Supabase login/logout/refresh/session, guard | smoke test tài khoản provider thật và review |
| B04 | owner filters, RLS, signed image proxy, test hai owner | storage C04 thật, smoke test hai tài khoản và review |
| B05 | create/detail/list/delete, validation, atomic cascade | tích hợp A/C staging và review |

Kiểm thử tự động dùng PostgreSQL WASM (PGlite), không mock SQL: constraint,
RLS role không đặc quyền, owner isolation, cascade, FK chặn resurrection;
test auth dùng provider stub, không khẳng định đã gọi provider thật.
CI có PostgreSQL 16 để chạy migration hai lần. Chỉ đánh dấu DONE sau CI xanh,
staging có minh chứng và ít nhất một thành viên khác approve theo A01.

## Git

Nhánh `feat/b01-b05-sprint-1`; Conventional Commits `chore/feat/fix/test/docs(scope): ...`.
PR nêu task, behavior, checks và giới hạn; không commit secret hoặc sửa task A/C.
Không tự merge vào main. Các file Excel nguồn giữ nguyên và không đưa vào commit code.
