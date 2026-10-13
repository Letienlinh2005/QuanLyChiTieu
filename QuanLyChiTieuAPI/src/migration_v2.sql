-- Migration: Thêm cột MaVi vào bảng VayVon (liên kết ví để tất toán tự động)
ALTER TABLE VayVon
ADD COLUMN IF NOT EXISTS MaVi BIGINT UNSIGNED NULL,
ADD CONSTRAINT fk_vayvon_mavi FOREIGN KEY (MaVi) REFERENCES Vi(MaVi) ON DELETE SET NULL;

-- Migration: Thêm cột AnhBangChung vào bảng GiaoDich (lưu base64 hoặc URL ảnh bằng chứng)
ALTER TABLE GiaoDich
ADD COLUMN IF NOT EXISTS AnhBangChung MEDIUMTEXT NULL COMMENT 'URL hoặc base64 ảnh bằng chứng giao dịch';
