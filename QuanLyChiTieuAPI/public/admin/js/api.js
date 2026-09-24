/* =====================================================================
   Lớp gọi API dùng chung cho trang quản trị.
   Vì trang này được phục vụ từ chính server Express (app.use('/admin', ...)),
   API_BASE để trống nghĩa là gọi tương đối tới cùng origin (http://host:port/api/...).
   Nếu bạn mở trực tiếp file HTML (không qua server) hoặc host admin ở nơi khác,
   đổi API_BASE thành địa chỉ đầy đủ, ví dụ: 'http://localhost:3000/api'
===================================================================== */
const API_BASE = '/api';

function layToken() {
  return localStorage.getItem('admin_token');
}

function layNguoiDungDangNhap() {
  try {
    return JSON.parse(localStorage.getItem('admin_nguoidung') || 'null');
  } catch (e) {
    return null;
  }
}

function luuPhienDangNhap(token, nguoiDung) {
  localStorage.setItem('admin_token', token);
  localStorage.setItem('admin_nguoidung', JSON.stringify(nguoiDung));
}

function dangXuat() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_nguoidung');
  window.location.href = 'login.html';
}

// Chặn truy cập nếu chưa đăng nhập / không phải quản trị viên.
// Gọi hàm này ở đầu mỗi trang cần bảo vệ (trừ login.html).
function baoVeTrangQuanTri() {
  const token = layToken();
  const nd = layNguoiDungDangNhap();
  if (!token || !nd || nd.vaiTroHeThong !== 'QuanTriVien') {
    dangXuat();
    return null;
  }
  return nd;
}

/**
 * Gọi API quản trị/hệ thống.
 * @param {string} duongDan - vd '/admin/nguoi-dung?tuKhoa=an'
 * @param {RequestInit} tuyChon
 */
async function goiApi(duongDan, tuyChon = {}) {
  let res;
  try {
    res = await fetch(API_BASE + duongDan, {
      ...tuyChon,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + layToken(),
        ...(tuyChon.headers || {}),
      },
    });
  } catch (err) {
    throw new Error('Không thể kết nối tới máy chủ. Kiểm tra lại API có đang chạy không.');
  }

  if (res.status === 401) {
    dangXuat();
    throw new Error('Phiên đăng nhập đã hết hạn.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    /* phản hồi rỗng, bỏ qua */
  }

  if (!res.ok) {
    throw new Error((data && data.message) || `Lỗi máy chủ (${res.status})`);
  }
  return data;
}

function hienThiLoi(thongDiep) {
  const toast = document.getElementById('toast');
  if (!toast) { alert(thongDiep); return; }
  toast.textContent = thongDiep;
  toast.classList.add('show', 'error');
  clearTimeout(hienThiLoi._t);
  hienThiLoi._t = setTimeout(() => toast.classList.remove('show'), 4000);
}
