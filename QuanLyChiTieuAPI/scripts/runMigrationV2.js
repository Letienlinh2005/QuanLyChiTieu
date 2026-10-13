const pool = require('../src/config/database');

async function migrate() {
    try {
        console.log('--- Checking & running migration_v2 ---');

        const [colsVay] = await pool.query("SHOW COLUMNS FROM VayVon LIKE 'MaVi'");
        if (colsVay.length === 0) {
            console.log('Adding column MaVi to VayVon...');
            await pool.query('ALTER TABLE VayVon ADD COLUMN MaVi BIGINT UNSIGNED NULL');
            try {
                await pool.query('ALTER TABLE VayVon ADD CONSTRAINT fk_vayvon_mavi FOREIGN KEY (MaVi) REFERENCES Vi(MaVi) ON DELETE SET NULL');
            } catch (fkErr) {
                console.warn('Warning adding foreign key constraint fk_vayvon_mavi:', fkErr.message);
            }
            console.log('Column MaVi added successfully to VayVon.');
        } else {
            console.log('Column MaVi already exists in VayVon.');
        }

        const [colsGD] = await pool.query("SHOW COLUMNS FROM GiaoDich LIKE 'AnhBangChung'");
        if (colsGD.length === 0) {
            console.log('Adding column AnhBangChung to GiaoDich...');
            await pool.query("ALTER TABLE GiaoDich ADD COLUMN AnhBangChung MEDIUMTEXT NULL COMMENT 'URL hoặc base64 ảnh bằng chứng giao dịch'");
            console.log('Column AnhBangChung added successfully to GiaoDich.');
        } else {
            console.log('Column AnhBangChung already exists in GiaoDich.');
        }

        // Drop check constraint nếu có để cho phép giao dịch vay/tất toán
        try {
            await pool.query('ALTER TABLE GiaoDich DROP CHECK CHK_GiaoDich_ThuChi_CoDanhMuc');
            console.log('Dropped CHK_GiaoDich_ThuChi_CoDanhMuc.');
        } catch (_) {}

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
