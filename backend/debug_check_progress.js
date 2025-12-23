require('dotenv').config();
const { getPool } = require('./src/config/database');

async function checkProgress() {
    try {
        const pool = await getPool();
        const result = await pool.request().query("SELECT COUNT(*) as count FROM work_stations WHERE description IS NOT NULL AND description != ''");
        console.log('Descriptions Populated:', result.recordset[0].count);

        const sample = await pool.request().query("SELECT TOP 3 name, description FROM work_stations WHERE description IS NOT NULL AND description != ''");
        console.log('Sample:', JSON.stringify(sample.recordset, null, 2));

    } catch (error) {
        console.error('❌ Check failed:', error);
    } finally {
        const { closePool } = require('./src/config/database');
        if (closePool) await closePool();
    }
}

checkProgress();
