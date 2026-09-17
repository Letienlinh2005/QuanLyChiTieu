# Trang Quản trị - Sổ Chi Tiêu

Trang quản trị chạy trên laptop, dùng chung backend `QuanLyChiTieuAPI` và chung
bảng `NguoiDung` với app di động (không có hệ thống đăng nhập riêng).

## Các bước cài đặt

### Bước 1 — Cập nhật cơ sở dữ liệu

Mở MySQL Workbench, chạy file `QuanLyChiTieuAPI/admin_bo_sung.sql`.

File này thêm:
- Cột `VaiTroHeThong` vào bảng `NguoiDung` để phân biệt admin với người dùng thường
- Bảng `NhatKyHeThong` để lưu lịch sử thao tác quản trị

### Bước 2 — Tạo tài khoản quản trị viên

Mật khẩu phải được mã hóa bcrypt nên không INSERT thẳng bằng SQL được. Chạy trong
thư mục `QuanLyChiTieuAPI`:

```bash
node scripts/taoQuanTriVien.js admin@gmail.com Admin123 "Tên Của Bạn"
```

- Nếu email chưa tồn tại: tạo tài khoản mới với quyền quản trị viên.
- Nếu email đã có sẵn (bạn đã đăng ký qua app): chỉ nâng tài khoản đó lên quyền
  quản trị, giữ nguyên mật khẩu cũ.

### Bước 3 — Chạy backend

```bash
cd QuanLyChiTieuAPI
npm run dev
```

### Bước 4 — Mở trang admin

Mở file `QuanLyChiTieuAdmin/login.html` bằng trình duyệt, đăng nhập bằng tài khoản
vừa tạo ở bước 2.

> Nếu backend chạy ở cổng hoặc máy khác, sửa `API_BASE` ở đầu file `api.js`.

## Cấu trúc thư mục admin

```
QuanLyChiTieuAdmin/
  login.html            Trang đăng nhập
  admin-dashboard.html  Giao diện quản trị chính (6 màn hình)
  api.js                Lớp gọi API, quản lý token trong localStorage
```

## Các màn hình

| Màn hình | Chức năng |
|---|---|
| Tổng quan | KPI toàn hệ thống, danh sách sổ tạo gần đây |
| Người dùng | Tìm kiếm, lọc, khóa/mở khóa tài khoản |
| Sổ chi tiêu | Xem sổ cá nhân/gia đình kèm danh sách thành viên và vai trò |
| Danh mục mẫu | Thêm/xóa danh mục mẫu áp dụng cho mọi sổ tạo mới |
| Giao dịch | Tra soát giao dịch toàn hệ thống, lọc theo loại |
| Nhật ký hệ thống | Lịch sử thao tác quản trị (tự động ghi) |

## API đã thêm vào backend

Tất cả endpoint dưới `/api/admin/*` đều yêu cầu đăng nhập VÀ có vai trò `QuanTriVien`.

```
POST   /api/auth/dang-nhap-quan-tri        Đăng nhập trang admin
GET    /api/admin/tong-quan                 Thống kê KPI
GET    /api/admin/nguoi-dung                Danh sách người dùng (lọc: tuKhoa, trangThai)
PATCH  /api/admin/nguoi-dung/:id/trang-thai Khóa / mở khóa tài khoản
GET    /api/admin/so-chi-tieu               Danh sách sổ (lọc: tuKhoa, loai)
GET    /api/admin/danh-muc-mau              Danh sách danh mục mẫu
POST   /api/admin/danh-muc-mau              Thêm danh mục mẫu
DELETE /api/admin/danh-muc-mau/:id          Xóa danh mục mẫu
GET    /api/admin/giao-dich                 Giao dịch toàn hệ thống (lọc: tuKhoa, loai)
GET    /api/admin/nhat-ky                   Nhật ký hệ thống
```

## Các file backend đã thay đổi

| File | Thay đổi |
|---|---|
| `src/middlewares/auth.middleware.js` | Thêm `xacThucQuanTri` kiểm tra quyền admin |
| `src/controllers/auth.controller.js` | Thêm `dangNhapQuanTri`; nhúng `vaiTroHeThong` vào JWT; chặn đăng nhập khi tài khoản bị khóa; sửa lỗi đọc sai tên cột avatar (`DuongDanAnhDaiDien` → `LinkAvatar`) |
| `src/controllers/admin.controller.js` | **File mới** — toàn bộ nghiệp vụ admin |
| `src/routes/auth.routes.js` | Thêm route `/dang-nhap-quan-tri` |
| `src/routes/admin.routes.js` | **File mới** — định tuyến admin |
| `src/app.js` | Đăng ký `/api/admin` |
| `scripts/taoQuanTriVien.js` | **File mới** — tạo/nâng cấp tài khoản admin |
| `admin_bo_sung.sql` | **File mới** — SQL bổ sung cho admin |

## Quy tắc bảo vệ đã cài đặt

- Người dùng thường đăng nhập vào trang admin sẽ bị chặn ngay (403), không lọt vào
  được rồi mới báo lỗi.
- Không thể khóa tài khoản quản trị viên (tránh tự khóa mình ra ngoài).
- Tài khoản bị khóa không đăng nhập được vào cả app di động lẫn trang admin.
- Token hết hạn hoặc không đủ quyền: trang admin tự xóa phiên và chuyển về đăng nhập.
- Mọi thao tác khóa/mở khóa, thêm/xóa danh mục mẫu đều tự động ghi vào nhật ký.

## Còn thiếu, nên làm tiếp

- Phân trang cho danh sách người dùng và giao dịch (hiện lấy tối đa 100 dòng mỗi lần).
- Trang admin đang dùng `localStorage` lưu token — đủ cho môi trường nội bộ, nhưng nếu
  đưa lên Internet thật nên chuyển sang httpOnly cookie để chống XSS.
- Backend chưa kiểm tra người dùng có thuộc sổ chi tiêu hay không khi thao tác giao dịch
  (`giaoDich.controller.js`) — hiện bất kỳ ai đăng nhập cũng có thể tạo/xóa giao dịch của
  sổ người khác nếu biết `maSoChiTieu`. Đây là lỗ hổng cần vá sớm, không liên quan
  riêng tới trang admin.
