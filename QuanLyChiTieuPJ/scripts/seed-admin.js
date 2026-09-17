/**
 * Tạo (hoặc nâng cấp) một tài khoản Quản trị viên để đăng nhập trang /admin.
 *
 * Cách dùng (chạy trong thư mục QuanLyChiTieuAPI, sau khi đã `npm install`
 * và đã cấu hình đúng file .env):
 *
 *   node scripts/seed-admin.js <email> <mat_khau> ["Họ Tên"]
 *
 * Ví dụ:
 *   node scripts/seed-admin.js admin@sochitieu.local MatKhauManh123 "Quản trị viên"
 *
 * - Nếu email CHƯA tồn tại  -> tạo tài khoản mới với vai trò QuanTriVien.
 * - Nếu email ĐÃ tồn tại    -> đặt lại mật khẩu (theo giá trị bạn truyền vào)
 *                              và nâng vai trò tài khoản đó lên QuanTriVien,
 *                              đồng thời đảm bảo tài khoản đang hoạt động
 *                              (không bị khóa).
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/database');

async function main() {
    const [, , email, matKhau, hoTenArg] = process.argv;

    if (!email || !matKhau) {
        console.log('Thiếu tham số.');
        console.log('Cách dùng: node scripts/seed-admin.js <email> <mat_khau> ["Ho Ten"]');
        process.exit(1);
    }
    if (matKhau.length < 6) {
        console.log('Mật khẩu nên có ít nhất 6 ký tự.');
        process.exit(1);
    }

    const hoTen = hoTenArg || 'Quản trị viên';

    try {
        const matKhauHash = await bcrypt.hash(matKhau, 10);

        const [existed] = await pool.query(
            'SELECT MaNguoiDung FROM NguoiDung WHERE Email = ?',
            [email]
        );

        if (existed.length > 0) {
            const id = existed[0].MaNguoiDung;
            await pool.query(
                `UPDATE NguoiDung
                 SET MatKhauHash = ?, VaiTroHeThong = 'QuanTriVien', DangHoatDong = 1, HoTen = ?
                 WHERE MaNguoiDung = ?`,
                [matKhauHash, hoTen, id]
            );
            console.log(`✔ Đã cập nhật tài khoản có sẵn (Mã #${id}) thành Quản trị viên.`);
        } else {
            const [result] = await pool.query(
                `INSERT INTO NguoiDung (Email, MatKhauHash, HoTen, VaiTroHeThong, DangHoatDong)
                 VALUES (?, ?, ?, 'QuanTriVien', 1)`,
                [email, matKhauHash, hoTen]
            );
            console.log(`✔ Đã tạo tài khoản Quản trị viên mới (Mã #${result.insertId}).`);
        }

        console.log('');
        console.log(`  Email     : ${email}`);
        console.log(`  Mật khẩu  : (giá trị bạn vừa nhập)`);
        console.log('');
        console.log('Đăng nhập tại: http://localhost:3000/admin/login.html');
    } catch (err) {
        console.error('✘ Lỗi:', err.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();