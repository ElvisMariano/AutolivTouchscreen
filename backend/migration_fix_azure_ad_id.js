const { getPool, sql } = require('./src/config/database');

async function runMigration() {
    try {
        const pool = await getPool();

        console.log('🔍 Identifying Unique Constraint on azure_ad_id...');

        // Find the constraint name for azure_ad_id
        const constraintQuery = `
            SELECT kc.name AS ConstraintName
            FROM sys.key_constraints kc
            INNER JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
            INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
            WHERE kc.parent_object_id = OBJECT_ID('users')
            AND c.name = 'azure_ad_id'
            AND kc.type = 'UQ'
        `;

        const result = await pool.request().query(constraintQuery);

        if (result.recordset.length > 0) {
            const constraintName = result.recordset[0].ConstraintName;
            console.log(`✅ Found constraint: ${constraintName}`);

            console.log('🗑️ Dropping strict UNIQUE constraint...');
            await pool.request().query(`ALTER TABLE users DROP CONSTRAINT ${constraintName}`);

            console.log('✨ Creating Filtered Unique Index...');
            await pool.request().query(`
                CREATE UNIQUE NONCLUSTERED INDEX UQ_users_azure_ad_id 
                ON users(azure_ad_id) 
                WHERE azure_ad_id IS NOT NULL
            `);
            console.log('✅ Migration applied successfully!');
        } else {
            console.warn('⚠️ No strict UNIQUE constraint found on azure_ad_id.');

            // Check if filtered index already exists to avoid duplication errors?
            // Or maybe the error was on a different column?
            // To be safe, let's just try to create the filtered index if it doesn't exist.
            try {
                await pool.request().query(`
                    CREATE UNIQUE NONCLUSTERED INDEX UQ_users_azure_ad_id 
                    ON users(azure_ad_id) 
                    WHERE azure_ad_id IS NOT NULL
                `);
                console.log('✅ Created Filtered Unique Index (Constraint was missing or already dropped).');
            } catch (e) {
                console.log('ℹ️ Index creation skipped/failed (likely already exists):', e.message);
            }
        }
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
    process.exit();
}

runMigration();
