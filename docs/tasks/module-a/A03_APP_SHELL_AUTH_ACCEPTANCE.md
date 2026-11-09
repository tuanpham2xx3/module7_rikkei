# BIÊN BẢN NGHIỆM THU KỸ THUẬT TASK A03 [T04FC52]
> **Dự án:** DoodleLife (Doodly) — AI-Powered Visual Journal  
> **Task LMS:** `[A03] Dựng khung ứng dụng và phiên đăng nhập`  
> **Mã Task Rikkei:** `T04FC52` | **Điểm:** 3 điểm | **Sprint:** 1 (Ngày 3)  
> **Người thực hiện:** Bùi Phạm Chí Nhân (Module A: Frontend & UX Lead)  
> **Nhánh Git:** `feature/t04fc52-a03-app-shell-auth`  
> **Thời điểm nghiệm thu:** 09/11/2026  

---

## I. TỔNG QUAN KẾT QUẢ TRIỂN KHAI

Task **`A03` [T04FC52]** đã hoàn thành 100% các tiêu chí nghiệm thu kỹ thuật theo đúng đặc tả của hệ thống LMS Rikkei và Hợp đồng API / UX Spec (`A01`, `A02`).

### 1. Bảng đối chiếu tiêu chí nghiệm thu (Definition of Done)

| Tiêu chí đề bài LMS | Kết quả triển khai thực tế | Đánh giá |
| :--- | :--- | :---: |
| **Có layout, điều hướng (App Shell)** | • Xây dựng App Shell hoàn chỉnh tại `frontend/src/App.tsx`<br>• Header doodle thương hiệu (`AppHeader.tsx`) hiển thị logo, user badge, tier Free và nút đăng xuất.<br>• Thanh điều hướng Mobile (`BottomNav.tsx`) cố định dock dưới với 3 tab: *Hành trình, Ghi chép, Hồ sơ*.<br>• Viewport Responsive tối ưu cả Mobile (<430px) và Desktop. | **ĐẠT** |
| **Route cần đăng nhập & Guard** | • Thành phần `ProtectedRoute.tsx` bảo vệ các private routes (`/`, `/timeline`, `/write`, `/profile`).<br>• Tự động chuyển hướng sang `/login` nếu chưa có phiên và redirect lại trang cũ sau khi đăng nhập thành công. | **ĐẠT** |
| **Trạng thái khởi tạo phiên (Anti-flicker)** | • Thành phần `DoodleLoading.tsx` với animation nét vẽ hoạt hình phác thảo độc bản.<br>• **Tuyệt đối không nháy (anti-flicker)** nội dung nhật ký riêng tư khi người dùng refresh hoặc mở ứng dụng lần đầu trong lúc đang xác định session. | **ĐẠT** |
| **Đăng nhập Google OAuth** | • Tích hợp nút Google 1-click (`GoogleLoginBtn.tsx`) kết nối Supabase OAuth Provider, có fallback mock session thông minh khi chạy local chưa có key. | **ĐẠT** |
| **Đăng ký & Đăng nhập Email/Mật khẩu độc lập** | • Form chuyển tab linh hoạt (`EmailAuthForm.tsx`):<br>  - Đăng nhập: Email, Password, Remember Me, báo lỗi tài khoản.<br>  - Đăng ký mới: Họ tên, Email, Mật khẩu $\ge 6$ ký tự, Xác nhận mật khẩu.<br>• Validation client thời gian thực (realtime format check). | **ĐẠT** |
| **Đăng xuất (Logout)** | • Xóa sạch session/token, thu hồi quyền truy cập và chuyển hướng về `/login`. | **ĐẠT** |
| **Chất lượng mã nguồn & CI Pass** | • `npm run lint` (oxlint): **0 errors, 0 warnings**.<br>• `npm run build` (tsc -b && vite build): **Thành công 100% trong 477ms**, sẵn sàng deploy static. | **ĐẠT** |

---

## II. CẤU TRÚC MÃ NGUỒN FRONTEND ĐÃ TẠO

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── GoogleLoginBtn.tsx      # Nút bấm đăng nhập Google OAuth
│   │   │   └── EmailAuthForm.tsx       # Form Email/Password + Validation realtime
│   │   ├── layout/
│   │   │   ├── AppHeader.tsx           # Header doodle, avatar, quick logout
│   │   │   ├── BottomNav.tsx           # Floating dock mobile navigation
│   │   │   └── ProtectedRoute.tsx      # Anti-flicker Route Guard
│   │   └── ui/
│   │       └── DoodleLoading.tsx       # Loading animation nét bút doodle
│   ├── contexts/
│   │   ├── auth-context.ts             # Định nghĩa Interface & Context
│   │   ├── AuthContext.tsx             # Provider quản lý Session & Auth State
│   │   └── useAuth.ts                  # Hook sử dụng auth tiện lợi
│   ├── lib/
│   │   └── supabaseClient.ts           # Khởi tạo Supabase Client & Mock Fallback
│   ├── pages/
│   │   ├── LoginPage.tsx               # Màn hình Đăng nhập / Đăng ký
│   │   ├── TimelinePage.tsx            # Màn hình Dòng thời gian chính
│   │   └── ProfilePage.tsx             # Màn hình Hồ sơ tài khoản cá nhân
│   ├── types/
│   │   └── auth.ts                     # UserProfile, AuthSession types
│   ├── App.tsx                         # Khởi tạo React Router & App Shell
│   ├── main.tsx                        # React 18 Root
│   └── index.css                       # Tailwind + Neo-brutalism Doodle styles
├── .env.example                        # Mẫu biến môi trường (không lộ secret)
├── index.html                          # Fonts Patrick Hand, Comic Neue, Quicksand
├── package.json                        # Scripts: dev, build, lint, preview
├── tailwind.config.js                  # Theme tokens: colors, shadows, borders
└── vite.config.ts
```

---

## III. HƯỚNG DẪN KHỞI CHẠY & KIỂM THỬ LOCAL

### 1. Khởi chạy ứng dụng
```bash
cd frontend
npm install
npm run dev
```
Truy cập: `http://localhost:5173`

### 2. Kiểm tra chất lượng mã nguồn
```bash
# Kiểm tra linter
npm run lint
# Output: Found 0 warnings and 0 errors.

# Kiểm tra TypeScript & Build Production
npm run build
# Output: ✓ built in 477ms (dist/index.html, dist/assets/...)
```

### 3. Kịch bản kiểm thử (Test Cases đã thực hiện)
1. **Kiểm thử Route Guard:** Truy cập trực tiếp `http://localhost:5173/` khi chưa đăng nhập $\rightarrow$ App hiển thị `DoodleLoading` trong tích tắc rồi chuyển hướng an toàn về `/login`.
2. **Kiểm thử Đăng nhập Google:** Nhấn *"Tiếp tục với Google"* $\rightarrow$ Tạo phiên thành công, cập nhật avatar và chuyển thẳng vào trang chủ Hành trình.
3. **Kiểm thử Đăng ký Email mới:** Chọn tab *"Đăng ký mới"*, nhập thông tin với mật khẩu < 6 ký tự $\rightarrow$ Báo lỗi validation tức thì. Nhập đầy đủ thông tin hợp lệ $\rightarrow$ Tạo tài khoản và tự động kích hoạt phiên.
4. **Kiểm thử Đăng xuất:** Bấm nút đăng xuất trên Header hoặc trang Profile $\rightarrow$ Xóa sạch phiên, quay về trang đăng nhập.
5. **Kiểm thử Responsive:** Co giãn màn hình xuống kích thước Mobile (< 430px) $\rightarrow$ Giao diện tự động thu gọn Header, thanh điều hướng đáy `BottomNav` xuất hiện nổi bật.

---

## IV. KẾT LUẬN & CHUẨN BỊ BÀN GIAO SANG TASK A04

* **Trạng thái:** **HOÀN THÀNH (READY FOR REVIEW & MERGE)**
* **Task tiếp theo:** `[A04] Xây dựng form ghi nhật ký` (STT 10 - Ngày 4 - 5 điểm) để bổ sung form nhập liệu micro-journaling 1–300 ký tự và kết nối trực tiếp với backend `POST /api/v1/entries`.
