const sql = require('mssql');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
    server: process.env.AZURE_SQL_SERVER,
    database: process.env.AZURE_SQL_DATABASE,
    user: process.env.AZURE_SQL_USER,
    password: process.env.AZURE_SQL_PASSWORD,
    options: {
        encrypt: true,
        trustServerCertificate: false,
    },
};

async function applyMigration() {
    try {
        console.log('🔄 Connecting to Azure SQL Database...');
        const pool = await sql.connect(config);
        console.log('✅ Connected!');

        const migrationPath = path.join(__dirname, '../migrations/003_add_shift_column.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📝 Executing migration: 003_add_shift_column.sql');

        // Split by GO if necessary, but for this simple ALTER it might be fine as one block or split.
        // The previous runner split by GO, let's do the same for consistency.
        const statements = migrationSQL
            .split(/\r?\nGO\r?\n/)
            .filter(stmt => stmt.trim().length > 0);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement.length === 0) continue;

            console.log(`Executing statement ${i + 1}...`);
            await pool.request().query(statement);
            console.log(`✅ Statement ${i + 1} executed.`);
        }

        console.log('\n🎉 Migration 003 applied successfully!');
        await pool.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

applyMigration();
