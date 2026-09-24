/* =====================================================================
   Trang quản trị — nối với API thật (QuanLyChiTieuAPI).
   Yêu cầu: đã đăng nhập bằng tài khoản VaiTroHeThong = 'QuanTriVien'
   (xem login.html / login.js).
===================================================================== */

const nguoiDungHienTai = baoVeTrangQuanTri();
if (nguoiDungHienTai) {
  document.getElementById('ten-nguoi-dung').textContent = nguoiDungHienTai.hoTen || nguoiDungHienTai.email;
  document.getElementById('avatar-initials').textContent = layChuVietTat(nguoiDungHienTai.hoTen || nguoiDungHienTai.email);
}
document.getElementById('btn-dang-xuat').addEventListener('click', dangXuat);

function layChuVietTat(ten) {
  const phan = ten.trim().split(/\s+/);
  if (phan.length === 1) return phan[0].slice(0, 2).toUpperCase();
  return (phan[0][0] + phan[phan.length - 1][0]).toUpperCase();
}

/* =====================================================================
   FORMAT HELPERS
===================================================================== */
function formatVND(n) { return Number(n).toLocaleString('vi-VN') + ' ₫'; }
function formatDate(d) { return new Date(d).toLocaleDateString('vi-VN'); }
function formatDateTime(d) { return new Date(d).toLocaleString('vi-VN'); }

function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

/* =====================================================================
   ĐIỀU HƯỚNG
===================================================================== */
const titles = {
  'tong-quan': 'Tổng quan', 'nguoi-dung': 'Người dùng', 'so-chi-tieu': 'Sổ chi tiêu',
  'danh-muc-mau': 'Danh mục mẫu', 'giao-dich': 'Giao dịch', 'nhat-ky': 'Nhật ký hệ thống',
};
const daTaiSection = new Set();

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    item.classList.add('active');
    const key = item.dataset.section;
    document.getElementById('sec-' + key).classList.add('active');
    document.getElementById('page-title').textContent = titles[key];
    taiDuLieuSection(key);
  });
});

function taiDuLieuSection(key) {
  // Chỉ tải lần đầu khi chuyển vào tab; các thao tác lọc/phân trang sau đó tự tải lại.
  if (daTaiSection.has(key)) return;
  daTaiSection.add(key);
  const map = {
    'tong-quan': renderTongQuan,
    'nguoi-dung': renderUsers,
    'so-chi-tieu': renderSpaces,
    'danh-muc-mau': renderTemplates,
    'giao-dich': renderTransactions,
    'nhat-ky': renderLogs,
  };
  map[key] && map[key]();
}

function loaiSoPill(loai) {
  return loai === 'GiaDinh'
    ? `<span class="pill ok">Gia đình</span>`
    : `<span class="pill muted">Cá nhân</span>`;
}

/* =====================================================================
   TỔNG QUAN
===================================================================== */
async function renderTongQuan() {
  try {
    const tk = await goiApi('/admin/thong-ke-tong-quan');

    document.getElementById('kpi-users').textContent = tk.tongNguoiDungHoatDong;
    document.getElementById('kpi-users-delta').textContent = `+${tk.nguoiDungMoi30Ngay} trong 30 ngày qua`;
    document.getElementById('kpi-families').textContent = tk.tongSoGiaDinh;
    document.getElementById('kpi-tx').textContent = tk.tongGiaoDichThangNay;
    document.getElementById('kpi-locked').textContent = tk.tongTaiKhoanKhoa;

    const weeks = tk.nguoiDungMoiTheoTuan || [];
    const maxW = Math.max(1, ...weeks.map(w => w.soLuong));
    document.getElementById('chart-new-users').innerHTML = weeks.map(w => `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <div style="width:56px;font-size:12.5px;color:var(--text-muted);">${w.nhan}</div>
        <div class="bar-track" style="width:320px;">
          <div class="bar-fill" style="width:${(w.soLuong / maxW * 100).toFixed(0)}%;background:var(--primary);"></div>
        </div>
        <div style="font-size:12.5px;font-weight:600;">${w.soLuong} người</div>
      </div>
    `).join('') || `<div class="empty">Chưa có dữ liệu.</div>`;

    const topSpaces = tk.soHoatDongNhieuNhat || [];
    document.getElementById('tbl-top-spaces').innerHTML = topSpaces.length ? topSpaces.map(s => `
      <tr>
        <td>${s.TenSo}</td>
        <td>${loaiSoPill(s.LoaiSo)}</td>
        <td>${s.SoThanhVien}</td>
        <td>${s.GiaoDich30Ngay}</td>
      </tr>
    `).join('') : `<tr><td colspan="4"><div class="empty">Chưa có dữ liệu.</div></td></tr>`;
  } catch (err) {
    hienThiLoi(err.message);
    document.getElementById('tbl-top-spaces').innerHTML = `<tr><td colspan="4"><div class="row-error">${err.message}</div></td></tr>`;
  }
}

/* =====================================================================
   NGƯỜI DÙNG
===================================================================== */
const userState = { trang: 1, soDong: 20, coTrangSau: false };

async function renderUsers() {
  const tuKhoa = document.getElementById('filter-user-search').value.trim();
  const trangThai = document.getElementById('filter-user-status').value;
  const tbody = document.getElementById('tbl-users');
  tbody.innerHTML = `<tr><td colspan="7"><div class="loading">Đang tải...</div></td></tr>`;

  try {
    const params = new URLSearchParams({ tuKhoa, trangThai, trang: userState.trang, soDong: userState.soDong });
    const rows = await goiApi(`/admin/nguoi-dung?${params}`);
    userState.coTrangSau = rows.length === userState.soDong;

    tbody.innerHTML = rows.length ? rows.map(u => `
      <tr>
        <td><strong>${u.HoTen}</strong><br><code class="mono">${u.Email}</code></td>
        <td>${u.SoDienThoai || '—'}</td>
        <td>${u.VaiTroHeThong === 'QuanTriVien' ? '<span class="pill warn">Quản trị viên</span>' : '<span class="pill muted">Người dùng</span>'}</td>
        <td>${u.SoSoThamGia}</td>
        <td>${formatDate(u.NgayTao)}</td>
        <td>${u.DangHoatDong ? '<span class="pill ok">Hoạt động</span>' : '<span class="pill danger">Đã khóa</span>'}</td>
        <td>
          ${u.VaiTroHeThong === 'QuanTriVien' ? '' : `<button class="btn small ${u.DangHoatDong ? 'danger' : ''}" onclick="openLockModal(${u.MaNguoiDung}, ${u.DangHoatDong}, '${u.HoTen.replace(/'/g, "\\'")}')">${u.DangHoatDong ? 'Khóa' : 'Mở khóa'}</button>`}
        </td>
      </tr>
    `).join('') : `<tr><td colspan="7"><div class="empty">Không tìm thấy người dùng phù hợp.</div></td></tr>`;

    capNhatPhanTrang('user', userState);
  } catch (err) {
    hienThiLoi(err.message);
    tbody.innerHTML = `<tr><td colspan="7"><div class="row-error">${err.message}</div></td></tr>`;
  }
}

document.getElementById('filter-user-search').addEventListener('input', debounce(() => { userState.trang = 1; renderUsers(); }, 350));
document.getElementById('filter-user-status').addEventListener('change', () => { userState.trang = 1; renderUsers(); });
document.getElementById('user-prev').addEventListener('click', () => { if (userState.trang > 1) { userState.trang--; renderUsers(); } });
document.getElementById('user-next').addEventListener('click', () => { if (userState.coTrangSau) { userState.trang++; renderUsers(); } });

function capNhatPhanTrang(prefix, state) {
  document.getElementById(`${prefix}-page-info`).textContent = `Trang ${state.trang}`;
  document.getElementById(`${prefix}-prev`).disabled = state.trang <= 1;
  document.getElementById(`${prefix}-next`).disabled = !state.coTrangSau;
}

let pendingLock = null; // { id, dangHoatDong, hoTen }
function openLockModal(id, dangHoatDong, hoTen) {
  pendingLock = { id, dangHoatDong, hoTen };
  document.getElementById('lock-modal-title').textContent = dangHoatDong ? 'Khóa tài khoản' : 'Mở khóa tài khoản';
  document.getElementById('lock-modal-desc').textContent = dangHoatDong
    ? `${hoTen} sẽ không thể đăng nhập cho đến khi được mở khóa lại.`
    : `${hoTen} sẽ có thể đăng nhập lại bình thường.`;
  document.getElementById('overlay-lock').classList.add('show');
}
document.getElementById('lock-modal-cancel').addEventListener('click', () => document.getElementById('overlay-lock').classList.remove('show'));
document.getElementById('lock-modal-confirm').addEventListener('click', async () => {
  if (!pendingLock) return;
  const btn = document.getElementById('lock-modal-confirm');
  btn.disabled = true;
  try {
    await goiApi(`/admin/nguoi-dung/${pendingLock.id}/trang-thai`, {
      method: 'PATCH',
      body: JSON.stringify({ dangHoatDong: pendingLock.dangHoatDong ? 0 : 1 }),
    });
    document.getElementById('overlay-lock').classList.remove('show');
    renderUsers();
    daTaiSection.delete('tong-quan'); // để tổng quan tự tải lại số liệu mới lần sau ghé qua
    if (document.getElementById('sec-tong-quan').classList.contains('active')) renderTongQuan();
    daTaiSection.delete('nhat-ky');
  } catch (err) {
    hienThiLoi(err.message);
  } finally {
    btn.disabled = false;
  }
});

/* =====================================================================
   SỔ CHI TIÊU
===================================================================== */
async function renderSpaces() {
  const tuKhoa = document.getElementById('filter-space-search').value.trim();
  const loai = document.getElementById('filter-space-type').value;
  const tbody = document.getElementById('tbl-spaces');
  tbody.innerHTML = `<tr><td colspan="6"><div class="loading">Đang tải...</div></td></tr>`;

  try {
    const params = new URLSearchParams({ tuKhoa, loai });
    const rows = await goiApi(`/admin/so-chi-tieu?${params}`);

    tbody.innerHTML = rows.length ? rows.map(s => `
      <tr>
        <td><strong>${s.TenSo}</strong></td>
        <td>${loaiSoPill(s.LoaiSo)}</td>
        <td>${s.DonViTienTe}</td>
        <td>${s.NguoiTao}</td>
        <td>${(s.ThanhVien || []).map(m => `
          <span class="member-chip">${m.Ten}<span class="role ${m.VaiTro === 'ChuSo' ? '' : m.VaiTro === 'QuanTri' ? 'qt' : 'tv'}">${vaiTroLabel(m.VaiTro)}</span></span>
        `).join('')}</td>
        <td>${formatDate(s.NgayTao)}</td>
      </tr>
    `).join('') : `<tr><td colspan="6"><div class="empty">Không tìm thấy sổ chi tiêu phù hợp.</div></td></tr>`;
  } catch (err) {
    hienThiLoi(err.message);
    tbody.innerHTML = `<tr><td colspan="6"><div class="row-error">${err.message}</div></td></tr>`;
  }
}
function vaiTroLabel(v) { return v === 'ChuSo' ? 'Chủ sổ' : v === 'QuanTri' ? 'Quản trị' : 'Thành viên'; }
document.getElementById('filter-space-search').addEventListener('input', debounce(renderSpaces, 350));
document.getElementById('filter-space-type').addEventListener('change', renderSpaces);

/* =====================================================================
   DANH MỤC MẪU
===================================================================== */
async function renderTemplates() {
  const tbody = document.getElementById('tbl-templates');
  tbody.innerHTML = `<tr><td colspan="5"><div class="loading">Đang tải...</div></td></tr>`;
  try {
    const rows = await goiApi('/admin/danh-muc-mau');
    tbody.innerHTML = rows.length ? rows.map(t => `
      <tr>
        <td style="font-size:18px;">${t.BieuTuong}</td>
        <td>${t.TenDanhMuc}</td>
        <td>${t.Loai === 'Chi' ? '<span class="pill danger">Chi</span>' : '<span class="pill ok">Thu</span>'}</td>
        <td>${t.ThuTuSapXep}</td>
        <td><button class="btn small danger" onclick="deleteTemplate(${t.MaDanhMucMau})">Xóa</button></td>
      </tr>
    `).join('') : `<tr><td colspan="5"><div class="empty">Chưa có danh mục mẫu nào.</div></td></tr>`;
  } catch (err) {
    hienThiLoi(err.message);
    tbody.innerHTML = `<tr><td colspan="5"><div class="row-error">${err.message}</div></td></tr>`;
  }
}

async function deleteTemplate(id) {
  if (!confirm('Xóa danh mục mẫu này? Các sổ đã tạo trước đó sẽ không bị ảnh hưởng.')) return;
  try {
    await goiApi(`/admin/danh-muc-mau/${id}`, { method: 'DELETE' });
    renderTemplates();
  } catch (err) {
    hienThiLoi(err.message);
  }
}

document.getElementById('btn-add-template').addEventListener('click', () => {
  document.getElementById('tpl-icon').value = '';
  document.getElementById('tpl-name').value = '';
  document.getElementById('tpl-type').value = 'Chi';
  document.getElementById('overlay-template').classList.add('show');
});
document.getElementById('tpl-modal-cancel').addEventListener('click', () => document.getElementById('overlay-template').classList.remove('show'));
document.getElementById('tpl-modal-confirm').addEventListener('click', async () => {
  const icon = document.getElementById('tpl-icon').value.trim() || '📌';
  const name = document.getElementById('tpl-name').value.trim();
  const type = document.getElementById('tpl-type').value;
  if (!name) { alert('Vui lòng nhập tên danh mục.'); return; }

  const btn = document.getElementById('tpl-modal-confirm');
  btn.disabled = true;
  try {
    await goiApi('/admin/danh-muc-mau', {
      method: 'POST',
      body: JSON.stringify({ tenDanhMuc: name, bieuTuong: icon, loai: type }),
    });
    document.getElementById('overlay-template').classList.remove('show');
    renderTemplates();
  } catch (err) {
    hienThiLoi(err.message);
  } finally {
    btn.disabled = false;
  }
});

/* =====================================================================
   GIAO DỊCH
===================================================================== */
const txState = { trang: 1, soDong: 20, coTrangSau: false };

async function renderTransactions() {
  const tuKhoa = document.getElementById('filter-tx-search').value.trim();
  const loai = document.getElementById('filter-tx-type').value;
  const tbody = document.getElementById('tbl-transactions');
  tbody.innerHTML = `<tr><td colspan="6"><div class="loading">Đang tải...</div></td></tr>`;

  try {
    const params = new URLSearchParams({ tuKhoa, loai, trang: txState.trang, soDong: txState.soDong });
    const rows = await goiApi(`/admin/giao-dich?${params}`);
    txState.coTrangSau = rows.length === txState.soDong;

    tbody.innerHTML = rows.length ? rows.map(t => `
      <tr>
        <td>${t.TenSo}</td>
        <td>${t.NguoiTao}</td>
        <td>${txTypePill(t.Loai)}</td>
        <td class="amount ${t.Loai === 'Thu' ? 'thu' : t.Loai === 'Chi' ? 'chi' : 'chuyenkhoan'}">${t.Loai === 'Chi' ? '-' : t.Loai === 'Thu' ? '+' : ''}${formatVND(t.SoTien)}</td>
        <td>${t.GhiChu || '—'}</td>
        <td>${formatDate(t.NgayGiaoDich)}</td>
      </tr>
    `).join('') : `<tr><td colspan="6"><div class="empty">Không tìm thấy giao dịch phù hợp.</div></td></tr>`;

    capNhatPhanTrang('tx', txState);
  } catch (err) {
    hienThiLoi(err.message);
    tbody.innerHTML = `<tr><td colspan="6"><div class="row-error">${err.message}</div></td></tr>`;
  }
}
function txTypePill(loai) {
  if (loai === 'Thu') return '<span class="pill ok">Thu</span>';
  if (loai === 'Chi') return '<span class="pill danger">Chi</span>';
  return '<span class="pill muted">Chuyển khoản</span>';
}
document.getElementById('filter-tx-search').addEventListener('input', debounce(() => { txState.trang = 1; renderTransactions(); }, 350));
document.getElementById('filter-tx-type').addEventListener('change', () => { txState.trang = 1; renderTransactions(); });
document.getElementById('tx-prev').addEventListener('click', () => { if (txState.trang > 1) { txState.trang--; renderTransactions(); } });
document.getElementById('tx-next').addEventListener('click', () => { if (txState.coTrangSau) { txState.trang++; renderTransactions(); } });

/* =====================================================================
   NHẬT KÝ HỆ THỐNG
===================================================================== */
const logState = { trang: 1, soDong: 20, coTrangSau: false };

async function renderLogs() {
  const tbody = document.getElementById('tbl-logs');
  tbody.innerHTML = `<tr><td colspan="5"><div class="loading">Đang tải...</div></td></tr>`;
  try {
    const params = new URLSearchParams({ trang: logState.trang, soDong: logState.soDong });
    const rows = await goiApi(`/admin/nhat-ky?${params}`);
    logState.coTrangSau = rows.length === logState.soDong;

    tbody.innerHTML = rows.length ? rows.map(l => `
      <tr>
        <td>${formatDateTime(l.NgayTao)}</td>
        <td><code class="mono">${l.HanhDong}</code></td>
        <td>${l.DoiTuong}${l.MaDoiTuong ? ' #' + l.MaDoiTuong : ''}</td>
        <td>${l.NguoiThucHien || 'Hệ thống'}</td>
        <td><code class="mono">${l.DiaChiIP || '—'}</code></td>
      </tr>
    `).join('') : `<tr><td colspan="5"><div class="empty">Chưa có nhật ký nào.</div></td></tr>`;

    capNhatPhanTrang('log', logState);
  } catch (err) {
    hienThiLoi(err.message);
    tbody.innerHTML = `<tr><td colspan="5"><div class="row-error">${err.message}</div></td></tr>`;
  }
}
document.getElementById('log-prev').addEventListener('click', () => { if (logState.trang > 1) { logState.trang--; renderLogs(); } });
document.getElementById('log-next').addEventListener('click', () => { if (logState.coTrangSau) { logState.trang++; renderLogs(); } });

/* =====================================================================
   KHỞI TẠO — chỉ tải tab Tổng quan trước, các tab khác tải khi bấm vào
===================================================================== */
taiDuLieuSection('tong-quan');
