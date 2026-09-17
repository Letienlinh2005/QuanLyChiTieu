// Nếu đã đăng nhập sẵn với vai trò quản trị viên thì vào thẳng dashboard
(function () {
  const nd = layNguoiDungDangNhap();
  if (layToken() && nd && nd.vaiTroHeThong === 'QuanTriVien') {
    window.location.href = 'index.html';
  }
})();

const formLogin = document.getElementById('form-login');
const oErr = document.getElementById('login-err');
const btnSubmit = document.getElementById('login-submit');

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  oErr.style.display = 'none';

  const email = document.getElementById('login-email').value.trim();
  const matKhau = document.getElementById('login-matkhau').value;

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Đang đăng nhập...';

  try {
    const res = await fetch(API_BASE + '/auth/dang-nhap-quan-tri', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, matKhau }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || 'Đăng nhập thất bại');
    }

    luuPhienDangNhap(data.token, data.nguoiDung);
    window.location.href = 'index.html';
  } catch (err) {
    oErr.textContent = err.message;
    oErr.style.display = 'block';
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Đăng nhập';
  }
});
