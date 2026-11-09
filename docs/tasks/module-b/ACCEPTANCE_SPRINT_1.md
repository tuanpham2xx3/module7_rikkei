# Biên bản nghiệm thu B01–B05 — 09/11/2026

Commit được kiểm tra: `f4494612acd748b4b1010d82ed1d6f0728171f0e`.
Nhánh: `feat/b01-b05-sprint-1`.

**Kết luận: đạt kiểm tra kỹ thuật local/CI; chưa đạt nghiệm thu đầy đủ Sprint 1.**
Đây là tự kiểm tra kỹ thuật, không thay thế approve của thành viên khác.

## Minh chứng đã kiểm tra

- `npm run lint`, `npm run typecheck`, `npm run build`: PASS khi chạy lại.
- `npm test`: 3/3 nhóm PASS. Nội dung gồm ranh giới ngày UTC+7, độ dài Unicode,
  validation, unique user/ngày, RLS, hai owner, cascade và FK chống khôi phục entry đã xóa.
- `npm audit --omit=dev`: 0 vulnerabilities. Kết quả này không bao gồm devDependencies.
- [GitHub CI run 42552408719](https://github.com/tuanpham2xx3/module7_rikkei/actions/runs/42552408719):
  completed/success, đúng commit ở trên. Lint/typecheck/build/test và cả hai lần
  `npm run migrate` trên PostgreSQL 16 đều success.
- Chạy thêm 16 yêu cầu HTTP qua ứng dụng NestJS compiled: health 200; thiếu/invalid
  token 401; giả user_id, nội dung rỗng/quá dài/ngày không hợp lệ 400; tạo 201;
  trùng ngày 409; owner B không thấy danh sách A và không đọc/xóa entry A (404);
  A đọc/xóa được; ID sai định dạng 400; đọc sau xóa 404.
  Kiểm tra DB sau xóa không còn sticker/job. Tất cả PASS.
  Lần chạy HTTP dùng PostgreSQL WASM PGlite và stub Supabase Auth;
  không phải E2E với Supabase hoặc PostgreSQL network thật.
- `gh pr list --head feat/b01-b05-sprint-1`: chưa có PR tại thời điểm kiểm tra.
- Workspace không có `.env`; Docker daemon không chạy. Không có URL staging
  hay cấu hình dịch vụ thật để thực hiện nghiệm thu triển khai.

## Đối chiếu tiêu chí

| Task | Kết quả kiểm tra | Kết luận nghiệm thu |
| --- | --- | --- |
| B01 | App HTTP chạy; env mẫu, CI xanh, PR template và cấu hình deploy có sẵn | Chưa đạt: thiếu URL staging và PR/approve |
| B02 | Đủ users/profiles, entries, generation_jobs, metadata; unique user/ngày; migration mới/chạy lại pass trên CI PostgreSQL 16 | Đạt phần kỹ thuật; chờ PR/approve theo DoD |
| B03 | Login/refresh/logout/session có code; guard từ chối phiên không hợp lệ, identity từ provider stub | Chưa đủ bằng chứng: cần login/refresh/logout/token hết hạn bằng Supabase thật |
| B04 | Owner filters/RLS, URL ký, chặn owner khác và URL sau xóa trong test | Chưa đủ bằng chứng: cần bucket private thật, ảnh thật và hai tài khoản thật |
| B05 | CRUD qua HTTP pass; validation, trùng ngày, cascade và FK sau delete pass | Đạt phần kỹ thuật local; chờ tích hợp A/C staging và PR/approve |

## Điểm cần chú ý khi tích hợp

1. `GET /entries` hiện chỉ trả trường entry cơ bản, chưa trả sticker/job_status
   như ví dụ response A01. B05 chỉ yêu cầu danh sách cơ bản, nhưng A cần thống nhất
   lại response trước khi tích hợp timeline; hiện phải gọi detail để lấy ảnh/job.
2. Test auth đang stub phản hồi provider; test URL ảnh không thực sự download
   object từ Storage. Không dùng các test này làm bằng chứng dịch vụ thật đã hoạt động.
3. Logout thu hồi refresh sessions; access JWT đã phát có thể còn hiệu lực đến TTL.
   Cần xác nhận hành vi này với frontend và thử trên project Supabase thật.
4. DELETE thu hồi đường truy cập ảnh bằng cách xóa metadata, chưa xóa object vật lý.
   C cần cleanup object mồ côi. Worker chưa được triển khai trong phạm vi B01–B05;
   FK chặn tham chiếu entry đã xóa, nhưng chưa có bài test worker thật đang gọi AI.
5. Storage SQL đặt bucket private và liệt kê policy để kiểm tra; chưa có bằng chứng
   policy hiện hữu trên project thật không cấp quyền đọc trực tiếp bucket stickers.

## Điều kiện đóng nghiệm thu

- Có project Supabase, cấu hình server bằng secret ngoài Git; bucket private,
  quyền DB và Storage được xác nhận trên môi trường thật.
- Deploy staging, ghi URL thật và smoke test login → tạo → tải lại → xem ảnh → xóa.
- Thử tài khoản A/B: đọc/xóa chéo entry bị từ chối, ảnh private không đọc bằng
  object path, URL hết hạn bị từ chối, URL cũ mất truy cập sau DELETE.
- Kiểm tra refresh/logout/hết hạn phiên trên provider thật và tích hợp A/C.
- Tạo PR, CI xanh và một thành viên khác approve; không tự đánh dấu approve.

Không ghi DONE trong backlog khi các điều kiện trên chưa có minh chứng.
