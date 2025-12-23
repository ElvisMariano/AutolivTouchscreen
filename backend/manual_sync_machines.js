const path = require('path');
require('dotenv').config();
const syncService = require('./src/services/l2lSyncService');
const { sql, getPool } = require('./src/config/database');

async function run() {
    console.log('🏁 Starting Manual Machine Sync...');
    try {
        const result = await syncService.syncMachines('manual-debug-user');
        console.log('✅ Sync Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ Fatal Error:', error);
    }
    process.exit(0);
}

run();
