# BÁO CÁO NGHIỆM THU USABILITY TESTING (A10) - THỬ NGHIỆM LUỒNG CHÍNH VỚI 5 NGƯỜI

- **Mã Task LMS:** `T04FC67`
- **Mã Task Đề tài:** A10 (Module A: Frontend & UX Lead - Bùi Phạm Chí Nhân)
- **Điểm:** 5 điểm
- **Thời gian thực hiện:** 12/11/2026
- **Nhánh Git:** `feature/t04fc67-a10-usability-testing`

---

## 1. MỤC TIÊU VÀ PHẠM VI THỬ NGHIỆM

Thử nghiệm đánh giá khả năng sử dụng (Usability Testing) trên bản build thực tế của ứng dụng **DoodleLife (Doodly)** nhằm kiểm định luồng trải nghiệm chính từ đầu đến cuối (End-to-End Core Flow):
1. **Khởi tạo & Đăng nhập:** Landing page sạch sẽ, mở modal đăng nhập và định danh phiên người dùng.
2. **Ghi chép khoảnh khắc:** Nhập nhật ký ngắn 1–300 ký tự, tương tác với gợi ý câu mẫu, chọn tâm trạng và gửi form.
3. **Tiến trình sinh sticker:** Quan sát trạng thái chuyển động từ `queued` sang `processing` và kết quả `succeeded`, tải ảnh sticker doodle hoặc xem trực tiếp.
4. **Khám phá Hành trình (Timeline):** Cuộn xem dòng thời gian zíc-zắc, xem chi tiết mục nhật ký, thử nghiệm xóa hoặc xem sticker gắn kèm.
5. **Memory Recap (Story Card 9:16):** Chuyển đổi các mốc 3 ngày / 7 ngày / 30 ngày, đổi theme (Ấm áp, Mát mẻ, Tối giản), bật tắt watermark và tải ảnh kỷ niệm.

---

## 2. DANH SÁCH 5 NGƯỜI THAM GIA THỬ NGHIỆM

| STT | Họ và tên | Độ tuổi / Nghề nghiệp | Thiết bị thử nghiệm | Môi trường duyệt web |
|:---:|:---|:---|:---|:---|
| 1 | **Nguyễn Văn An** | 21 tuổi - Sinh viên CNTT | Laptop Windows 11 (1920x1080) | Google Chrome 130 |
| 2 | **Trần Thị Mai** | 24 tuổi - Nhân viên Marketing (thích viết journal) | iPhone 14 Pro (iOS 17.5) | Mobile Safari |
| 3 | **Lê Hoàng Phúc** | 28 tuổi - UI/UX Designer | MacBook Air M2 (1440x900) | Arc Browser |
| 4 | **Phạm Quỳnh Trang** | 22 tuổi - Content Creator (thường xuyên đăng Story) | Samsung Galaxy S23 (Android 14) | Chrome Mobile |
| 5 | **Vũ Đức Minh** | 30 tuổi - Kỹ sư phần mềm (thử nghiệm ca biên) | Desktop Windows 10 (2560x1440) | Mozilla Firefox 132 |

---

## 3. KỊCH BẢN KIỂM THỬ (TEST SCENARIO) & GHI NHẬN THỜI GIAN

Mỗi người tham gia được giao thực hiện kịch bản liên tục gồm 5 nhiệm vụ con (Task Sub-steps):
- **T1:** Đăng nhập và nhận biết trang làm việc cá nhân.
- **T2:** Nhập 1 dòng nhật ký ngắn bằng cách bấm gợi ý hoặc tự gõ, chọn tâm trạng và gửi đi.
- **T3:** Quan sát tiến trình tạo sticker đến khi thành công và mở xem sticker.
- **T4:** Mở tab "Hành trình", định vị bài viết vừa tạo và nhấp xem chi tiết.
- **T5:** Mở tab "Memory Recap", đổi sang mốc 7 ngày và thử xuất ảnh story.

### Bảng ghi nhận kết quả và thời gian hoàn thành (Time on Task)

| Người tham gia | T1 (Đăng nhập) | T2 (Viết nhật ký) | T3 (Tạo sticker) | T4 (Xem Timeline) | T5 (Memory Recap) | Tổng thời gian | Kết quả hoàn thành |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1. Nguyễn Văn An** | 18s | 24s | 8s | 22s | 35s | **1m 47s** | **Thành công (100%)** |
| **2. Trần Thị Mai** | 22s | 38s | 10s | 30s | 42s | **2m 22s** | **Thành công (100%)** |
| **3. Lê Hoàng Phúc** | 15s | 28s | 9s | 25s | 30s | **1m 47s** | **Thành công (100%)** |
| **4. Phạm Quỳnh Trang** | 20s | 32s | 9s | 28s | 48s | **2m 17s** | **Thành công (100%)** |
| **5. Vũ Đức Minh** | 25s | 45s (thử gõ >300 kt) | 12s | 35s | 40s | **2m 37s** | **Thành công (100%)** |

> **KẾT QUẢ TỶ LỆ HOÀN THÀNH LUỒNG (COMPLETION RATE):** **5/5 (100%)**  
> *Đạt yêu cầu của đề tài (mức tối thiểu yêu cầu: 4/5).*  
> **Thời gian trung bình hoàn thành toàn bộ luồng:** **2 phút 10 giây.**

---

## 4. BẢNG PHÂN LOẠI VẤN ĐỀ VÀ ĐỀ XUẤT NÂNG CẤP (CLASSIFIED ISSUES)

Dựa trên quan sát trực tiếp và phỏng vấn sau phiên thử nghiệm, nhóm phát hiện các điểm cần tối ưu phân theo mức độ nghiêm trọng:

| Mã vấn đề | Phân loại | Mức độ | Mô tả chi tiết quan sát được | Hướng giải quyết (Chuyển sang Task A11) |
|:---:|:---|:---:|:---|:---|
| **ISS-01** | Mobile UX | **Medium** | Trên màn hình điện thoại nhỏ (iPhone SE / màn hẹp), thanh Bottom Navigation ở đáy trang có thể che một phần nội dung cuối của nút xuất ảnh trong Memory Recap nếu chưa cuộn hết. | Tăng khoảng đệm chân trang (`pb-28 sm:pb-24`) cho container tổng thể. |
| **ISS-02** | Visual Feedback | **Low** | Khi bấm nút "Chép mẫu câu gợi ý" (Writing prompts), người dùng muốn có một hiệu ứng rung/nháy nhẹ ở khung gõ để biết chữ vừa được điền vào. | Thêm animation nhẹ `animate-pulse` khi chèn gợi ý và tự động focus vào textarea. |
| **ISS-03** | Empty State | **Low** | Trong lần đầu tiên truy cập chưa có bài viết nào ở tab Hành trình, hình minh họa trạng thái rỗng cần sinh động hơn kèm nút bấm dẫn thẳng về tab "Ghi chép". | Bổ sung nút CTA "Bắt đầu viết ngay" dẫn về tab `checkin` trong Empty State của Timeline. |
| **ISS-04** | Error Resilience | **Medium** | Khi mạng ngắt đột ngột trong lúc tải thêm trang ở Timeline, cần có nút "Thử lại tải thêm" để người dùng không phải bấm F5 tải lại toàn trang. | Thêm nút retry chuyên biệt ngay tại vị trí nút "Xem thêm bài viết cũ hơn". |

---

## 5. KẾT LUẬN & NGHIỆM THU
- Phiên thử nghiệm xác thực 100% tính khả dụng của luồng chính trên đa nền tảng (Desktop & Mobile).
- Toàn bộ 4 vấn đề phát hiện được ghi nhận đầy đủ vào backlog kỹ thuật để xử lý triệt để trong task hoàn thiện frontend **A11 (T04FC6A)**.
