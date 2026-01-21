const { getPool, closePool } = require('../src/config/database');

async function run() {
    try {
        console.log('🚀 Starting schema update...');
        const pool = await getPool();

        // Check if column exists
        const checkQuery = `
            SELECT 1 
            FROM sys.columns 
            WHERE Name = N'metadata' 
            AND Object_ID = Object_ID(N'production_lines')
        `;

        const checkResult = await pool.request().query(checkQuery);

        if (checkResult.recordset.length === 0) {
            console.log('ℹ️ Column "metadata" does not exist in "production_lines". Adding it...');
            await pool.request().query(`
                ALTER TABLE production_lines
                ADD metadata NVARCHAR(MAX) NULL;
            `);
            console.log('✅ Column "metadata" added successfully.');
        } else {
            console.log('✅ Column "metadata" already exists. No action needed.');
        }

    } catch (error) {
        console.error('❌ Error updating schema:', error);
    } finally {
        await closePool();
    }
}

run();
