# B09 — API timeline phân trang và nghiệm thu

Ngày 12/11/2026. Baseline B08 `83d545b`. Một commit riêng B09 gồm query/cursor,
eval PostgreSQL và contract này. Không có migration mới: dùng index
`entries_owner_date(user_id,entry_date DESC,id DESC)` và unique primary sticker/
job-per-sticker đã có. Không triển khai frontend A06/A11 hay recap C08.

## Contract cho A06/A11

`GET /api/v1/entries?limit=15&cursor=<next_cursor>`, Bearer auth như B05.
Không truyền cursor ở trang đầu. Limit nguyên 1–50, mặc định 15.

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "<entry UUID>",
        "entry_date": "2026-11-12",
        "content": "Một ngày vui",
        "created_at": "2026-11-12T02:00:00.000Z",
        "sticker": {
          "id": "<sticker UUID>",
          "image_url": "<signed image proxy URL>",
          "is_fallback": false
        },
        "job_status": "succeeded"
      }
    ],
    "has_more": true,
    "next_cursor": "<opaque signed token>"
  }
}
```

Trường entry cũ giữ nguyên; sticker/job_status là dữ liệu thật, không mock.
Không có primary sticker → sticker=null, job_status=null; có sticker nhưng chưa
có ảnh → sticker.image_url=null. Nếu không có job của primary thì job_status=null.
Không trả object_path, provider raw error, prompt hay metadata nhạy cảm.
Ảnh dùng lại signed proxy B04, không gọi download/storage lúc lấy timeline.
URL ảnh hết hạn sau 5 phút: refresh list/detail để có URL mới.

Trang cuối/rỗng: has_more=false, next_cursor=null. Trang có đúng limit mục vẫn
có thể là trang cuối: backend lấy limit+1 để phân biệt, không đoán từ độ dài.
Không có total_count cần quét toàn lịch sử. Chỉ cho phép query limit/cursor;
limit sai/âm/quá lớn/số lẻ/lặp param → 400 INVALID_LIMIT; cursor rỗng/quá dài/
sai chữ ký/sai owner → 400 INVALID_CURSOR; field query lạ → 400 INVALID_QUERY.
Thiếu/hết hạn phiên → 401. Không tin user_id hoặc owner query do client truyền.

## Cursor và thứ tự

- Thứ tự cố định `entry_date DESC,id DESC`, so sánh tuple nhỏ hơn vị trí cursor.
  UUID là tie-breaker xác định; unique user/ngày hiện vẫn được giữ.
- Cursor mới là base64url JSON version 1 chứa owner/date/id + HMAC-SHA256.
  Đây là token vị trí opaque, không phải UUID và không phải access token.
  Frontend phải giữ nguyên chuỗi, encode khi đưa lên query, không parse/suy luận.
- Token chứa metadata ký, không mã hóa nội dung; không đưa content vào token.
  Giới hạn 2048 ký tự; kiểm tra shape/version/date/UUID/owner trước khi query.
- Nên cấu hình TIMELINE_CURSOR_SECRET riêng >=32 ký tự, server-only.
  Env cũ chưa có biến mới fallback IMAGE_SIGNING_SECRET với domain prefix
  `timeline:v1:`. Render blueprint/env mẫu đã có secret riêng.
- Rotate secret làm cursor cũ không hợp lệ; frontend quay về trang đầu khi
  INVALID_CURSOR. Token không cấp quyền ảnh hoặc quyền đọc data của owner khác.
- Token mới không tra cứu lại row cursor; xóa row mốc vẫn tiếp tục được.
- Tương thích request A01 cũ: vẫn nhận UUID của entry cuối trang trước, chỉ
  resolve trong owner. Nếu row UUID cũ đã xóa/khác owner → 400 INVALID_CURSOR;
  bắt đầu lại trang đầu. Backend luôn trả token opaque cho next_cursor mới.

## Thuật toán và tính nhất quán

Một SELECT lấy entries + LEFT JOIN primary sticker + một job của sticker đó;
lọc owner ở mọi quan hệ. Unique primary index và lateral LIMIT 1 tránh nhân bản
entry khi có thêm non-primary sticker. Không N+1 gọi detail hay gọi Storage.
Limit SQL <=51, payload <=50 entries, ký URL local. Database.owner vẫn giữ
transaction/owner RLS và các query khởi tạo user/profile như trước.

Không dùng OFFSET. Cursor gồm giá trị date/id nên không phụ thuộc entry mốc còn
tồn tại. Index owner/date/id và unique job/sticker đã đủ cho truy vấn hiện tại;
chưa đo benchmark quy mô production, không tuyên bố SLA độ trễ từ eval 100 rows.

Đây là live keyset pagination, không phải snapshot nhiều request:

- Dữ liệu không đổi: duyệt đủ, không thiếu/trùng.
- Entry mới ở phía trên cursor: hiện khi refresh trang đầu, không chen lại vào
  phần lịch sử đang tải. Ghi bù nằm dưới cursor có thể xuất hiện ở trang sau.
- Entry bị xóa: biến mất; token boundary vẫn hợp lệ. MVP không cho sửa entry_date.
- Trạng thái job/ảnh có thể đổi giữa các request; không khóa lịch sử suốt phiên UI.

A06/A11 nối API: clear cursor khi đổi account/refresh; chỉ tải khi has_more;
giữ một request tải thêm đang chạy; bỏ response cũ sau khi đổi account;
deduplicate theo entry ID trên UI để xử lý request mạng lặp. Dừng khi 401 và
chuyển đăng nhập; khi cursor lỗi reset paging; không render toàn bộ lịch sử.

## Eval tương thích và nghiệm thu local

PostgreSQL 16 thật, nhiều owner, seed 100 entries/owner và ngày có khoảng trống.
Nest compiled HTTP, Auth stub; signed URL được kiểm tra chữ ký, không download
Storage thật. Fixtures historical seed trực tiếp SQL, không tính quota giả cho
100 mục như thể đó là các user action mới.

| Eval | Assertion | Kết quả |
| --- | --- | --- |
| T01 | Duyệt 100 entry đúng thứ tự, đủ/unique | PASS |
| T02 | Limits 1/15/50 đều phủ đủ 100 mục một lần | PASS |
| T03 | Default 15, rỗng, trang cuối đủ limit và sau cuối | PASS |
| T04 | Query/limit/cursor sai kiểu, lặp, rỗng, quá dài bị chặn | PASS |
| T05 | Cursor sửa chữ ký, version/date/UUID sai và khác owner | PASS |
| T06 | Legacy UUID A01 được hỗ trợ, không resolve row người khác | PASS |
| T07 | Xóa row cursor vẫn tiếp tục đúng phần còn lại | PASS |
| T08 | Insert trước/sau cursor đúng live semantics, không trùng | PASS |
| T09 | Một SELECT trả primary/status thật, URL B04 đúng, không lộ path | PASS |
| T10 | Non-primary sticker/job không nhân bản entry hoặc thay primary | PASS |
| T11 | HTTP auth/envelope/limit/cursor và query lặp | PASS |
| T12 | Role không superuser + FORCE RLS giữ owner scope | PASS |
| T13 | Env cũ fallback secret và rotation từ chối token cũ | PASS |
| T14 | Ngày năm bốn chữ số đầu công nguyên round-trip cursor đúng | PASS |

14/14 tình huống B09 (TAP đếm parent thành 15). Regression B06 16 ca, B07
19 ca, B08 14 ca và npm test 3 nhóm được chạy lại; lint/typecheck/build pass.

```powershell
npm ci
$env:TEST_DATABASE_URL='postgresql://<test-user>:<password>@localhost:<port>/<test-db>'
npm run eval:b09
npm run eval:b06
npm run eval:b07
npm run eval:b08
npm test
```

## Thay đổi tương thích và đóng nghiệm thu

B05 mặc định trước đây tối đa 50 mục; B09 mặc định 15 theo A01. Client cũ chỉ
đọc data.items vẫn dùng được nhưng phải nối tải thêm để xem hết. next_cursor/
has_more là trường mới, sticker/job_status được bổ sung. Không đổi create,
retry, quota, auth hoặc worker trong B09. Không cần ALTER schema/grants mới.
Nên deploy secret đồng nhất giữa các API replica, không tạo secret theo mỗi request.

Nghiệm thu kỹ thuật local qua eval; DoD đầy đủ cần CI remote xanh, A06/A11 nối
API thật trên staging, kiểm tra loading/empty/error/load-more và review/approve
từ thành viên khác. Chưa có bằng chứng UI/staging hoặc storage thật trong eval.
