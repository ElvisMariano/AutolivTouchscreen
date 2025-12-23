require('dotenv').config();
const { syncMachines } = require('./src/services/l2lSyncService');
const { closePool, getPool } = require('./src/config/database');

async function runDebugResult() {
    console.log('🚀 Starting sync for 5 machines...');
    try {
        // Allow full sync to run to populate descriptions
        // NOTE: The previous hardcoded 'exit' inside l2lSyncService MUST be removed first if it exists.
        // I removed it in the last cleanup step, so it should be fine.
        await syncMachines();

        console.log('✅ Sync finished. Verifying data...');
        const pool = await getPool();
        const result = await pool.request().query('SELECT TOP 5 id, description FROM work_stations WHERE description IS NOT NULL');
        console.log('Sample Data:', JSON.stringify(result.recordset, null, 2));

        const countResult = await pool.request().query('SELECT COUNT(*) as count FROM work_stations WHERE description IS NOT NULL AND description != \'\'');
        console.log('Total stations with description:', countResult.recordset[0].count);

    } catch (error) {
        console.error('❌ Debug sync failed:', error);
    } finally {
        await closePool();
    }
}

runDebugResult();
