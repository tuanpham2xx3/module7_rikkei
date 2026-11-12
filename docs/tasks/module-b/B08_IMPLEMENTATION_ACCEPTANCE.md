# B08 — Quota và retry có kiểm soát

Ngày 12/11/2026. Phụ thuộc B07 (`bc58731`). B08 là một commit riêng gồm code,
migration 004, eval và tài liệu. Không bao gồm cursor/timeline B09.

## Nghiệp vụ và API

- Quota mặc định 5 lượt/user/ngày, cấu hình server trong
  `profiles.daily_generation_limit` (0–1000). Không có API client chỉnh quota.
- Ngày sử dụng tính tại lúc API nhận action theo Asia/Ho_Chi_Minh, không theo
  entry_date. Viết bù ngày cũ vẫn dùng quota hôm nay; reset 00:00 UTC+7, không cần cron.
- Một create hoặc retry thành công do user chủ động tiêu 1 lượt. Retry hệ thống
  B07 không tiêu thêm. Replay key không tiêu thêm; xóa entry không hoàn lượt.
- Create hết quota vẫn trả 201 và lưu nhật ký/sticker placeholder, job
  failed/QUOTA_EXCEEDED; không enqueue/call AI. Đây là hành vi theo A02 để
  không mất nội dung, thay vì trả lỗi khiến frontend tưởng chưa lưu nhật ký.
- Create/replay bổ sung `data.quota={daily_limit,used,remaining_quota,reset_at}`;
  job thêm run_version/error_code. Trường/envelope/IDs cũ được giữ.
- `GET /api/v1/users/quota`, Bearer auth: cùng quota object. remaining không âm
  ngay cả khi admin hạ limit thấp hơn used. reset_at là timestamp ISO UTC.
- `POST /api/v1/entries/:id/retry`: Bearer, UUID và Idempotency-Key bắt buộc,
  body `{}` hoặc không body. Trả 201 `{success:true,data:{entry_id,job,quota}}`.
  Idempotency scope tách create/retry và target entry được fingerprint.
- Hết quota ở retry: 429 `{success:false,error:{code:'QUOTA_EXCEEDED',quota}}`.
  Transaction rollback: không đổi job/run, không giữ claim key bị từ chối;
  có thể dùng lại key đó sau reset/tăng limit. Chỉ successful action được replay.
- `GET /jobs/:id` thêm run_version/can_retry. can_retry xét quota hiện tại,
  failed, safe outcome, chưa có ảnh/fallback; sang ngày mới tự thay đổi dù job cũ.

## Nhất quán và tương thích B06/B07

`daily_generation_usage` unique user/date, `generation_usage_events` ghi action
đã charge. Job bị xóa chỉ SET NULL pointer của usage event, không xóa counters.
Reserve trong cùng transaction create/retry: lock profile cấu hình, insert daily
row nếu thiếu, conditional UPDATE used+1 WHERE used<limit, rồi ghi unique event.
Không dùng read-then-write rời transaction. Lock profile cũng tuần tự hóa với
UPDATE cấu hình từ admin. Rollback bất kỳ bước nào hoàn cả reservation/event.

Retry giữ nguyên job ID/sticker, tăng run_version, reset attempt/lease/reference
và run_started_at; giữ created_at ban đầu. History unique `(job_id,run_version,
attempt_no)`. Worker request key nay có cả run_version để không nhầm user action
mới với retry hệ thống cũ. Worker phải deploy cùng schema/API B08.

Chỉ retry khi job failed, không ảnh/fallback và `user_retry_allowed=true`.
Flag này do server đặt: quota denied hoặc C06 xác nhận failure RATE_LIMITED/
PROVIDER_UNAVAILABLE an toàn. Không suy đoán an toàn chỉ từ error_code:
RATE_LIMITED với safeToResubmit=false vẫn bị từ chối. Outcome unknown trả 409
PROVIDER_OUTCOME_UNKNOWN; queued/processing/succeeded/refusal/ảnh đã có trả 409
JOB_NOT_RETRYABLE. C07 cần lock entry/job giống flow retry trước khi gán fallback.
Không có API regenerate ảnh thành công trong phạm vi này.

Retry replay trả trạng thái job hiện tại, không byte-identical response; không
chạy lại action. Sau delete key tombstone trả 410. Request khác owner trả 404.
Attempts và trạng thái cũ giữ nguyên khi upgrade, user_retry_allowed mặc định
false cho lỗi lịch sử chưa có bằng chứng an toàn. Job trước B08 được grandfather:
không tự bịa quota usage quá khứ hoặc tự trừ chi phí lịch sử chưa đo.

## Log và giới hạn

Worker log allowlist: job_id/status/duration_ms/attempt/run_version và usage
{provider_submissions,provider_lookups} cho từng cycle. Đây là số lần gọi adapter,
không phải hóa đơn/usage nhà cung cấp đã xác minh. Không log content, prompt,
token, raw error, path ảnh hoặc URL ký. Adapter/proxy riêng cũng phải tuân thủ.
Quota user không phải trần chi phí toàn hệ thống; submit hệ thống có thể nhiều
hơn user quota do retries hữu hạn. C01/provider budget vẫn cần được kiểm tra.

## Eval đã chạy trên PostgreSQL 16 thật

Node 22, DB container nhiều connection; HTTP Nest compiled, Auth stub; worker
dùng fake provider/storage. Không tuyên bố đã gọi dịch vụ thật.

| Ca | Bằng chứng | Kết quả |
| --- | --- | --- |
| Q01 | Cấu hình theo user, create charge một lần, replay không charge | PASS |
| Q02 | Barrier hai connection lúc chỉ còn 1 lượt: một generation queued, cả hai diary vẫn lưu | PASS |
| Q03 | Trùng ngày rollback; DELETE giữ used/event | PASS |
| Q04 | Retry cùng key đồng thời: một run mới và một lần charge | PASS |
| Q05 | Retry khác key cùng job: chỉ một action thắng | PASS |
| Q06 | 429 giữ nguyên run/key không lưu; tăng limit rồi key cũ dùng được | PASS |
| Q07 | Owner khác/active/unknown/unsafe/fallback bị chặn | PASS |
| Q08 | Key gắn target, delete/replay 410, không hoàn quota | PASS |
| Q09 | Qua nửa đêm UTC+7 reset; ghi bù tính ngày request; can_retry đổi đúng | PASS |
| Q10 | 3 system submits charge 1; user retry charge 1 thêm, history hai run độc lập | PASS |
| Q11 | HTTP auth/key/quota và response 429 có balance/reset | PASS |
| Q12 | RLS quota/event và constraint limit | PASS |
| Q13 | Fault sau reserve rollback counters/event/entry/request nguyên tử | PASS |
| Q14 | Full API flow dưới FORCE RLS, không cần DELETE request keys | PASS |

14/14 tình huống B08 (TAP đếm parent thành 15). Regression: B06 16 ca, B07
19 ca và npm test 3 nhóm; fixtures được cập nhật migration đầy đủ và trường
response bổ sung, không bỏ assertion cũ. Lint/typecheck/build được kiểm tra.

```powershell
npm ci
$env:TEST_DATABASE_URL='postgresql://<test-user>:<password>@localhost:<port>/<test-db>'
npm run eval:b08
npm run eval:b06
npm run eval:b07
npm test
```

## Deploy/nghiệm thu

1. Dừng worker B07 cũ; chạy migration 004 bằng migration role.
2. API role cần SELECT/INSERT/UPDATE daily_generation_usage, SELECT/INSERT
   generation_usage_events và quyền cũ. Không cần DELETE usage/events/keys.
   Profile limit do cấu hình admin; frontend không có endpoint ghi profile.
3. Worker role giữ quyền job/attempts cũ; không cần ghi bảng quota. Chạy code
   worker mới cùng API để history có run_version. Không rollback riêng worker
   về B07 trên schema B08 rồi tiếp tục chạy các user retry run>1.
4. Smoke test quota thật, reload, retry lỗi có kiểm soát và C07 fallback trên
   staging; kiểm tra log server/proxy không lộ nhật ký. Không tự điền kết quả thật.

Kết luận: nghiệm thu kỹ thuật local qua eval. DoD đầy đủ còn CI remote xanh,
tích hợp A08/C06/C07 thật trên staging và approve của thành viên khác.
