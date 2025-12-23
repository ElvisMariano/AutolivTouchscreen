require('dotenv').config();
const { getPool } = require('./src/config/database');

async function runMigration() {
    console.log('🚀 Starting migration...');
    let pool;
    try {
        pool = await getPool();

        // Check if column exists first to avoid errors
        const checkResult = await pool.request().query(`
            SELECT COL_LENGTH('work_stations', 'description') as col_len;
        `);

        if (checkResult.recordset[0].col_len !== null) {
            console.log('⚠️ Column description already exists in work_stations.');
        } else {
            console.log('🛠️ Adding description column to work_stations...');
            await pool.request().query(`
                ALTER TABLE work_stations ADD description NVARCHAR(MAX);
            `);
            console.log('✅ Column description added successfully.');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        if (pool) await pool.close();
        // Force exit in case pool closing hangs
        process.exit(0);
    }
}

runMigration();
