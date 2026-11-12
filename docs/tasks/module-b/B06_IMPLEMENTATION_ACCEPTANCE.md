# B06 — Phân tích, tương thích và nghiệm thu

Ngày: 12/11/2026. Phạm vi: chỉ B06; không triển khai worker B07, quota B08,
cursor B09 hoặc provider AI của C. Commit B06 chứa code, migration, test/eval và tài liệu này.

## Yêu cầu và thiết kế đã triển khai

Backlog B06 yêu cầu tạo entry/job nhất quán, chống gửi lặp bằng key + constraint,
đọc trạng thái đúng owner và kiểm thử hai yêu cầu đồng thời.
Phụ thuộc nghiệp vụ B05/C05; C05 chưa có code trong các nhánh đã kiểm tra nên
nghiệm thu này xác minh queue record bền vững, không khẳng định AI thật đã chạy.

1. `POST /api/v1/entries` bắt buộc `Idempotency-Key` UUID. Frontend tạo key một lần
   cho một ý định submit và giữ key/body khi timeout hoặc gửi lại. Sửa nội dung
   thành một yêu cầu mới thì tạo key mới. Key không phải thông tin xác thực.
2. Fingerprint SHA-256 dựa trên content đã trim, mood chuẩn hóa, date/time do
   client truyền và version. Không dùng ngày/buổi server suy ra làm fingerprint;
   replay qua nửa đêm phải về cùng entry chứ không đổi sang ngày mới.
3. Trong transaction owner, insert `api_requests` với unique
   `(user_id,operation,idempotency_key)`, `ON CONFLICT DO NOTHING`.
   Khi key trùng, PostgreSQL chờ transaction cạnh tranh hoàn tất; SELECT kế tiếp
   đọc record đã commit. Không dùng map/in-memory lock nên nhiều API process
   cùng dùng một database vẫn dựa vào ràng buộc DB.
4. Key mới: tạo entry/sticker/job và nối request record cùng transaction.
   Nếu một bước lỗi, rollback tất cả. Key trùng cùng fingerprint trả cùng IDs và
   trạng thái job hiện tại; không reset/enqueue lại job.
5. Key trùng khác fingerprint → 409 `IDEMPOTENCY_KEY_REUSED`.
   Key khác nhưng cùng user/ngày → 409 `DUPLICATE_ENTRY_FOR_DATE`.
   Chỉ ánh xạ đúng unique constraint ngày; không che mọi lỗi 23505 như code cũ.
6. DELETE giữ request tombstone, FK SET NULL entry/job; replay → 410
   `RESOURCE_DELETED`. Không xóa key/giới hạn retention trong phạm vi B06.
   Replay giữ KEY SHARE trên entry khi đọc để phối hợp với DELETE; không giữ
   row lock request khi chờ entry, tránh chu kỳ khóa ngược với cascade DELETE.
7. Migration 002 bổ sung unique job/sticker và composite FK sticker/entry/owner.
   Một sticker có một logical job; worker cập nhật status/attempt trên job đó.
   Nếu sau này cần nhiều job lịch sử trên cùng sticker phải thiết kế migration
   và contract riêng, không bỏ constraint chỉ để insert thêm job.

## API polling và trạng thái

`GET /api/v1/jobs/:id`, header Authorization Bearer như entries.

```json
{
  "success": true,
  "data": {
    "id": "<job UUID>",
    "entry_id": "<entry UUID>",
    "status": "queued",
    "attempt": 0,
    "error_code": null,
    "progress_percent": null,
    "sticker_url": null
  }
}
```

Status lấy trực tiếp database: queued/processing/succeeded/failed. Không giả lập
60% khi provider không trả tiến độ; chỉ succeeded là 100. sticker_url chỉ cấp
khi succeeded và có object metadata, dùng cùng signed proxy B04.
Không lộ object_path/provider_reference/raw error/content qua endpoint jobs.
Thiếu/hết hạn token → 401; UUID sai → 400; job không tồn tại/khác owner/đã xóa → 404.
A dừng polling ở trạng thái kết thúc hoặc khi 401/404; tải lại lấy job ID từ detail.

## Eval tương thích

| Thành phần | Kết quả / hành động tích hợp |
| --- | --- |
| B01 bootstrap/CI | JobsController/JobsService đăng ký thêm; eval chạy trong CI với PostgreSQL 16 |
| B02 migration | Không sửa 001; runner versioned áp dụng 002 một lần, chạy lại không áp dụng trùng |
| B03 auth | Dùng lại AuthService, identity từ token; không nhận user_id ở client |
| B04 RLS/ảnh | api_requests có ENABLE/FORCE RLS; jobs join theo owner/entry; dùng lại signed URL |
| B05 create response | Giữ success/data, entry fields, primary_sticker và job; new/replay đều HTTP 201 |
| B05 list/detail/delete | Giữ route/envelope; migration bảo toàn dữ liệu cũ, delete giữ tombstone mới |
| Client không có key | Thay đổi hành vi có chủ đích: 400 INVALID_IDEMPOTENCY_KEY; A01 đã yêu cầu header, client cũ phải cập nhật |
| A05 polling | Có endpoint job thật; progress_percent có thể null, UI cần hiển thị trạng thái thay vì giả phần trăm |
| C05/C06 → B07 | Queued job vẫn cùng schema/status hiện có; chưa xác minh runner/provider thật. C cập nhật job hiện hữu, không thêm job trùng sticker |

Không bổ sung can_retry/next_retry_at trước khi có quy tắc B07/B08.
Không thay phương thức đăng nhập, timeline hoặc storage provider trong B06.

## Kết quả kiểm thử local

Môi trường: Windows Node 22, ứng dụng NestJS compiled, container PostgreSQL
`postgres:16-alpine` cổng loopback 55436. Docker chạy từ PowerShell, không dùng
Docker CLI trong Ubuntu. Auth HTTP dùng stub có owner A/B và token invalid;
không có lời gọi Supabase Auth/AI/Storage thật trong eval.

`npm run lint`, `npm run typecheck`, `npm run build`: PASS.
`npm test`: 3/3 nhóm regression B01–B05 PASS sau khi bổ sung header/key cần thiết.
`npm run eval:b06`: 15/15 tình huống E01–E15 PASS (Node TAP đếm thêm parent
thành 16 tests), không skip. Không có TEST_DATABASE_URL thì eval fail rõ ràng.

| Eval | Assertion chính | Kết quả |
| --- | --- | --- |
| E01 | Upgrade dữ liệu legacy B05 giữ entry/sticker/job, đọc/list/xóa được | PASS |
| E02 | Barrier hai transaction/pg_backend_pid khác nhau; cùng key có đúng 1 entry/sticker/job/request | PASS |
| E03 | Trim-equivalent replay trả cùng ID và trạng thái processing/attempt hiện tại | PASS |
| E04 | Khác content/date/mood/time cùng key → 409 | PASS |
| E05 | Khác key cùng ngày đồng thời → một thành công, một duplicate; không có request rác | PASS |
| E06 | Cùng key giữa hai owner độc lập, owner B không đọc job A, response allowlist | PASS |
| E07 | DB từ chối job trùng sticker hoặc gắn sticker khác entry | PASS |
| E08 | Role không đặc quyền không đọc/ghi api_requests của owner khác | PASS |
| E09 | HTTP compiled: health/auth/UUID/header/envelope/list/detail và status codes | PASS |
| E10 | DELETE → job 404, key replay 410, không phục hồi entry | PASS |
| E11 | Replay cùng key sau nửa đêm UTC+7 giữ entry_date/time_of_day cũ | PASS |
| E12 | Hai HTTP POST đồng thời trả cùng entry/job và response shape B05 | PASS |
| E13 | 5 lần replay đua DELETE: không deadlock/phục hồi entry | PASS |
| E14 | Lỗi insert job rollback entry/sticker/key; gửi lại key sau sửa lỗi thành công | PASS |
| E15 | Toàn luồng create/replay/poll/delete chạy bằng role không superuser, FORCE RLS | PASS |

Migration runner thực thi trên database disposable mới: lần 1 applied 001 + 002;
lần 2 không có migration mới, exit 0. Chưa chạy migration trên staging.
Migration fail an toàn nếu dữ liệu hiện có chứa nhiều jobs/sticker hoặc linkage
sai; cần kiểm tra/sửa dữ liệu có review trước deploy, không tự xóa job để migration pass.

## Chạy lại eval

Dùng database test riêng, role có quyền tạo schema/role cho eval RLS;
không dùng database chứa nhật ký thật. Eval tạo schema UUID, tự dọn schema/role
của nó; không xóa bảng/schema có sẵn. Các quyền đó chỉ dành cho test, không cấp
cho API production.

```powershell
npm ci
$env:TEST_DATABASE_URL='postgresql://<test-user>:<test-password>@localhost:<port>/<test-db>'
npm run eval:b06
npm test
npm run lint
npm run typecheck
```

Deploy: chạy `npm run migrate` bằng migration role; API role cần quyền
SELECT/INSERT/UPDATE trên api_requests và USAGE schema như các bảng cũ.
Không cấp API quyền DELETE api_requests để giữ tombstone. Nếu cần dọn retention
sau MVP phải định nghĩa lại thời hạn idempotency. Key không chứa raw nhật ký nhưng
fingerprint/tombstone vẫn là metadata riêng tư, chịu RLS.

## Kết luận nghiệm thu

Đạt các tiêu chí kỹ thuật B06 được kiểm chứng local: transaction nhất quán,
idempotency/constraints, concurrent requests và job ownership. Eval tương thích
chỉ ra hai điểm frontend cần đáp ứng: header bắt buộc và progress nullable.
Chưa tuyên bố DONE đầy đủ theo DoD nhóm cho đến khi CI remote xanh, tích hợp C05
trên staging có bằng chứng và một thành viên khác review/approve.
Không coi test fake Auth là minh chứng Supabase hoặc AI thật đã hoạt động.
