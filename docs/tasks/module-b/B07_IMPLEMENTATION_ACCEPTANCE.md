# B07 — Worker, phục hồi và nghiệm thu

Ngày: 12/11/2026. Baseline B06: `3db16e0`. Một commit B07 riêng chứa code,
migration, cấu hình worker, eval và biên bản này. Không triển khai quota/retry
người dùng B08 hoặc timeline B09.

## Phân tích và phạm vi

Backlog B07 phụ thuộc B06/C06: nhận job bằng cập nhật có điều kiện, giới hạn
concurrency, lưu trạng thái trước/sau provider, timeout/retry/backoff hữu hạn,
phục hồi job treo; không tự gửi lại khi chưa rõ provider đã tính phí.
B06 giữ nguyên API và logical job/sticker. Worker đọc queue bền vững PostgreSQL,
không dùng queue in-memory hoặc mở thêm Redis. B07 là process riêng; HTTP API
không tự khởi chạy worker khi boot hoặc khi import vào test.

C03/C04/C06 chưa có implementation trong các nhánh repo được bàn giao.
Do đó B07 cung cấp port tại `src/worker/ports.ts` và loader module server,
không cài fake provider mặc định để tạo cảm giác AI thật đã chạy.
Chỉ chạy production worker sau khi C bàn giao adapter và smoke test thật.

## Cơ chế đã triển khai

1. Migration 003 thêm phase, next_run_at, lease_token/lease_expires_at,
   max_attempts và bảng generation_attempts; giữ nguyên bốn status API B06.
   Job processing cũ lúc cutover bị chuyển failed/PROVIDER_OUTCOME_UNKNOWN,
   không tự đưa lại queue vì runner cũ chưa có phase/reference bảo đảm.
2. Mỗi batch claim tối đa concurrency rows bằng `FOR UPDATE SKIP LOCKED`
   và UPDATE chỉ khi queued; gán lease UUID/processing, commit trước network.
   Gọi runOnce chồng nhau trên cùng instance dùng chung batch đang chạy.
3. Mỗi job có heartbeat; write chỉ nhận lease token còn hiệu lực và status
   processing. Worker cũ sau mất lease không được ghi thành công/ghi đè job.
4. Trước submit: lưu phase dispatching + tăng attempt + tạo attempt record
   trong một transaction. Request key gửi C là job ID + attempt; C dùng key
   này khi provider có hỗ trợ. Provider adapter không retry bên trong.
5. Pending lưu provider_reference, queue lại phase pending. Lần sau lookup
   đúng reference, không submit lại và không tăng attempt sinh ảnh.
6. Failed chỉ retry với RATE_LIMITED/PROVIDER_UNAVAILABLE khi adapter xác nhận safeToResubmit=true và chưa hết
   max_attempts; exponential backoff + jitter, không ngắn hơn retryAfterMs.
   Mặc định max 3 submit/job. Error code qua allowlist, không lưu raw error.
7. Throw/timeout sau dispatch là unknown: không có reference → failed;
   đã có reference và lookup → queue lại để đối soát. Pending/lookup có trần
   tuổi job để không poll vô hạn. Timeout dùng AbortSignal + Promise.race,
   không giữ batch vô hạn ngay cả khi promise adapter không trả kết quả.
8. Ảnh kiểm tra byte length <=10 MiB, chữ ký PNG/JPEG/WebP và dimensions dương.
   C04 vẫn phải decode/kiểm tra dimensions thực; kiểm tra header ở B07 không
   thay thế validation nội dung ảnh đầy đủ của C04.
9. Upload private path có owner/entry/job/lease riêng. Transaction cuối khóa
   entry trước, rồi job; kiểm tra lease và entry còn tồn tại, ghi metadata ảnh
   + succeeded + attempt outcome nguyên tử. Không upsert entry.
10. DELETE/mất lease/lỗi ghi metadata: dọn object chưa attach. Có kiểm tra
    object_path còn được DB tham chiếu trước cleanup để tránh xóa ảnh khi
    COMMIT thực tế thành công nhưng acknowledgement bị mất. Upload hoàn tất
    muộn sau timeout cũng được cleanup khi process còn sống.
11. Storage failure không tự sinh ảnh mới. Worker fail STORAGE_FAILED, giữ
    nhật ký. Cơ chế retry upload độc lập sau lỗi storage chưa thuộc bản này.
12. Expired lease ready được queue lại; dispatching/pending/storing có reference
    được reconcile qua lookup; dispatching không reference bị failed unknown.
    Lịch sử attempt được cập nhật khi recover. Không hứa exactly-once billing
    khi provider thiếu idempotency/lookup hoặc crash ngay sau submit.

## Tích hợp adapter C

Module compiled CommonJS export `{provider,storage}`. Loader nhận đường dẫn
local tin cậy từ WORKER_ADAPTER_MODULE, không lấy module path từ HTTP/client.

Provider cung cấp:

- `submit({jobId,requestKey,content,mood,timeOfDay}, signal)`.
- `lookup(reference, signal)` nếu provider hỗ trợ đối soát tác vụ cũ.
- Kết quả `succeeded` có image bytes/MIME/width/height; `pending` có reference;
  `failed` có code chuẩn và safeToResubmit. Có thể kèm reference/retryAfterMs.
- Không tự retry; không đánh dấu safeToResubmit dựa trên suy đoán mã HTTP.
  Nếu không biết provider nhận request hay chưa thì throw hoặc trả failure
  safeToResubmit=false/PROVIDER_OUTCOME_UNKNOWN.
- Không thay model/prompt trong UI; giữ secret/raw response ở server và không log.

Storage cung cấp `put(path,image,signal)` và `remove(path,signal)` idempotent.
Put phải validate bytes thật, decode ảnh, tôn trọng AbortSignal; remove phải
an toàn khi object không tồn tại. Timeout không thể giết code đồng bộ/CPU vô hạn
hoặc hủy side effect bên ngoài nếu adapter/provider không hỗ trợ abort.
Adapter phải bảo đảm một promise hoàn tất tương ứng upload đã hoàn tất/hủy.

Nếu process chết sau upload trước commit/cleanup, có thể còn object mồ côi
private. C04 cần lifecycle/orphan sweep; log cleanup_required cho lỗi cleanup
khi process còn sống. B07 không có durable cleanup outbox và không tuyên bố
đã dọn được mọi orphan sau hard crash. Không có metadata → signed proxy B04
không cấp quyền đọc object đó cho người dùng.

## Quyền và vận hành

- Migration role chạy migration 003; không dùng API/worker login để migration.
- Administrator chạy `deploy/worker-role.sql`, đặt password ngoài Git.
  WORKER_DATABASE_URL dùng effective role **doodlelife_worker**, NOSUPERUSER,
  NOBYPASSRLS. Policy dành riêng cho current_user này; không dựa vào GUC do
  frontend có thể truyền. Role chỉ truy cập queue/attempts/stickers/entry locks.
- Worker không cần quyền tạo users/profiles hay xóa entries/api_requests.
  Entries chỉ cấp SELECT + UPDATE(id) để khóa; không cấp UPDATE content.
- Không dùng worker credentials làm DATABASE_URL của HTTP API; secret C không
  được đưa lên frontend. Kiểm tra grants hiện hữu trước deploy, nhất là nếu role
  đã tồn tại và từng được cấp quyền rộng hơn script hiện tại.
- `.env.example` có WORKER_*; `npm run build`, sau đó `npm run worker`.
  Thiếu module adapter hoặc DB URL → fail startup, không tạo thành công giả.
- `render.yaml` có worker service cùng Docker image, command `npm run worker`.
  Bổ sung biến secret riêng của adapter trong dashboard. Chỉ enable khi adapter
  đã có trong build; service blueprint tự nó chưa phải bằng chứng deploy thành công.
- Triển khai **một worker replica** với concurrency mặc định 2. Nhiều replica
  không claim trùng hàng nhưng tổng concurrency bằng tổng cấu hình các process;
  chưa có semaphore toàn hệ thống. Điều chỉnh trần theo C01/provider budget.
- SIGTERM/SIGINT ngừng nhận batch mới, drain batch hiện tại có deadline, đóng
  pool. SIGKILL/hard crash dựa vào lease recovery khi process kế tiếp chạy.
- DB pool có connection/statement timeout; không giữ transaction khi chờ AI.
  Lỗi DB không được coi là provider retry an toàn; process dừng để restart,
  lease/phase bền vững dùng cho lần phục hồi sau.

| Config | Mặc định | Ý nghĩa |
| --- | --- | --- |
| WORKER_CONCURRENCY | 2 | Slot mỗi process, tối đa 32 |
| WORKER_LEASE_MS | 60000 | Heartbeat mỗi khoảng lease/3 |
| WORKER_TIMEOUT_MS | 30000 | Deadline mỗi submit/lookup/storage operation |
| WORKER_POLL_MS | 2000 | Chu kỳ queue/reconcile |
| WORKER_BACKOFF_MS | 2000 | Backoff cơ sở có jitter |
| WORKER_MAX_JOB_AGE_MS | 600000 | Trần tuổi job trước lần xử lý tiếp theo |

Các giá trị là config đề xuất, cần hiệu chỉnh theo C01; không phải SLA provider
đã đo. max_attempts ở job mặc định 3, chỉ server/administrator cấu hình.
Retry hệ thống B07 không tạo thêm entry/sticker/job. Quota và user retry thuộc B08.

## Eval và kết quả nghiệm thu local

Môi trường Node 22/Windows, PostgreSQL 16 container thật, pool nhiều connection,
worker dùng role không superuser và FORCE RLS. Provider/storage là fake có kiểm
soát side effects/counts và fault injection. Không gọi AI/Supabase/Storage thật.

| Eval | Assertion | Kết quả |
| --- | --- | --- |
| W01 | Success ghi DB/object/attempt; role worker không sửa nội dung entry | PASS |
| W02 | Hai worker + runOnce chồng nhau không claim trùng, đúng trần mỗi process | PASS |
| W03 | Safe transient retry_after/backoff, dừng sau ba submit | PASS |
| W04 | Provider rejection terminal; raw exception không lộ và không tự resubmit | PASS |
| W05 | Provider không trả kết quả bị timeout/abort, unknown không submit thêm | PASS |
| W06 | Pending lookup reference, attempt vẫn 1 và chỉ một submit | PASS |
| W07 | Expired lease phân biệt ready/pending với dispatching không reference | PASS |
| W08 | DELETE trong lúc provider chạy không phục hồi entry/job | PASS |
| W09 | DELETE sau upload dọn object, không attach metadata | PASS |
| W10 | Mất lease không ghi success/ghi đè trạng thái mới | PASS |
| W11 | Invalid image/storage fail không succeeded hoặc gọi sinh ảnh lại | PASS |
| W12 | Heartbeat giữ lease cho call dài, stop drain và không nhận batch mới | PASS |
| W13 | Job quá tuổi dừng, không poll vô hạn | PASS |
| W14 | B06 create/replay/poll giữ IDs, phản ánh worker success; owner isolation | PASS |
| W15 | Log allowlist không có content/prompt/raw error/secret | PASS |
| W16 | Crash sau lưu reference phục hồi bằng lookup và cập nhật history | PASS |
| W17 | Upload trả về sau timeout được cleanup, không success | PASS |
| W18 | Lỗi DB khi finalize rollback metadata/success và dọn object | PASS |
| W19 | Unknown/rejected/invalid input không retry dù adapter gửi hint mâu thuẫn | PASS |

`npm run eval:b07`: 19/19 tình huống (Node TAP đếm parent thành 20 tests).
`npm run eval:b06`: 16/16 tình huống B06 PASS.
`npm test`: 3/3 nhóm regression PASS. Lint/typecheck/build PASS.
CI chạy cả B06/B07 trên PostgreSQL 16, rồi migration hai lần.
W18 inject lỗi trong transaction finalize trước COMMIT; không giả định đã test
network partition đúng khoảnh khắc COMMIT. Shutdown test gọi stop() trong process,
chưa thử kill/restart container staging thật. Tests không thay bằng chứng vận hành.

```powershell
npm ci
$env:TEST_DATABASE_URL='postgresql://<test-user>:<test-password>@localhost:<port>/<test-db>'
npm run eval:b07
npm run eval:b06
npm test
```

Eval bắt buộc TEST_DATABASE_URL test riêng có quyền tạo schema/role; tự tạo schema
UUID và dọn đúng schema đó. Không chạy bằng DB chứa nhật ký thật. Production API
không được nhận quyền tạo schema/role của test admin.

## Cutover và rollback

1. Dừng runner C05 cũ, không cho hai cơ chế cùng dispatch một queue.
2. Backup/kiểm tra jobs đang processing; chạy migration bằng migration role.
3. Provision worker role, deploy C adapter + secret, chạy một replica worker mới.
4. Smoke test create → queued/processing → ảnh thật; reload giữ kết quả;
   thử lỗi/timeout/xóa trong lúc tạo bằng dữ liệu demo và budget giới hạn.
5. Rollback: dừng worker mới trước. Không chạy lại runner cũ lên queue có phase
   unknown/reference mà chưa đối soát. Giữ migration/data và điều tra bằng ID;
   không reset tất cả job thành queued vì có thể sinh ảnh/tính phí trùng.

Kết luận: đạt nghiệm thu kỹ thuật B07 qua eval local và tương thích B06.
DoD đầy đủ vẫn cần CI remote xanh, C03/C04/C06 adapter thật, smoke test staging
và một thành viên khác review/approve. Không đánh dấu pipeline AI thật đã DONE
chỉ từ các fake adapter dùng trong eval.
