/**
 * Script tạo tài khoản quản trị viên.
 *
 * Cách dùng (chạy trong thư mục QuanLyChiTieuAPI):
 *   node scripts/taoQuanTriVien.js admin@gmail.com MatKhau123 "Nguyễn Văn Admin"
 *
 * - Nếu email chưa tồn tại: tạo mới tài khoản với vai trò QuanTriVien.
 * - Nếu email đã tồn tại: chỉ nâng tài khoản đó lên quyền QuanTriVien
 *   (giữ nguyên mật khẩu cũ, không ghi đè).
 */

const bcrypt = require('bcryptjs');
const pool = require('../src/config/database');
require('dotenv').config();

async function main() {
    const [email, matKhau, hoTen] = process.argv.slice(2);

    if (!email || !matKhau || !hoTen) {
        console.error('Thiếu tham số. Cách dùng:');
        console.error('  node scripts/taoQuanTriVien.js <email> <matKhau> "<Họ tên>"');
        process.exit(1);
    }

    try {
        const [existed] = await pool.query(
            'SELECT MaNguoiDung, HoTen FROM NguoiDung WHERE Email = ?',
            [email]
        );

        if (existed.length > 0) {
            await pool.query(
                `UPDATE NguoiDung SET VaiTroHeThong = 'QuanTriVien', DangHoatDong = 1
                 WHERE MaNguoiDung = ?`,
                [existed[0].MaNguoiDung]
            );
            console.log(`Đã nâng tài khoản "${existed[0].HoTen}" (${email}) lên quyền Quản trị viên.`);
            console.log('Mật khẩu giữ nguyên như cũ.');
            process.exit(0);
        }

        const matKhauHash = await bcrypt.hash(matKhau, 10);

        const [result] = await pool.query(
            `INSERT INTO NguoiDung (Email, MatKhauHash, HoTen, VaiTroHeThong)
             VALUES (?, ?, ?, 'QuanTriVien')`,
            [email, matKhauHash, hoTen]
        );

        console.log(`Đã tạo tài khoản Quản trị viên thành công.`);
        console.log(`  Mã người dùng: ${result.insertId}`);
        console.log(`  Email: ${email}`);
        console.log(`Bạn có thể đăng nhập vào trang quản trị bằng tài khoản này.`);
        process.exit(0);
    } catch (err) {
        console.error('Lỗi khi tạo tài khoản quản trị:', err.message);
        process.exit(1);
    }
}

main();
